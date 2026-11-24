import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../shared/storage.js', () => ({
  loadPersistedState: vi.fn(async () => null),
  savePersistedState: vi.fn(async () => {}),
  initCrossTabSync: vi.fn(),
  clearLegacyOnLoadError: vi.fn(),
  writeBootPrefs: vi.fn(),
  getRoutineCollapsed: vi.fn(() => false),
  setRoutineCollapsed: vi.fn()
}));

import { dispatch, emitEvent, registerCommand } from '../../app/command-bus.js';
import { state } from '../../shared/store.js';
import { featureManifest as habitsCoreManifest } from '../habits-core/habits-core.contract.js';
import { moveHabit } from './habits-list-actions.js';
import { updateStreakBadge } from './habits-progress.js';
import { toggleScheduleDaysView } from './habits-modal-form.js';
import { initFeature } from './habits-ui.feature.js';

describe('habits-ui feature', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    state.habits = [];
    state.habitRepetitions = {};
    state.activityLog = [];
    const coreMod = await habitsCoreManifest.load();
    coreMod.initFeature();
    initFeature();
  });

  it('reorders habits cleanly via moveHabit within bounds', () => {
    state.habits = [{ id: 'h1', name: '1' }, { id: 'h2', name: '2' }, { id: 'h3', name: '3' }];
    expect(moveHabit('h2', 'up')).toBe(true);
    expect(state.habits.map((h) => h.id)).toEqual(['h2', 'h1', 'h3']);
    expect(moveHabit('h2', 'up')).toBe(false);
    expect(moveHabit('h2', 'down')).toBe(true);
    expect(state.habits.map((h) => h.id)).toEqual(['h1', 'h2', 'h3']);
    expect(moveHabit('h3', 'down')).toBe(false);
  });

  it('toggles schedule days/weekly/interval containers by schedule type', () => {
    const els = {
      'habit-schedule-days-container': { style: { display: 'none' } },
      'habit-schedule-weekly-container': { style: { display: 'none' } },
      'habit-schedule-interval-container': { style: { display: 'none' } }
    };
    global.document = { getElementById: (id) => els[id] || null };
    toggleScheduleDaysView('specific');
    expect(els['habit-schedule-days-container'].style.display).toBe('flex');
    expect(els['habit-schedule-weekly-container'].style.display).toBe('none');
    toggleScheduleDaysView('weekly');
    expect(els['habit-schedule-weekly-container'].style.display).toBe('flex');
    toggleScheduleDaysView('interval');
    expect(els['habit-schedule-interval-container'].style.display).toBe('flex');
  });

  it('updates streak badge via habitsCore capability and listens to completed-linked event', () => {
    const badge = { style: { display: 'none' } };
    const count = { innerText: '' };
    const toastBox = { appendChild: vi.fn() };
    global.document = {
      getElementById: (id) => ({ 'streak-badge': badge, 'streak-count': count, 'stacking-toast-container': toastBox }[id] || null),
      createElement: () => ({ className: '', innerHTML: '', classList: { add: vi.fn() }, addEventListener: vi.fn(), remove: vi.fn() })
    };
    const today = new Date().toLocaleDateString('en-CA');
    state.activityLog = [today];
    updateStreakBadge();
    expect(badge.style.display).toBe('flex');
    expect(count.innerText).toBe(1);

    emitEvent('habits:completed-linked', { names: ['Dhuha'] });
    expect(toastBox.appendChild).toHaveBeenCalledTimes(1);
  });

  it('routes linked dzikir launch through command-bus', async () => {
    const playerSpy = vi.fn();
    registerCommand('dzikir:start-player', playerSpy);
    const { launchLinkedDzikir } = await import('./habits-list-actions.js');
    launchLinkedDzikir('guided-pagi');
    expect(playerSpy).toHaveBeenCalledWith({ type: 'pagi' });
    await dispatch('habits:update-streak');
  });
});
