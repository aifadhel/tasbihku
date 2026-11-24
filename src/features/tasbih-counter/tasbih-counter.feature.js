import { dispatch, registerCommand } from '../../app/command-bus.js';
import { state } from '../../shared/store.js';
import {
  applyNumberInputModal,
  closeNumberInputModal,
  incrementFree,
  promptManualCount,
  promptTargetLimit,
  resetFree
} from './tasbih-counter.logic.js';
import {
  resetStopwatch,
  stopStopwatch,
  toggleStopwatch,
  updateStopwatchUI
} from './tasbih-counter.stopwatch.js';
import {
  applyTimeInputModal,
  closeTimeInputModal,
  promptCustomTimer,
  resetTimer,
  setTimerPreset,
  stopTimer,
  toggleTimer,
  updateTimerUI
} from './tasbih-counter.timers.js';

export function handleDashboardMainBtn() {
  dispatch('habits:track-activity').catch(() => {});
  if (state.dashboardMode === 'counting') incrementFree();
  else if (state.dashboardMode === 'stopwatch') toggleStopwatch();
  else if (state.dashboardMode === 'timer') toggleTimer();
}

export function handleDashboardReset() {
  dispatch('habits:track-activity').catch(() => {});
  if (state.dashboardMode === 'counting') resetFree();
  else if (state.dashboardMode === 'stopwatch') resetStopwatch();
  else if (state.dashboardMode === 'timer') resetTimer();
}

export function initFeature() {
  registerCommand('tasbih:dashboard-main', handleDashboardMainBtn);
  registerCommand('tasbih:dashboard-reset', handleDashboardReset);
  registerCommand('tasbih:double-tap', () => {
    if (state.dashboardMode === 'counting') incrementFree();
  });
  registerCommand('tasbih:increment', incrementFree);
  registerCommand('tasbih:reset', resetFree);
  registerCommand('tasbih:prompt-count', promptManualCount);
  registerCommand('tasbih:prompt-target', promptTargetLimit);
  registerCommand('tasbih:number-close', () => closeNumberInputModal(false));
  registerCommand('tasbih:number-apply', applyNumberInputModal);
  registerCommand('tasbih:stopwatch-toggle', toggleStopwatch);
  registerCommand('tasbih:stopwatch-stop', stopStopwatch);
  registerCommand('tasbih:stopwatch-reset', resetStopwatch);
  registerCommand('tasbih:stopwatch-ui', updateStopwatchUI);
  registerCommand('tasbih:timer-toggle', toggleTimer);
  registerCommand('tasbih:timer-stop', stopTimer);
  registerCommand('tasbih:timer-reset', resetTimer);
  registerCommand('tasbih:timer-ui', updateTimerUI);
  registerCommand('tasbih:timer-preset', (p) => setTimerPreset(Number(p?.arg ?? p)));
  registerCommand('tasbih:prompt-timer', promptCustomTimer);
  registerCommand('tasbih:timer-modal-close', () => closeTimeInputModal(false));
  registerCommand('tasbih:timer-modal-apply', applyTimeInputModal);
}
