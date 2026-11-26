import { dispatch } from '../../app/command-bus.js';
import { registerModalOpen, registerModalClose } from '../../app/slots.js';
import { animateValue, triggerCelebration } from '../../shared/dom-effects.js';
import { t } from '../../shared/i18n.js';
import { triggerMilestoneFeedback, vibrate } from '../../shared/media.js';
import { saveState, state } from '../../shared/store.js';

let lastIncrementTime = 0;
const TAP_DEBOUNCE_MS = 60;
let numberInputCallback = null;

export function notifyShowModal(title, message, onYes = null, isAlert = false) {
  return dispatch('ui:show-modal', { title, message, onYes, isAlert }).catch(() => {});
}

export function incrementFree() {
  const now = Date.now();
  if (now - lastIncrementTime < TAP_DEBOUNCE_MS) return false;
  lastIncrementTime = now;

  state.freeCount++;
  animateValue('free-counter', state.freeCount);

  if (state.targetLimit > 0 && state.freeCount % state.targetLimit === 0) {
    triggerCelebration();
    if (typeof document !== 'undefined') {
      const el = document.getElementById('free-counter');
      if (el) {
        el.classList.remove('expressive-pop');
        void el.offsetWidth;
        el.classList.add('expressive-pop');
      }
    }
  }

  triggerMilestoneFeedback(state.freeCount, state.targetLimit);
  saveState();
  dispatch('habits:track-activity').catch(() => {});
  dispatch('ui:update-reset-btn').catch(() => {});
  return true;
}

export function resetFree() {
  if (state.freeCount === 0) return;
  notifyShowModal(t('modal_reset_free_title'), t('modal_reset_free_msg'), () => {
    state.freeCount = 0;
    animateValue('free-counter', 0);
    dispatch('ui:update-reset-btn').catch(() => {});
    saveState();
    vibrate(25);
  });
}

export function openNumberInputModal(title, desc, initialValue, callback) {
  if (typeof document === 'undefined') return;
  const modal = document.getElementById('number-input-modal');
  const titleEl = document.getElementById('number-input-title');
  const descEl = document.getElementById('number-input-desc');
  const inputEl = document.getElementById('number-input-value');

  if (modal && titleEl && inputEl) {
    titleEl.innerText = title;
    if (descEl) {
      descEl.innerText = desc || '';
      descEl.style.display = desc ? 'block' : 'none';
    }
    inputEl.value = initialValue;
    numberInputCallback = callback;
    modal.classList.add('active');
    registerModalOpen('number-input-modal', closeNumberInputModal);
    inputEl.focus();
    inputEl.select();
  }
}

export function closeNumberInputModal(fromPopstate = false) {
  if (typeof document !== 'undefined') {
    const modal = document.getElementById('number-input-modal');
    if (modal) modal.classList.remove('active');
  }
  registerModalClose('number-input-modal', fromPopstate);
  numberInputCallback = null;
}

export function applyNumberInputModal() {
  if (typeof document !== 'undefined') {
    const inputEl = document.getElementById('number-input-value');
    if (inputEl && numberInputCallback) numberInputCallback(inputEl.value);
  }
  closeNumberInputModal();
}

export function promptManualCount() {
  openNumberInputModal(t('modal_manual_count_title'), t('modal_manual_count_msg'), state.freeCount, (newVal) => {
    if (newVal !== null && newVal !== '') {
      const parsed = parseInt(newVal, 10);
      if (!Number.isNaN(parsed) && parsed >= 0) {
        state.freeCount = parsed;
        animateValue('free-counter', state.freeCount);
        saveState();
      } else {
        notifyShowModal(t('modal_invalid_input_title'), t('modal_invalid_input_msg'), null, true);
      }
    }
  });
}

export function promptTargetLimit() {
  openNumberInputModal(t('modal_target_limit_title'), t('modal_target_limit_msg'), state.targetLimit || 0, (newVal) => {
    if (newVal !== null) {
      const parsed = parseInt(newVal, 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        state.targetLimit = parsed;
        saveState();
      } else if (newVal === '' || parsed === 0) {
        state.targetLimit = 0;
        saveState();
      } else {
        notifyShowModal(t('modal_invalid_input_title'), t('modal_invalid_input_msg'), null, true);
      }
    }
  });
}

export function resetTapDebounceForTest() {
  lastIncrementTime = 0;
}
