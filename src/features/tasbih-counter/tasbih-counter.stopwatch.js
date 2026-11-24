import { dispatch } from '../../app/command-bus.js';
import { t } from '../../shared/i18n.js';
import { vibrate } from '../../shared/media.js';
import { saveState, saveStateImmediate, state } from '../../shared/store.js';
import { SVG_ICONS } from '../../shared/svg-icons.js';

let stopwatchIntervalId = null;
let stopwatchLastVibrateMinute = 0;

export function formatTime(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
}

export function setMainButtonState(running) {
  if (typeof document === 'undefined') return;
  const emojiEl = document.getElementById('dashboard-main-emoji');
  const labelEl = document.getElementById('dashboard-main-label');
  const btnEl = document.getElementById('dashboard-main-btn');
  if (!emojiEl || !labelEl || !btnEl) return;

  emojiEl.innerHTML = running ? SVG_ICONS.pause : SVG_ICONS.play;
  labelEl.innerText = t(running ? 'label_pause' : 'label_start');
  btnEl.style.background = running ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-primary)';
  btnEl.classList.toggle('is-paused', Boolean(running));
}

export function updateStopwatchUI() {
  setMainButtonState(state.stopwatch.running);
  if (typeof document !== 'undefined') {
    const el = document.getElementById('stopwatch-counter');
    if (el) {
      el.innerText = formatTime(state.stopwatch.elapsedTime || 0);
      el.classList.toggle('timer-running', Boolean(state.stopwatch.running));
    }
  }
  dispatch('ui:update-reset-btn').catch(() => {});
}

export function startStopwatch() {
  state.stopwatch.running = true;
  state.stopwatch.startTime = Date.now() - state.stopwatch.elapsedTime;
  stopwatchLastVibrateMinute = Math.floor(state.stopwatch.elapsedTime / 30000);
  stopwatchIntervalId = setInterval(() => {
    state.stopwatch.elapsedTime = Date.now() - state.stopwatch.startTime;
    const el = typeof document !== 'undefined' ? document.getElementById('stopwatch-counter') : null;
    if (el) el.innerText = formatTime(state.stopwatch.elapsedTime);
    const interval = Math.floor(state.stopwatch.elapsedTime / 30000);
    if (interval > stopwatchLastVibrateMinute) {
      vibrate([30, 50, 30]);
      stopwatchLastVibrateMinute = interval;
    }
  }, 10);
  updateStopwatchUI();
  vibrate(15);
  saveState();
}

export function stopStopwatch() {
  state.stopwatch.running = false;
  if (stopwatchIntervalId) {
    clearInterval(stopwatchIntervalId);
    stopwatchIntervalId = null;
  }
  updateStopwatchUI();
  vibrate([30, 30]);
  saveStateImmediate();
}

export function toggleStopwatch() {
  if (state.stopwatch.running) stopStopwatch();
  else startStopwatch();
}

export function resetStopwatch() {
  if (state.stopwatch.elapsedTime === 0 && !state.stopwatch.running) return;
  dispatch('ui:show-modal', {
    title: t('modal_reset_stopwatch_title'),
    message: t('modal_reset_stopwatch_msg'),
    onYes: () => {
      if (state.stopwatch.running) stopStopwatch();
      state.stopwatch.elapsedTime = 0;
      const el = typeof document !== 'undefined' ? document.getElementById('stopwatch-counter') : null;
      if (el) el.innerText = formatTime(0);
      dispatch('ui:update-reset-btn').catch(() => {});
      saveState();
      vibrate(20);
    }
  }).catch(() => {});
}
