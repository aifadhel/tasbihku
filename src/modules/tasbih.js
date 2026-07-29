/* ========================================================================= */
/* --- TasbihKu Tasbih Module (src/modules/tasbih.js) --- */
/* ========================================================================= */

import { state, saveState, saveStateImmediate } from '../core/store.js';
import { vibrate, playTapSound } from '../hardware/media.js';
import { trackActivity, triggerTimerNotification } from './habits.js';
import { showModal, animateValue, SVG_ICONS, triggerCelebration } from '../ui/router.js';
import { t } from '../core/i18n.js';

let lastFreeCountBeforeReset = 0; // For undo support

// Stopwatch private state variables
let stopwatchIntervalId = null;
let stopwatchLastVibrateMinute = 0;

// Timer private state variables
let timerIntervalId = null;

// --- Free Counter Logic ---
export function incrementFree() {
    state.freeCount++;
    animateValue('free-counter', state.freeCount);
    
    if (state.targetLimit > 0 && state.freeCount % state.targetLimit === 0) {
        vibrate([50, 100, 50]);
        triggerCelebration();
    } else if (state.vibrationInterval > 0 && state.freeCount % state.vibrationInterval === 0) {
        vibrate([40, 40]);
    } else {
        vibrate();
    }
    
    saveState();
    trackActivity();
    playTapSound();
}

export function confirmResetFree() {
    lastFreeCountBeforeReset = state.freeCount;
    showModal(t('modal_reset_free_title'), t('modal_reset_free_msg'), () => {
        state.freeCount = 0;
        const freeCounterEl = document.getElementById('free-counter');
        if (freeCounterEl) freeCounterEl.innerText = 0;
        saveState();
    });
}

export function undoFreeReset() {
    if (lastFreeCountBeforeReset > 0) {
        state.freeCount = lastFreeCountBeforeReset;
        const freeCounterEl = document.getElementById('free-counter');
        if (freeCounterEl) freeCounterEl.innerText = state.freeCount;
        saveStateImmediate();
        vibrate([30, 50, 30]);
    }
}

let numberInputCallback = null;

export function openNumberInputModal(title, desc, initialValue, callback) {
    const modal = document.getElementById('number-input-modal');
    const titleEl = document.getElementById('number-input-title');
    const descEl = document.getElementById('number-input-desc');
    const inputEl = document.getElementById('number-input-value');
    
    if (modal && titleEl && inputEl) {
        titleEl.innerText = title;
        if (desc) {
            descEl.innerText = desc;
            descEl.style.display = 'block';
        } else {
            descEl.style.display = 'none';
        }
        inputEl.value = initialValue;
        numberInputCallback = callback;
        
        modal.classList.add('active');
        inputEl.focus();
        inputEl.select();
    }
}

export function closeNumberInputModal() {
    const modal = document.getElementById('number-input-modal');
    if (modal) {
        modal.classList.remove('active');
    }
    numberInputCallback = null;
}

export function applyNumberInputModal() {
    const inputEl = document.getElementById('number-input-value');
    if (inputEl && numberInputCallback) {
        const val = inputEl.value;
        numberInputCallback(val);
    }
    closeNumberInputModal();
}

export function promptManualCount() {
    openNumberInputModal(t('modal_manual_count_title'), t('modal_manual_count_msg'), state.freeCount, (newVal) => {
        if (newVal !== null && newVal !== '') {
            const parsed = parseInt(newVal);
            if (!isNaN(parsed) && parsed >= 0) {
                state.freeCount = parsed;
                animateValue('free-counter', state.freeCount);
                saveState();
            } else {
                showModal(t('modal_invalid_input_title'), t('modal_invalid_input_msg'), null, true);
            }
        }
    });
}

export function promptTargetLimit() {
    openNumberInputModal(t('modal_target_limit_title'), t('modal_target_limit_msg'), state.targetLimit || 0, (newVal) => {
        if (newVal !== null) {
            const parsed = parseInt(newVal);
            if (!isNaN(parsed) && parsed > 0) {
                state.targetLimit = parsed;
                saveState();
            } else if (newVal === '' || parsed === 0) {
                state.targetLimit = 0;
                saveState();
            } else {
                showModal(t('modal_invalid_input_title'), t('modal_invalid_input_msg'), null, true);
            }
        }
    });
}

// --- Formatting Helpers ---
export function formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
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

// --- Stopwatch Logic ---
export function toggleStopwatch() {
    if (state.stopwatch.running) {
        stopStopwatch();
    } else {
        startStopwatch();
    }
}

export function startStopwatch() {
    state.stopwatch.running = true;
    state.stopwatch.startTime = Date.now() - state.stopwatch.elapsedTime;

    stopwatchLastVibrateMinute = Math.floor(state.stopwatch.elapsedTime / 30000);

    stopwatchIntervalId = setInterval(() => {
        const now = Date.now();
        state.stopwatch.elapsedTime = now - state.stopwatch.startTime;
        const stopwatchCounterEl = document.getElementById('stopwatch-counter');
        if (stopwatchCounterEl) {
            stopwatchCounterEl.innerText = formatTime(state.stopwatch.elapsedTime);
        }

        // Continuous Haptic every 30 seconds
        const currentInterval = Math.floor(state.stopwatch.elapsedTime / 30000);
        if (currentInterval > stopwatchLastVibrateMinute) {
            vibrate([30, 50, 30]);
            stopwatchLastVibrateMinute = currentInterval;
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

export function resetStopwatch() {
    showModal(t('modal_reset_stopwatch_title'), t('modal_reset_stopwatch_msg'), () => {
        if (state.stopwatch.running) stopStopwatch();
        state.stopwatch.elapsedTime = 0;
        const stopwatchCounterEl = document.getElementById('stopwatch-counter');
        if (stopwatchCounterEl) {
            stopwatchCounterEl.innerText = formatTime(0);
        }
        saveState();
    });
}

export function updateStopwatchUI() {
    const emojiEl = document.getElementById('dashboard-main-emoji');
    const labelEl = document.getElementById('dashboard-main-label');
    const btnEl = document.getElementById('dashboard-main-btn');
    if (!emojiEl || !labelEl || !btnEl) return;

    if (state.stopwatch.running) {
        emojiEl.innerHTML = SVG_ICONS.pause;
        labelEl.innerText = t('label_pause');
        btnEl.style.background = 'linear-gradient(135deg, #ffb4ab 0%, #ff897d 100%)';
    } else {
        emojiEl.innerHTML = SVG_ICONS.play;
        labelEl.innerText = t('label_start');
        btnEl.style.background = 'linear-gradient(135deg, var(--md-sys-color-primary) 0%, #6bc7a0 100%)';
    }
    const stopwatchCounterEl = document.getElementById('stopwatch-counter');
    if (stopwatchCounterEl) {
        stopwatchCounterEl.innerText = formatTime(state.stopwatch.elapsedTime || 0);
    }
}

// --- Timer Logic ---
export function toggleTimer() {
    if (state.timer.running) {
        stopTimer();
    } else {
        if (!state.timer.targetDuration) {
            showModal(t('modal_timer_setup_title'), t('modal_timer_setup_msg'), null, true);
            return;
        }
        startTimer();
    }
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
    if (state.timer.running) return;

    let m = 5, s = 0;
    if (state.timer.targetDuration) {
        m = Math.floor(state.timer.targetDuration / 60);
        s = state.timer.targetDuration % 60;
    }
    const mInput = document.getElementById('time-input-m');
    const sInput = document.getElementById('time-input-s');
    if (mInput) mInput.value = m.toString().padStart(2, '0');
    if (sInput) sInput.value = s.toString().padStart(2, '0');
    const modalEl = document.getElementById('time-input-modal');
    if (modalEl) modalEl.classList.add('active');
}

export function closeTimeInputModal() {
    const modal = document.getElementById('time-input-modal');
    if (modal) modal.classList.remove('active');
}

export function applyTimeInputModal() {
    const mInput = document.getElementById('time-input-m');
    const sInput = document.getElementById('time-input-s');
    const m = mInput ? (parseInt(mInput.value) || 0) : 0;
    const s = sInput ? (parseInt(sInput.value) || 0) : 0;

    const total = (m * 60) + s;
    if (total > 0) {
        setTimerPreset(total);
        closeTimeInputModal();
    } else {
        showModal(t('modal_timer_error_title'), t('modal_timer_error_msg'), null, true);
    }
}

export function startTimer() {
    if (state.timer.remainingTime <= 0) {
        state.timer.remainingTime = state.timer.targetDuration;
    }

    state.timer.running = true;

    timerIntervalId = setInterval(() => {
        state.timer.remainingTime--;
        const timerCounterEl = document.getElementById('timer-counter');
        if (timerCounterEl) {
            timerCounterEl.innerText = formatDuration(state.timer.remainingTime);
        }

        // Continuous Haptic every 1 minute
        if (state.timer.remainingTime > 0 && state.timer.remainingTime % 60 === 0) {
            vibrate([30, 50, 30]);
        }

        if (state.timer.remainingTime <= 0) {
            completeTimer();
        }
    }, 1000);

    updateTimerUI();
    vibrate(15);
    saveState();
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
    showModal(t('modal_timer_done_title'), t('modal_timer_done_msg'), null, true);
    triggerTimerNotification();
}

export function resetTimer() {
    showModal(t('modal_reset_timer_title'), t('modal_reset_timer_msg'), () => {
        if (state.timer.running) stopTimer();
        state.timer.targetDuration = null;
        state.timer.remainingTime = null;
        updateTimerUI();
        saveState();
    });
}

export function updateTimerUI() {
    const emojiEl = document.getElementById('dashboard-main-emoji');
    const labelEl = document.getElementById('dashboard-main-label');
    const btnEl = document.getElementById('dashboard-main-btn');
    const setupArea = document.getElementById('timer-setup-area');
    const counterEl = document.getElementById('timer-counter');
    if (!emojiEl || !labelEl || !btnEl || !counterEl) return;

    if (state.timer.running) {
        emojiEl.innerHTML = SVG_ICONS.pause;
        labelEl.innerText = t('label_pause');
        btnEl.style.background = 'linear-gradient(135deg, #ffb4ab 0%, #ff897d 100%)';
        if (setupArea) setupArea.style.display = 'none';
        counterEl.style.fontSize = 'clamp(3.5rem, 12vw, 5.5rem)';
    } else {
        emojiEl.innerHTML = SVG_ICONS.play;
        labelEl.innerText = t('label_start');
        btnEl.style.background = 'linear-gradient(135deg, var(--md-sys-color-primary) 0%, #6bc7a0 100%)';
        if (setupArea) setupArea.style.display = 'block';
        counterEl.style.fontSize = 'clamp(2.5rem, 8vw, 3.5rem)';
    }

    if (state.timer.remainingTime !== null) {
        counterEl.innerText = formatDuration(state.timer.remainingTime);
    } else {
        counterEl.innerText = '00:00';
    }
}
