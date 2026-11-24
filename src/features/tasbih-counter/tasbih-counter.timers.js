import { dispatch } from '../../app/command-bus.js';
import { registerModalOpen, registerModalClose } from '../../app/slots.js';
import { t } from '../../shared/i18n.js';
import { vibrate } from '../../shared/media.js';
import { saveState, saveStateImmediate, state } from '../../shared/store.js';
import { setMainButtonState } from './tasbih-counter.stopwatch.js';

let timerIntervalId = null;

function notifyShowModal(title, message, onYes = null, isAlert = false) {
  return dispatch('ui:show-modal', { title, message, onYes, isAlert }).catch(() => {});
}

export function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function updateTimerUI() {
  setMainButtonState(state.timer.running);
  if (typeof document !== 'undefined') {
    const setupArea = document.getElementById('timer-setup-area');
    const counterEl = document.getElementById('timer-counter');
    if (setupArea) setupArea.style.display = state.timer.running ? 'none' : 'block';
    if (counterEl) {
      counterEl.style.fontSize = state.timer.running ? 'clamp(3.5rem, 12vw, 5.5rem)' : 'clamp(2.5rem, 8vw, 3.5rem)';
      counterEl.classList.toggle('timer-running', Boolean(state.timer.running));
      counterEl.innerText = state.timer.remainingTime !== null ? formatDuration(state.timer.remainingTime) : '00:00';
    }
  }
  dispatch('ui:update-reset-btn').catch(() => {});
}

export function stopTimer() {
  state.timer.running = false;
  if (timerIntervalId) {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
  updateTimerUI();
  vibrate([30, 30]);
  saveStateImmediate();
}

export function completeTimer() {
  stopTimer();
  vibrate([500, 200, 500, 200, 500, 200, 1000, 200, 1000]);
  notifyShowModal(t('modal_timer_done_title'), t('modal_timer_done_msg'), null, true);
  dispatch('habits:notify-timer').catch(() => {});
}

export function startTimer() {
  if (state.timer.remainingTime <= 0) state.timer.remainingTime = state.timer.targetDuration;
  state.timer.running = true;
  timerIntervalId = setInterval(() => {
    state.timer.remainingTime--;
    const el = typeof document !== 'undefined' ? document.getElementById('timer-counter') : null;
    if (el) el.innerText = formatDuration(state.timer.remainingTime);
    if (state.timer.remainingTime > 0 && state.timer.remainingTime % 60 === 0) vibrate([30, 50, 30]);
    if (state.timer.remainingTime <= 0) completeTimer();
  }, 1000);
  updateTimerUI();
  vibrate(15);
  saveState();
}

export function toggleTimer() {
  if (state.timer.running) stopTimer();
  else if (!state.timer.targetDuration) notifyShowModal(t('modal_timer_setup_title'), t('modal_timer_setup_msg'), null, true);
  else startTimer();
}

export function setTimerPreset(seconds) {
  if (state.timer.running) stopTimer();
  state.timer.targetDuration = seconds;
  state.timer.remainingTime = seconds;
  updateTimerUI();
  saveState();
  vibrate(15);
}

export function promptCustomTimer() {
  if (state.timer.running || typeof document === 'undefined') return;
  const total = state.timer.targetDuration || 300;
  const mInput = document.getElementById('time-input-m');
  const sInput = document.getElementById('time-input-s');
  if (mInput) mInput.value = Math.floor(total / 60).toString().padStart(2, '0');
  if (sInput) sInput.value = (total % 60).toString().padStart(2, '0');
  const modalEl = document.getElementById('time-input-modal');
  if (modalEl) {
    modalEl.classList.add('active');
    registerModalOpen('time-input-modal', closeTimeInputModal);
  }
}

export function closeTimeInputModal(fromPopstate = false) {
  if (typeof document !== 'undefined') {
    const modal = document.getElementById('time-input-modal');
    if (modal) modal.classList.remove('active');
  }
  registerModalClose('time-input-modal', fromPopstate);
}

export function applyTimeInputModal() {
  if (typeof document === 'undefined') return;
  const m = parseInt(document.getElementById('time-input-m')?.value || '0', 10) || 0;
  const s = parseInt(document.getElementById('time-input-s')?.value || '0', 10) || 0;
  const total = m * 60 + s;
  if (total > 0) {
    setTimerPreset(total);
    closeTimeInputModal();
  } else {
    notifyShowModal(t('modal_timer_error_title'), t('modal_timer_error_msg'), null, true);
  }
}

export function resetTimer() {
  if (state.timer.targetDuration === null && state.timer.remainingTime === null && !state.timer.running) return;
  notifyShowModal(t('modal_reset_timer_title'), t('modal_reset_timer_msg'), () => {
    if (state.timer.running) stopTimer();
    state.timer.targetDuration = null;
    state.timer.remainingTime = null;
    updateTimerUI();
    dispatch('ui:update-reset-btn').catch(() => {});
    saveState();
    vibrate(20);
  });
}
