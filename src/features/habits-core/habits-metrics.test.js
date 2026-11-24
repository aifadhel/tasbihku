import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../shared/storage.js', () => ({
  loadPersistedState: vi.fn(async () => null),
  savePersistedState: vi.fn(async () => {}),
  initCrossTabSync: vi.fn(),
  clearLegacyOnLoadError: vi.fn(),
  writeBootPrefs: vi.fn()
}));

import { t } from '../../shared/i18n.js';
import { state } from '../../shared/store.js';
import { getLocalDateString } from './habits-dates.js';
import { generateHabitCSVData } from './habits-export.js';
import { calculateHabitStrength, getHabitStreaks } from './habits-metrics.js';

describe('habits-core EMA strength, streaks, and CSV export', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-02T12:00:00Z'));
    state.activityLog = [];
    state.habits = [];
    state.habitRepetitions = {};
    state.language = 'id';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('computes EMA consistency strength for daily, numerical partial, and skipped days', () => {
    const habit = { id: 'h_test', scheduleType: 'daily', createdAt: new Date('2026-06-02T12:00:00Z').getTime() };
    expect(calculateHabitStrength(habit)).toBe(0);
    state.habitRepetitions.h_test = { '2026-06-02': { value: 1, note: '' } };
    expect(calculateHabitStrength(habit)).toBe(5);

    const num = { id: 'h_num', scheduleType: 'daily', isNumerical: true, targetValue: 100, createdAt: new Date('2026-06-02T12:00:00Z').getTime() };
    state.habitRepetitions.h_num = { '2026-06-02': { value: 50, note: '' } };
    expect(calculateHabitStrength(num)).toBe(3);

    const skip = { id: 'h_skip', scheduleType: 'daily', createdAt: new Date('2026-06-01T12:00:00Z').getTime() };
    state.habitRepetitions.h_skip = { '2026-06-01': { value: 1 }, '2026-06-02': { skipped: true } };
    expect(calculateHabitStrength(skip)).toBe(5);
  });

  it('handles grace days and skipped days accurately in getHabitStreaks', () => {
    const hGrace = { id: 'h_grace', scheduleType: 'daily', createdAt: new Date('2026-04-01T12:00:00Z').getTime() };
    const reps = {};
    const d = new Date('2026-04-01T12:00:00Z');
    while (d <= new Date('2026-05-31T12:00:00Z')) { reps[getLocalDateString(d)] = { value: 1 }; d.setDate(d.getDate() + 1); }
    reps['2026-06-02'] = { value: 1 };
    state.habits = [hGrace];
    state.habitRepetitions.h_grace = reps;
    expect(getHabitStreaks('h_grace').current).toBe(62);

    const hLow = { id: 'h_low', scheduleType: 'daily', createdAt: new Date('2026-05-29T12:00:00Z').getTime() };
    state.habits.push(hLow);
    state.habitRepetitions.h_low = { '2026-05-29': { value: 1 }, '2026-05-30': { value: 1 }, '2026-06-01': { value: 1 }, '2026-06-02': { value: 1 } };
    expect(getHabitStreaks('h_low')).toEqual({ current: 2, best: 2 });
  });

  it('calculates weekly and interval habit streaks', () => {
    const hWeek = { id: 'h_week', scheduleType: 'weekly', weeklyTarget: 3, createdAt: new Date('2026-05-17T12:00:00Z').getTime() };
    const hInt = { id: 'h_int', scheduleType: 'interval', intervalDays: 2, anchorDate: '2026-05-30', createdAt: new Date('2026-05-30T12:00:00Z').getTime() };
    state.habits = [hWeek, hInt];
    state.habitRepetitions = {
      h_week: {
        '2026-05-18': { value: 1 }, '2026-05-19': { value: 1 }, '2026-05-20': { value: 1 },
        '2026-05-25': { value: 1 }, '2026-05-26': { value: 1 }, '2026-05-27': { value: 1 },
        '2026-06-02': { value: 1 }
      },
      h_int: { '2026-05-30': { value: 1 }, '2026-06-01': { value: 1 } }
    };
    expect(getHabitStreaks('h_week')).toEqual({ current: 2, best: 2 });
    expect(getHabitStreaks('h_int')).toEqual({ current: 2, best: 2 });
  });

  it('generates CSV rows including completed, skipped, and partial statuses', () => {
    const habit = { id: 'csv', name: 'CSV', isNumerical: true, targetValue: 100 };
    const csv = generateHabitCSVData(habit, {
      '2026-06-01': { value: 100, note: 'Done' },
      '2026-06-02': { skipped: true, note: 'Sick' },
      '2026-06-03': { value: 50, note: 'Half' }
    });
    const lines = csv.trim().split('\n');
    expect(lines[0]).toBe('Tanggal,Status,Nilai,Catatan');
    expect(lines[1]).toBe(`2026-06-01,${t('status_completed')},100,"Done"`);
    expect(lines[2]).toBe(`2026-06-02,${t('status_skipped')},0,"Sick"`);
    expect(lines[3]).toBe(`2026-06-03,${t('status_partial')},50,"Half"`);
  });
});
