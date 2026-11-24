import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../shared/storage.js', () => ({
  loadPersistedState: vi.fn(async () => null),
  savePersistedState: vi.fn(async () => {}),
  initCrossTabSync: vi.fn(),
  clearLegacyOnLoadError: vi.fn(),
  writeBootPrefs: vi.fn()
}));

vi.mock('../../shared/media.js', () => ({
  vibrate: vi.fn(),
  playTapSound: vi.fn(),
  triggerMilestoneFeedback: vi.fn(),
  isSoundSystemFailed: vi.fn(() => false)
}));

import { dispatch, registerCommand } from '../../app/command-bus.js';
import { state } from '../../shared/store.js';
import { incrementFree, resetFree, resetTapDebounceForTest } from './tasbih-counter.logic.js';
import { formatTime } from './tasbih-counter.stopwatch.js';
import { formatDuration, setTimerPreset } from './tasbih-counter.timers.js';
import { handleDashboardMainBtn, initFeature } from './tasbih-counter.feature.js';

describe('tasbih-counter feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.freeCount = 0;
    state.targetLimit = 0;
    state.dashboardMode = 'counting';
    state.stopwatch = { running: false, startTime: null, elapsedTime: 0 };
    state.timer = { running: false, targetDuration: null, remainingTime: null };
    resetTapDebounceForTest();
  });

  it('increments freeCount and enforces 60ms tap debounce', () => {
    expect(incrementFree()).toBe(true);
    expect(state.freeCount).toBe(1);
    expect(incrementFree()).toBe(false);
    expect(state.freeCount).toBe(1);
  });

  it('formats stopwatch and timer durations cleanly', () => {
    expect(formatTime(61230)).toBe('01:01.23');
    expect(formatDuration(90)).toBe('01:30');
    expect(formatDuration(3665)).toBe('01:01:05');
  });

  it('dispatches confirmation modal on resetFree when count > 0', () => {
    const showModalSpy = vi.fn(({ onYes }) => onYes && onYes());
    registerCommand('ui:show-modal', showModalSpy);
    state.freeCount = 12;
    resetFree();
    expect(showModalSpy).toHaveBeenCalledTimes(1);
    expect(state.freeCount).toBe(0);
  });

  it('sets timer presets and routes commands via command-bus', async () => {
    initFeature();
    await dispatch('tasbih:timer-preset', { arg: '300' });
    expect(state.timer.targetDuration).toBe(300);
    expect(state.timer.remainingTime).toBe(300);
    setTimerPreset(60);
    expect(state.timer.remainingTime).toBe(60);

    const trackSpy = vi.fn();
    registerCommand('habits:track-activity', trackSpy);
    handleDashboardMainBtn();
    expect(state.freeCount).toBe(1);
    expect(trackSpy).toHaveBeenCalled();
  });
});
