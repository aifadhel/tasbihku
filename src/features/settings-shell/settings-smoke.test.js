import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../shared/storage.js', () => ({
  loadPersistedState: vi.fn(async () => null),
  savePersistedState: vi.fn(async () => {}),
  initCrossTabSync: vi.fn(),
  clearLegacyOnLoadError: vi.fn(),
  writeBootPrefs: vi.fn()
}));

vi.mock('../../shared/media.js', () => ({
  playTapSound: vi.fn(),
  vibrate: vi.fn(),
  applyVibrationCapability: vi.fn(),
  isVibrationSupported: vi.fn(() => true),
  showSoundHint: vi.fn(),
  isSoundSystemFailed: vi.fn(() => false)
}));

function makeEl(id, attrs = {}) {
  const classes = new Set(attrs.class ? attrs.class.split(' ') : []);
  const map = { ...attrs };
  const styles = {};
  const el = {
    id,
    disabled: Boolean(attrs.disabled),
    innerText: '',
    innerHTML: '',
    classList: {
      contains: (c) => classes.has(c),
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      toggle: (c, f) => (f === undefined ? (classes.has(c) ? classes.delete(c) : classes.add(c)) : (f ? classes.add(c) : classes.delete(c)))
    },
    getAttribute: (k) => map[k] || null,
    setAttribute: (k, v) => { map[k] = String(v); },
    style: {
      display: 'block',
      setProperty: (p, v) => { styles[p] = String(v); },
      getPropertyValue: (p) => styles[p] || ''
    },
    focus: vi.fn(),
    closest: (sel) => {
      if (sel.includes('[role="tab"]') && map.role === 'tab') return el;
      if (sel.includes('#dashboard-mode-switcher') && id === 'dashboard-mode-switcher') return el;
      return null;
    }
  };
  return el;
}

describe('settings-shell dashboard modes & tablist keyboard', () => {
  let els = {};
  let modes;
  let handleTablistKeyboard;
  let state;

  beforeAll(async () => {
    global.window = { addEventListener: vi.fn(), location: { pathname: '/', search: '', hash: '' } };
    global.history = { pushState: vi.fn(), replaceState: vi.fn(), back: vi.fn() };
    global.document = {
      activeElement: null,
      getElementById: (id) => els[id] || null,
      querySelectorAll: (sel) => (sel.includes('.segment-btn') ? [els['tab-counting'], els['tab-stopwatch'], els['tab-timer']].filter(Boolean) : []),
      querySelector: () => null
    };
    ({ state } = await import('../../shared/store.js'));
    const { initFeature } = await import('./settings-shell.feature.js');
    initFeature();
    modes = await import('./shell-modes.js');
    ({ handleTablistKeyboard } = await import('../../app/dom-bridge.js'));
  });

  beforeEach(() => {
    els = {
      'dashboard-mode-switcher': makeEl('dashboard-mode-switcher', { role: 'tablist', 'data-active-index': '0' }),
      'tab-counting': makeEl('tab-counting', { class: 'segment-btn active', 'data-mode': 'counting', 'aria-selected': 'true', role: 'tab', tabindex: '0' }),
      'tab-stopwatch': makeEl('tab-stopwatch', { class: 'segment-btn', 'data-mode': 'stopwatch', 'aria-selected': 'false', role: 'tab', tabindex: '-1' }),
      'tab-timer': makeEl('tab-timer', { class: 'segment-btn', 'data-mode': 'timer', 'aria-selected': 'false', role: 'tab', tabindex: '-1' }),
      'counting-display-area': makeEl('counting-display-area'),
      'stopwatch-display-area': makeEl('stopwatch-display-area'),
      'timer-display-area': makeEl('timer-display-area'),
      'dashboard-mode-title': makeEl('dashboard-mode-title'),
      'dashboard-main-emoji': makeEl('dashboard-main-emoji'),
      'dashboard-main-label': makeEl('dashboard-main-label'),
      'dashboard-main-btn': makeEl('dashboard-main-btn'),
      'dashboard-reset-btn': makeEl('dashboard-reset-btn', { class: 'btn btn-reset-tonal is-disabled', disabled: true, 'aria-disabled': 'true' })
    };
    els['dashboard-mode-switcher'].querySelectorAll = () => [els['tab-counting'], els['tab-stopwatch'], els['tab-timer']];
  });

  it('switches dashboard modes and synchronizes ARIA + active index', () => {
    modes.switchDashboardMode('stopwatch');
    expect(state.dashboardMode).toBe('stopwatch');
    expect(els['dashboard-mode-switcher'].getAttribute('data-active-index')).toBe('1');
    expect(els['tab-stopwatch'].getAttribute('aria-selected')).toBe('true');
    expect(els['stopwatch-display-area'].style.display).toBe('block');

    modes.switchDashboardMode('timer');
    expect(state.dashboardMode).toBe('timer');
    expect(els['dashboard-mode-switcher'].getAttribute('data-active-index')).toBe('2');
    expect(els['timer-display-area'].style.display).toBe('block');
  });

  it('navigates tablist via ArrowRight, ArrowLeft, End, Home', () => {
    global.document.activeElement = els['tab-counting'];
    const e1 = { key: 'ArrowRight', preventDefault: vi.fn() };
    expect(handleTablistKeyboard(e1)).toBe(true);
    expect(els['tab-stopwatch'].focus).toHaveBeenCalled();

    const e2 = { key: 'ArrowLeft', preventDefault: vi.fn() };
    expect(handleTablistKeyboard(e2)).toBe(true);
    expect(els['tab-timer'].focus).toHaveBeenCalled();

    global.document.activeElement = els['tab-stopwatch'];
    expect(handleTablistKeyboard({ key: 'End', preventDefault: vi.fn() })).toBe(true);
    expect(els['tab-timer'].focus).toHaveBeenCalledTimes(2);
    expect(handleTablistKeyboard({ key: 'Home', preventDefault: vi.fn() })).toBe(true);
    expect(els['tab-counting'].focus).toHaveBeenCalled();
  });
});
