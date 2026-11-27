import { dispatch, registerCommand } from '../../app/command-bus.js';
import { registerPageHook } from '../../app/slots.js';
import { APP_VERSION } from '../../app/version.js';
import { applyTranslations, setLanguage } from '../../shared/i18n.js';
import { applyVibrationCapability } from '../../shared/media.js';
import { saveState, state, subscribe } from '../../shared/store.js';
import { releaseWakeLock, requestWakeLock, toggleWakeLock } from '../../shared/system.js';
import { dismissInstallPrompt, promptAppInstall, syncInstallUI } from './app-installer.js';
import { checkForAppUpdate, syncVersionUI } from './app-updater.js';
import { closeModal, goBack, initRouterListeners, showModal, showPage } from './router-nav.js';
import {
  exportData,
  handleHashRouting,
  importDataProcess,
  triggerImport
} from './backup-routing.js';
import {
  switchAppMode,
  switchDashboardMode,
  syncLocalizedModeLabels,
  updateResetButtonState
} from './shell-modes.js';
import {
  applyOledMode,
  toggleDzikirReminder,
  toggleOledMode,
  toggleSoundMode,
  toggleVibrationMode,
  updateArabicFontSize,
  updateDzikirReminderTime,
  updateVibrationInterval
} from './theme-settings.js';

let initialized = false;

function initShellUI() {
  if (typeof document === 'undefined') return;
  const setChk = (id, val) => { const el = document.getElementById(id); if (el) el.checked = Boolean(val); };
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };

  setVal('username-input', state.userName);
  setChk('toggle-oled', state.oledMode);
  setChk('toggle-sound', state.soundEnabled);
  setChk('toggle-vibration', state.vibrationEnabled);
  setChk('toggle-wakelock', state.keepScreenOn);

  const vibSelect = document.getElementById('select-vibration-interval');
  if (vibSelect) {
    vibSelect.value = state.vibrationInterval || 0;
    vibSelect.disabled = !state.vibrationEnabled;
  }

  const syncReminder = (kind, enabled, timeVal, fallback) => {
    setChk(`toggle-${kind}-reminder`, enabled);
    const timeEl = document.getElementById(`input-${kind}-reminder-time`);
    if (timeEl) {
      timeEl.value = timeVal || fallback;
      timeEl.style.display = enabled ? 'block' : 'none';
    }
  };
  syncReminder('pagi', state.pagiReminderEnabled, state.pagiReminderTime, '06:00');
  syncReminder('petang', state.petangReminderEnabled, state.petangReminderTime, '16:00');

  applyOledMode(state.oledMode);
  applyVibrationCapability();
  updateArabicFontSize(state.arabicFontSize, false);
  switchDashboardMode(state.dashboardMode || 'counting');
  switchAppMode(state.appMode || 'tasbih', false);
  handleHashRouting();

  syncVersionUI();
  syncInstallUI();
  const aboutVerEl = document.getElementById('about-app-version');
  if (aboutVerEl) aboutVerEl.textContent = `TasbihKu v${APP_VERSION}`;
}

export function initFeature() {
  initRouterListeners();

  registerCommand('ui:show-modal', (p) => showModal(p?.title, p?.message, p?.onYes, Boolean(p?.isAlert), p?.onNo ?? null));
  registerCommand('ui:close-modal', () => closeModal(false));
  registerCommand('ui:update-reset-btn', updateResetButtonState);
  registerCommand('settings:show-page', (p) => showPage(p?.pageId ?? p?.arg ?? p, p?.pushToHistory ?? true));
  registerCommand('settings:go-back', (p) => goBack(p?.fallback ?? p?.arg ?? (typeof p === 'string' ? p : 'page-dashboard')));
  registerCommand('settings:switch-app-mode', (p) => switchAppMode(p?.mode ?? p?.arg ?? p, p?.save ?? true));
  registerCommand('settings:switch-dashboard-mode', (p) => switchDashboardMode(p?.mode ?? p?.arg ?? p));
  registerCommand('settings:set-language', (p) => setLanguage(p?.arg ?? (p?.value || undefined) ?? p?.language ?? p));
  registerCommand('settings:toggle-wakelock', (p) => toggleWakeLock(Boolean(p?.checked ?? p)));
  registerCommand('settings:toggle-oled', (p) => toggleOledMode(Boolean(p?.checked ?? p)));
  registerCommand('settings:toggle-sound', (p) => toggleSoundMode(Boolean(p?.checked ?? p)));
  registerCommand('settings:toggle-vibration', (p) => toggleVibrationMode(Boolean(p?.checked ?? p)));
  registerCommand('settings:set-vibration-interval', (p) => updateVibrationInterval(p?.value ?? p?.arg ?? p));
  registerCommand('settings:set-arabic-size', (p) => updateArabicFontSize(p?.value ?? p?.arg ?? p));
  registerCommand('settings:toggle-pagi-reminder', (p) => toggleDzikirReminder('pagi', Boolean(p?.checked ?? p)));
  registerCommand('settings:set-pagi-time', (p) => updateDzikirReminderTime('pagi', p?.value ?? p?.arg ?? p));
  registerCommand('settings:toggle-petang-reminder', (p) => toggleDzikirReminder('petang', Boolean(p?.checked ?? p)));
  registerCommand('settings:set-petang-time', (p) => updateDzikirReminderTime('petang', p?.value ?? p?.arg ?? p));
  registerCommand('settings:export-data', exportData);
  registerCommand('settings:trigger-import', triggerImport);
  registerCommand('settings:import-data', (p) => { if (p?.file) importDataProcess(p.file); });
  registerCommand('settings:update-username', (p) => { state.userName = p?.value ?? ''; saveState(); });
  registerCommand('settings:init-ui', initShellUI);
  registerCommand('settings:handle-routing', handleHashRouting);
  registerCommand('settings:check-update', () => checkForAppUpdate());
  registerCommand('settings:install-app', () => promptAppInstall());
  registerCommand('settings:dismiss-install', () => dismissInstallPrompt());

  if (initialized) return;
  initialized = true;

  registerPageHook('page-menu', () => { dispatch('dzikir:render-custom-list').catch(() => {}); });
  registerPageHook('page-dashboard', () => {
    const tasbihView = document.getElementById('tasbih-dashboard-view');
    const habitView = document.getElementById('habit-dashboard-view');
    if (state.appMode === 'tasbih') {
      if (tasbihView) tasbihView.style.display = 'flex';
      if (habitView) habitView.style.display = 'none';
      if (state.keepScreenOn) requestWakeLock();
    } else if (state.appMode === 'habit') {
      if (tasbihView) tasbihView.style.display = 'none';
      if (habitView) habitView.style.display = 'flex';
      releaseWakeLock();
      dispatch('habits:render').catch(() => {});
    }
    dispatch('habits:render-stats').catch(() => {});
    updateResetButtonState();
  });

  subscribe('freeCount', (s) => {
    const el = document.getElementById('free-counter');
    if (el) el.innerText = s.freeCount;
    updateResetButtonState();
  });
  subscribe('targetLimit', (s) => {
    const el = document.getElementById('free-target-display');
    if (el) el.innerText = s.targetLimit > 0 ? s.targetLimit : '∞';
  });
  subscribe('userName', (s) => {
    const el = document.getElementById('username-input');
    if (el) el.value = s.userName;
  });
  subscribe('activityLog', () => {
    dispatch('habits:render-stats').catch(() => {});
    dispatch('habits:update-streak').catch(() => {});
  });
  subscribe(['habits', 'habitRepetitions'], () => {
    dispatch('habits:render').catch(() => {});
  });
  subscribe('vibrationInterval', (s) => {
    const el = document.getElementById('select-vibration-interval');
    if (el) el.value = s.vibrationInterval || 0;
  });
  subscribe('vibrationEnabled', (s) => {
    const el = document.getElementById('select-vibration-interval');
    if (el) el.disabled = !s.vibrationEnabled;
  });

  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('languageChanged', () => {
      applyTranslations();
      syncLocalizedModeLabels();
      syncVersionUI();
      dispatch('dzikir:render-custom-list').catch(() => {});
      dispatch('habits:render').catch(() => {});
      dispatch('habits:render-stats').catch(() => {});
      dispatch('habits:update-streak').catch(() => {});
      const playerPage = document.getElementById('page-player');
      if (playerPage && playerPage.classList.contains('active')) {
        dispatch('dzikir:player-update').catch(() => {});
      }
    });
    window.addEventListener('hashchange', handleHashRouting);
    window.addEventListener('installPromptChanged', syncInstallUI);
  }
}
