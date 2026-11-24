import { dispatch } from '../../app/command-bus.js';
import { t } from '../../shared/i18n.js';
import {
  isSoundSystemFailed,
  isVibrationSupported,
  playTapSound,
  showSoundHint,
  vibrate
} from '../../shared/media.js';
import { saveState, state } from '../../shared/store.js';
import { showModal } from './router-nav.js';

export function applyOledMode(isOled) {
  if (typeof document === 'undefined') return;
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (isOled) {
    document.body.classList.add('oled-mode');
    if (metaTheme) metaTheme.setAttribute('content', '#000000');
  } else {
    document.body.classList.remove('oled-mode');
    if (metaTheme) metaTheme.setAttribute('content', '#0e1b15');
  }
}

export function toggleOledMode(isChecked) {
  state.oledMode = isChecked;
  saveState();
  applyOledMode(isChecked);
}

export function toggleSoundMode(isChecked) {
  if (isChecked && isSoundSystemFailed()) {
    const toggleEl = document.getElementById('toggle-sound');
    if (toggleEl) toggleEl.checked = false;
    showModal(t('modal_audio_unavail_title'), t('modal_audio_unavail_msg'), null, true);
    return;
  }
  state.soundEnabled = isChecked;
  saveState();
  if (isChecked) {
    playTapSound();
    showSoundHint();
  } else {
    const hintEl = document.getElementById('sound-device-hint');
    if (hintEl) hintEl.style.display = 'none';
  }
}

export function toggleVibrationMode(isChecked) {
  if (isChecked && !isVibrationSupported()) {
    const toggleEl = document.getElementById('toggle-vibration');
    if (toggleEl) toggleEl.checked = false;
    showModal(t('modal_vib_unsupported_title'), t('modal_vib_unsupported_msg'), null, true);
    return;
  }
  state.vibrationEnabled = isChecked;
  saveState();

  const selectVibrIntervalEl = document.getElementById('select-vibration-interval');
  if (selectVibrIntervalEl) selectVibrIntervalEl.disabled = !isChecked;

  if (isChecked) vibrate([30, 50, 30]);
}

export function updateVibrationInterval(val) {
  state.vibrationInterval = parseInt(val, 10) || 0;
  saveState();
}

export function updateArabicFontSize(size, shouldSave = true) {
  state.arabicFontSize = parseFloat(size);
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--arabic-font-size', `${size}rem`);
    const label = document.getElementById('arabic-size-label');
    if (label) label.textContent = `${size}rem`;
    const slider = document.getElementById('slider-arabic-size');
    if (slider) slider.value = size;
  }
  if (shouldSave) saveState();
}

export function toggleDzikirReminder(kind, isChecked) {
  const isPagi = kind === 'pagi';
  const enabledKey = isPagi ? 'pagiReminderEnabled' : 'petangReminderEnabled';
  const timeKey = isPagi ? 'pagiReminderTime' : 'petangReminderTime';
  const defaultTime = isPagi ? '06:00' : '16:00';
  const timeElId = isPagi ? 'input-pagi-reminder-time' : 'input-petang-reminder-time';
  const toggleElId = isPagi ? 'toggle-pagi-reminder' : 'toggle-petang-reminder';

  const setOff = () => {
    const chk = document.getElementById(toggleElId);
    if (chk) chk.checked = false;
    state[enabledKey] = false;
    saveState();
    const timeEl = document.getElementById(timeElId);
    if (timeEl) timeEl.style.display = 'none';
  };

  if (!isChecked) {
    state[enabledKey] = false;
    saveState();
    const timeEl = document.getElementById(timeElId);
    if (timeEl) timeEl.style.display = 'none';
    return;
  }

  dispatch('habits:request-notif', {
    onGranted: () => {
      state[enabledKey] = true;
      saveState();
      const timeEl = document.getElementById(timeElId);
      if (timeEl) {
        timeEl.value = state[timeKey] || defaultTime;
        timeEl.style.display = 'block';
      }
    },
    onDenied: setOff
  }).catch(setOff);
}

export function updateDzikirReminderTime(kind, timeVal) {
  if (!timeVal) return;
  const key = kind === 'pagi' ? 'pagiReminderTime' : 'petangReminderTime';
  state[key] = timeVal;
  saveState();
}
