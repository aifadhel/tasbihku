import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const showToastMock = vi.fn();
const showModalMock = vi.fn();
const setManualUpdateCheckMock = vi.fn();

vi.mock('../../shared/storage.js', () => ({
  loadPersistedState: vi.fn(async () => null), savePersistedState: vi.fn(async () => {}), initCrossTabSync: vi.fn(), clearLegacyOnLoadError: vi.fn(), writeBootPrefs: vi.fn()
}));
vi.mock('../../shared/toast.js', () => ({ showToast: showToastMock }));
vi.mock('./router-nav.js', () => ({ showModal: showModalMock, closeModal: vi.fn(), goBack: vi.fn(), initRouterListeners: vi.fn(), showPage: vi.fn() }));
vi.mock('../../shared/system.js', () => ({ requestWakeLock: vi.fn(), releaseWakeLock: vi.fn(), toggleWakeLock: vi.fn(), setManualUpdateCheck: setManualUpdateCheckMock }));

function makeEl(id) {
  const classes = new Set();
  const attrs = {};
  return {
    id, disabled: false, textContent: '', innerText: '',
    classList: {
      add: (c) => classes.add(c), remove: (c) => classes.delete(c),
      toggle: (c, f) => (f === undefined ? (classes.has(c) ? classes.delete(c) : classes.add(c)) : (f ? classes.add(c) : classes.delete(c))),
      contains: (c) => classes.has(c)
    },
    setAttribute: (k, v) => { attrs[k] = String(v); }, getAttribute: (k) => attrs[k] ?? null, removeAttribute: (k) => { delete attrs[k]; }
  };
}

function mockSw(reg, onLine = true) {
  vi.stubGlobal('navigator', {
    onLine,
    serviceWorker: { controller: {}, getRegistration: vi.fn(async () => reg), register: vi.fn(async () => reg), addEventListener: vi.fn(), removeEventListener: vi.fn() }
  });
}

describe('settings-shell app-updater', () => {
  let els, updater, state, APP_VERSION;

  beforeAll(async () => {
    vi.stubGlobal('document', { documentElement: { lang: 'id' }, getElementById: (id) => els[id] || null });
    ({ APP_VERSION } = await import('../../app/version.js'));
    ({ state } = await import('../../shared/store.js'));
    updater = await import('./app-updater.js');
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    state.language = 'id';
    els = {
      'app-version': makeEl('app-version'),
      'app-version-text': makeEl('app-version-text'),
      'app-version-status': makeEl('app-version-status')
    };
    vi.stubGlobal('navigator', { onLine: true });
    vi.stubGlobal('caches', { keys: vi.fn(async () => [`tasbihku-v${APP_VERSION}`]) });
    updater.resetUpdaterState();
  });

  it('compares semantic version strings accurately', () => {
    expect(updater.compareVersions('1.16.2', '1.16.1')).toBe(1);
    expect(updater.compareVersions('2.0.0', '1.99.9')).toBe(1);
    expect(updater.compareVersions('1.16.1', '1.16.1')).toBe(0);
    expect(updater.compareVersions('1.2.0', '1.10.0')).toBe(-1);
    expect(updater.compareVersions('tasbihku-v1.17.0', '1.16.9')).toBe(1);
    expect(updater.compareVersions('invalid', '1.16.1')).toBe(0);
  });

  it('syncs footer version label, aria-label, and idle hint across languages', () => {
    updater.syncVersionUI();
    expect(els['app-version-text'].textContent).toBe(`tasbihku-v${APP_VERSION}`);
    expect(els['app-version'].getAttribute('aria-label')).toContain(APP_VERSION);
    expect(els['app-version-status'].textContent).toBe('Ketuk untuk periksa pembaruan');

    state.language = 'en';
    updater.syncVersionUI();
    expect(els['app-version-status'].textContent).toBe('Tap to check for updates');
  });

  it('reports unsupported status when serviceWorker is unavailable', async () => {
    const res = await updater.checkForAppUpdate();
    expect(res.status).toBe('unsupported');
    expect(showToastMock).toHaveBeenCalledTimes(1);
    expect(els['app-version'].disabled).toBe(false);
    expect(els['app-version-status'].classList.contains('is-error')).toBe(true);
  });

  it('reports offline status without calling registration update when offline', async () => {
    const updateSpy = vi.fn();
    mockSw({ update: updateSpy }, false);
    const res = await updater.checkForAppUpdate();
    expect(res.status).toBe('offline');
    expect(updateSpy).not.toHaveBeenCalled();
    expect(showToastMock).toHaveBeenCalledTimes(1);
  });

  it('shows up-to-date feedback when no newer worker or cache is found', async () => {
    const reg = { installing: null, waiting: null, active: { state: 'activated' }, update: vi.fn(async () => reg) };
    mockSw(reg);
    const res = await updater.checkForAppUpdate();
    expect(res.status).toBe('up-to-date');
    expect(reg.update).toHaveBeenCalledTimes(1);
    expect(setManualUpdateCheckMock).toHaveBeenNthCalledWith(1, true);
    expect(setManualUpdateCheckMock).toHaveBeenLastCalledWith(false);
    expect(showToastMock).toHaveBeenCalledWith(expect.stringContaining(APP_VERSION));
    expect(els['app-version'].getAttribute('aria-busy')).toBe('false');
  });

  it('prompts to reload when a new worker installs and supports cancel then retry', async () => {
    const listeners = {};
    const newWorker = {
      state: 'installing', postMessage: vi.fn(),
      addEventListener: vi.fn((evt, cb) => { listeners[evt] = cb; }), removeEventListener: vi.fn()
    };
    const reg = {
      installing: null, waiting: null,
      update: vi.fn(async () => {
        reg.installing = newWorker;
        setTimeout(() => { newWorker.state = 'installed'; reg.waiting = newWorker; reg.installing = null; listeners.statechange?.(); }, 0);
        return reg;
      })
    };
    mockSw(reg);
    vi.stubGlobal('caches', { keys: vi.fn().mockResolvedValueOnce([`tasbihku-v${APP_VERSION}`]).mockResolvedValue(['tasbihku-v9.9.9']) });
    const reloadSpy = vi.fn();
    const res = await updater.checkForAppUpdate({ reloadFn: reloadSpy });
    expect(res.status).toBe('update-available');
    expect(res.version).toBe('9.9.9');
    expect(els['app-version'].classList.contains('has-update')).toBe(true);
    expect(showModalMock).toHaveBeenCalledTimes(1);
    const [, msg, , isAlert, onNo] = showModalMock.mock.calls[0];
    expect(msg).toContain('9.9.9');
    expect(isAlert).toBe(false);
    onNo?.();
    expect(reloadSpy).not.toHaveBeenCalled();
    const retryRes = await updater.checkForAppUpdate({ reloadFn: reloadSpy });
    expect(retryRes.status).toBe('update-available');
    expect(reg.update).toHaveBeenCalledTimes(1);
    const yesAction = showModalMock.mock.calls[1][2];
    await yesAction();
    expect(newWorker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });

  it('detects a newer version already activated in Cache Storage without page reload', async () => {
    const reg = { installing: null, waiting: null, update: vi.fn(async () => reg) };
    mockSw(reg);
    vi.stubGlobal('caches', { keys: vi.fn(async () => [`tasbihku-v${APP_VERSION}`, 'tasbihku-v9.9.9']) });
    const res = await updater.checkForAppUpdate({ reloadFn: vi.fn() });
    expect(res.status).toBe('update-available');
    expect(res.version).toBe('9.9.9');
    expect(showModalMock).toHaveBeenCalledTimes(1);
  });

  it('recovers cleanly on update failure and ignores overlapping concurrent clicks', async () => {
    let rejectUpdate;
    const reg = { installing: null, waiting: null, update: vi.fn(() => new Promise((_, reject) => { rejectUpdate = reject; })) };
    mockSw(reg);

    const first = updater.checkForAppUpdate();
    await new Promise((r) => setTimeout(r, 0));
    const second = await updater.checkForAppUpdate();
    expect(second.status).toBe('busy');
    expect(els['app-version'].disabled).toBe(true);

    rejectUpdate(new Error('network error'));
    const firstRes = await first;
    expect(firstRes.status).toBe('error');
    expect(els['app-version'].disabled).toBe(false);
    expect(els['app-version'].getAttribute('aria-busy')).toBe('false');
    expect(els['app-version-status'].classList.contains('is-error')).toBe(true);
    expect(showToastMock).toHaveBeenCalledTimes(1);
  });

  it('treats initial same-version service worker activation without prior controller as up-to-date', async () => {
    const firstWorker = { state: 'activated', addEventListener: vi.fn(), removeEventListener: vi.fn() };
    const reg = { installing: firstWorker, waiting: null, active: null, update: vi.fn(async () => { reg.active = firstWorker; reg.installing = null; return reg; }) };
    mockSw(reg);
    global.navigator.serviceWorker.controller = null;
    const res = await updater.checkForAppUpdate();
    expect(res.status).toBe('up-to-date');
    expect(showModalMock).not.toHaveBeenCalled();
    expect(showToastMock).toHaveBeenCalledWith(expect.stringContaining(APP_VERSION));
  });
});
