import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../shared/storage.js', () => ({
  loadPersistedState: vi.fn(async () => null),
  savePersistedState: vi.fn(async () => {}),
  initCrossTabSync: vi.fn(),
  clearLegacyOnLoadError: vi.fn(),
  writeBootPrefs: vi.fn()
}));

import { state } from '../../shared/store.js';
import {
  calculateStreak,
  getLocalDateString,
  getPreviousDate,
  getRecentDates,
  getTodayDate,
  isHabitCompletedOn
} from './habits-dates.js';

describe('habits-core date helpers and global streak', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-02T12:00:00Z'));
    state.activityLog = [];
    state.habits = [];
    state.habitRepetitions = {};
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats local dates and previous date across month/year/leap boundaries', () => {
    expect(getLocalDateString(new Date('2026-06-02T12:00:00Z'))).toBe('2026-06-02');
    expect(getTodayDate()).toBe('2026-06-02');
    expect(getPreviousDate('2026-06-02')).toBe('2026-06-01');
    expect(getPreviousDate('2026-06-01')).toBe('2026-05-31');
    expect(getPreviousDate('2026-01-01')).toBe('2025-12-31');
    expect(getPreviousDate('2024-03-01')).toBe('2024-02-29');
    expect(getPreviousDate('2025-03-01')).toBe('2025-02-28');
  });

  it('returns 5 recent dates with Indonesian short labels', () => {
    const recent = getRecentDates();
    expect(recent).toHaveLength(5);
    expect(recent[4]).toEqual({ dateStr: '2026-06-02', label: 'Hi', isToday: true });
    expect(recent[3]).toEqual({ dateStr: '2026-06-01', label: 'Km', isToday: false });
    expect(recent[0]).toEqual({ dateStr: '2026-05-29', label: 'Jum', isToday: false });
  });

  it('calculates consecutive streaks, deduplicates, and honors single-day Istiqamah grace', () => {
    expect(calculateStreak()).toBe(0);
    state.activityLog = ['2026-06-02', '2026-06-01', '2026-05-31'];
    expect(calculateStreak()).toBe(3);
    state.activityLog = ['2026-06-01', '2026-05-31', '2026-05-30'];
    expect(calculateStreak()).toBe(3);
    state.activityLog = ['2026-05-31', '2026-05-30'];
    expect(calculateStreak()).toBe(0);
    state.activityLog = ['2026-06-02', '2026-06-02', '2026-06-01'];
    expect(calculateStreak()).toBe(2);
    state.activityLog = ['2026-06-02', '2026-05-31', '2026-05-30'];
    expect(calculateStreak(true)).toBe(3);
    expect(calculateStreak(false)).toBe(1);
    state.activityLog = ['2026-06-02', '2026-05-30'];
    expect(calculateStreak(true)).toBe(1);
  });

  it('checks binary and numerical completion via isHabitCompletedOn', () => {
    state.habits = [
      { id: 'h1', isNumerical: false, targetValue: 1 },
      { id: 'h2', isNumerical: true, targetValue: 100 }
    ];
    state.habitRepetitions = {
      h1: { '2026-06-02': { value: 1 } },
      h2: { '2026-06-02': { value: 120 }, '2026-06-01': { value: 100 }, '2026-05-31': { value: 50 } }
    };
    expect(isHabitCompletedOn('h1', '2026-06-02')).toBe(true);
    expect(isHabitCompletedOn('h1', '2026-06-03')).toBe(false);
    expect(isHabitCompletedOn('h2', '2026-06-02')).toBe(true);
    expect(isHabitCompletedOn('h2', '2026-06-01')).toBe(true);
    expect(isHabitCompletedOn('h2', '2026-05-31')).toBe(false);
  });
});
