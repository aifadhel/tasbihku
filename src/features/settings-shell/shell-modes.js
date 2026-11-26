import { dispatch } from '../../app/command-bus.js';
import { t } from '../../shared/i18n.js';
import { vibrate } from '../../shared/media.js';
import { saveState, state } from '../../shared/store.js';
import { SVG_ICONS } from '../../shared/svg-icons.js';
import { releaseWakeLock, requestWakeLock } from '../../shared/system.js';

export function switchAppMode(mode, save = true) {
  state.appMode = mode;
  if (save) saveState();
  if (typeof document === 'undefined') return;

  const tasbihBtn = document.getElementById('mode-tasbih-btn');
  const habitBtn = document.getElementById('mode-habit-btn');
  if (tasbihBtn && habitBtn) {
    tasbihBtn.classList.toggle('active', mode === 'tasbih');
    habitBtn.classList.toggle('active', mode !== 'tasbih');
  }

  const tasbihView = document.getElementById('tasbih-dashboard-view');
  const habitView = document.getElementById('habit-dashboard-view');
  if (tasbihView && habitView) {
    if (mode === 'tasbih') {
      tasbihView.style.display = 'flex';
      habitView.style.display = 'none';
      if (state.keepScreenOn) requestWakeLock();
    } else {
      tasbihView.style.display = 'none';
      habitView.style.display = 'flex';
      releaseWakeLock();
      dispatch('habits:render').catch(() => {});
    }
  }

  const isTasbih = mode === 'tasbih';
  const menuTitle = document.getElementById('menu-page-title');
  if (menuTitle) menuTitle.innerText = t(isTasbih ? 'menu_title' : 'section_settings');
  const setDisplay = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.style.display = val;
  };
  setDisplay('menu-tasbih-sections', isTasbih ? 'block' : 'none');
  setDisplay('menu-item-sound', isTasbih ? 'flex' : 'none');
  if (!isTasbih) setDisplay('sound-device-hint', 'none');
  setDisplay('menu-item-arabic-size', isTasbih ? 'flex' : 'none');
  setDisplay('menu-tasbih-reminders', isTasbih ? 'block' : 'none');
}

export function updateResetButtonState() {
  if (typeof document === 'undefined') return;
  const resetBtn = document.getElementById('dashboard-reset-btn');
  if (!resetBtn) return;

  let isEnabled = false;
  let labelKey = 'btn_reset';
  if (state.dashboardMode === 'counting') {
    isEnabled = (state.freeCount || 0) > 0;
    labelKey = 'modal_reset_free_title';
  } else if (state.dashboardMode === 'stopwatch') {
    isEnabled = Boolean(state.stopwatch && (state.stopwatch.elapsedTime > 0 || state.stopwatch.running));
    labelKey = 'modal_reset_stopwatch_title';
  } else if (state.dashboardMode === 'timer') {
    isEnabled = Boolean(state.timer && (state.timer.remainingTime !== null || state.timer.targetDuration !== null || state.timer.running));
    labelKey = 'modal_reset_timer_title';
  }

  resetBtn.disabled = !isEnabled;
  resetBtn.classList.toggle('is-disabled', !isEnabled);
  resetBtn.setAttribute('aria-disabled', isEnabled ? 'false' : 'true');
  const label = t(labelKey);
  resetBtn.setAttribute('aria-label', label);
  resetBtn.setAttribute('title', label);
}

export function switchDashboardMode(mode) {
  const DASHBOARD_MODES = ['counting', 'stopwatch', 'timer'];
  const activeIdx = Math.max(0, DASHBOARD_MODES.indexOf(mode));

  const switcher = document.getElementById('dashboard-mode-switcher');
  if (switcher) {
    switcher.setAttribute('data-active-index', activeIdx);
    switcher.style.setProperty('--tab-active-index', activeIdx);
  }
  document.querySelectorAll('.segment-btn').forEach((btn) => {
    const isActive = btn.getAttribute('data-mode') === mode;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    btn.setAttribute('tabindex', isActive ? '0' : '-1');
  });

  vibrate(12);
  state.dashboardMode = mode;
  saveState();

  ['counting-display-area', 'stopwatch-display-area', 'timer-display-area'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  dispatch('tasbih:stopwatch-stop').catch(() => {});
  dispatch('tasbih:timer-stop').catch(() => {});

  const titleEl = document.getElementById('dashboard-mode-title');
  if (mode === 'counting') {
    const area = document.getElementById('counting-display-area');
    if (area) area.style.display = 'block';
    if (titleEl) titleEl.innerText = t('title_free_count');
    const emojiEl = document.getElementById('dashboard-main-emoji');
    const labelEl = document.getElementById('dashboard-main-label');
    const btnEl = document.getElementById('dashboard-main-btn');
    if (emojiEl) emojiEl.innerHTML = SVG_ICONS.tap;
    if (labelEl) labelEl.innerText = t('btn_tap');
    if (btnEl) {
      btnEl.style.background = 'var(--md-sys-color-primary)';
      btnEl.classList.remove('is-paused');
    }
  } else if (mode === 'stopwatch') {
    const area = document.getElementById('stopwatch-display-area');
    if (area) area.style.display = 'block';
    if (titleEl) titleEl.innerText = t('mode_stopwatch');
    dispatch('tasbih:stopwatch-ui').catch(() => {});
  } else if (mode === 'timer') {
    const area = document.getElementById('timer-display-area');
    if (area) area.style.display = 'block';
    if (titleEl) titleEl.innerText = t('mode_timer');
    dispatch('tasbih:timer-ui').catch(() => {});
  }
  updateResetButtonState();
}

export function syncLocalizedModeLabels() {
  if (typeof document === 'undefined') return;
  const menuTitle = document.getElementById('menu-page-title');
  if (menuTitle) menuTitle.innerText = t((state.appMode || 'tasbih') === 'tasbih' ? 'menu_title' : 'section_settings');

  const titleEl = document.getElementById('dashboard-mode-title');
  const mode = state.dashboardMode || 'counting';
  if (mode === 'counting') {
    if (titleEl) titleEl.innerText = t('title_free_count');
    const labelEl = document.getElementById('dashboard-main-label');
    if (labelEl) labelEl.innerText = t('btn_tap');
  } else if (mode === 'stopwatch') {
    if (titleEl) titleEl.innerText = t('mode_stopwatch');
    dispatch('tasbih:stopwatch-ui').catch(() => {});
  } else if (mode === 'timer') {
    if (titleEl) titleEl.innerText = t('mode_timer');
    dispatch('tasbih:timer-ui').catch(() => {});
  }
  updateResetButtonState();
}

