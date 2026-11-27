import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const showToastMock = vi.fn();
const showModalMock = vi.fn();

vi.mock('../../shared/storage.js', () => ({
  loadPersistedState: vi.fn(async () => null),
  savePersistedState: vi.fn(async () => {}),
  initCrossTabSync: vi.fn(),
  clearLegacyOnLoadError: vi.fn(),
  writeBootPrefs: vi.fn()
}));
vi.mock('../../shared/toast.js', () => ({ showToast: showToastMock }));
vi.mock('./router-nav.js', () => ({
  showModal: showModalMock, closeModal: vi.fn(), goBack: vi.fn(), initRouterListeners: vi.fn(), showPage: vi.fn()
}));

function makeBox(id, display = 'none') {
  return { id, style: { display } };
}

function setupEnv({ readyState = 'loading', standalone = false, userAgent = 'Mozilla/5.0 Chrome/126.0', registerImpl } = {}) {
  const winListeners = {};
  const els = {
    'install-prompt': makeBox('install-prompt', 'none'),
    'btn-install': makeBox('btn-install', 'inline-flex'),
    'install-app-row': makeBox('install-app-row', 'flex')
  };
  const registerMock = registerImpl || vi.fn(async () => ({ addEventListener: vi.fn() }));
  vi.stubGlobal('CustomEvent', class { constructor(type) { this.type = type; } });
  vi.stubGlobal('window', {
    addEventListener: vi.fn((evt, cb) => { (winListeners[evt] = winListeners[evt] || []).push(cb); }),
    dispatchEvent: vi.fn((evt) => { (winListeners[evt.type] || []).forEach((cb) => cb(evt)); return true; }),
    matchMedia: vi.fn(() => ({ matches: standalone }))
  });
  vi.stubGlobal('document', {
    readyState,
    getElementById: (id) => els[id] || null
  });
  vi.stubGlobal('navigator', {
    userAgent,
    maxTouchPoints: 0,
    serviceWorker: { register: registerMock, controller: null }
  });
  return { els, winListeners, registerMock };
}

describe('settings-shell app-installer & early PWA boot capture', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('registers SW immediately when document.readyState is complete and on load when loading', async () => {
    const envComplete = setupEnv({ readyState: 'complete' });
    const sys1 = await import('../../shared/system.js');
    sys1.initServiceWorker();
    expect(envComplete.registerMock).toHaveBeenCalledWith('./sw.js', { updateViaCache: 'none' });

    vi.resetModules();
    const envLoading = setupEnv({ readyState: 'loading' });
    const sys2 = await import('../../shared/system.js');
    sys2.initServiceWorker();
    expect(envLoading.registerMock).not.toHaveBeenCalled();
    envLoading.winListeners.load?.forEach((cb) => cb());
    expect(envLoading.registerMock).toHaveBeenCalledWith('./sw.js', { updateViaCache: 'none' });
  });

  it('captures beforeinstallprompt before initInstallPrompt and surfaces #install-prompt', async () => {
    const { els, winListeners } = setupEnv();
    const sys = await import('../../shared/system.js');
    sys.captureInstallPrompt();

    const promptEvt = { preventDefault: vi.fn(), prompt: vi.fn(async () => {}), userChoice: Promise.resolve({ outcome: 'accepted' }) };
    els['install-prompt'].style.display = 'none';
    winListeners.beforeinstallprompt.forEach((cb) => cb(promptEvt));
    expect(promptEvt.preventDefault).toHaveBeenCalledTimes(1);
    expect(sys.getDeferredInstallPrompt()).toBe(promptEvt);

    els['install-prompt'].style.display = 'none';
    sys.initInstallPrompt();
    expect(els['install-prompt'].style.display).toBe('block');

    winListeners.appinstalled.forEach((cb) => cb());
    expect(sys.getDeferredInstallPrompt()).toBeNull();
    expect(els['install-prompt'].style.display).toBe('none');
  });

  it('triggers native prompt when deferredPrompt is ready and handles accept vs dismiss', async () => {
    const { els, winListeners } = setupEnv();
    const sys = await import('../../shared/system.js');
    const { state } = await import('../../shared/store.js');
    state.language = 'en';
    const installer = await import('./app-installer.js');
    sys.captureInstallPrompt();

    const acceptedEvt = { preventDefault: vi.fn(), prompt: vi.fn(async () => {}), userChoice: Promise.resolve({ outcome: 'accepted' }) };
    winListeners.beforeinstallprompt.forEach((cb) => cb(acceptedEvt));

    const resAccepted = await installer.promptAppInstall();
    expect(resAccepted.status).toBe('accepted');
    expect(acceptedEvt.prompt).toHaveBeenCalledTimes(1);
    expect(sys.getDeferredInstallPrompt()).toBeNull();
    expect(els['install-prompt'].style.display).toBe('none');
    expect(showToastMock).toHaveBeenCalledWith('Installing TasbihKu...');

    const dismissedEvt = { preventDefault: vi.fn(), prompt: vi.fn(async () => {}), userChoice: Promise.resolve({ outcome: 'dismissed' }) };
    winListeners.beforeinstallprompt.forEach((cb) => cb(dismissedEvt));
    const resDismissed = await installer.promptAppInstall();
    expect(resDismissed.status).toBe('dismissed');
    expect(showToastMock).toHaveBeenLastCalledWith('Installation cancelled. You can install anytime from Settings.');
  });

  it('opens fallback modal with platform instructions when native prompt is unavailable', async () => {
    setupEnv({ userAgent: 'Mozilla/5.0 (Windows NT 10.0) Chrome/126.0' });
    const { state } = await import('../../shared/store.js');
    state.language = 'en';
    const installer = await import('./app-installer.js');

    const browserRes = await installer.promptAppInstall();
    expect(browserRes).toEqual({ status: 'fallback-modal', platform: 'browser' });
    expect(showModalMock).toHaveBeenCalledWith('Install TasbihKu', expect.stringContaining('Install app'), null, true);

    vi.resetModules();
    setupEnv({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15' });
    const { state: iosState } = await import('../../shared/store.js');
    iosState.language = 'en';
    const iosInstaller = await import('./app-installer.js');

    const iosRes = await iosInstaller.promptAppInstall();
    expect(iosRes).toEqual({ status: 'fallback-modal', platform: 'ios' });
    expect(showModalMock).toHaveBeenLastCalledWith('Install TasbihKu', expect.stringContaining('Add to Home Screen'), null, true);
  });

  it('hides install surfaces when running standalone and supports banner dismiss', async () => {
    const { els } = setupEnv({ standalone: true });
    const { state } = await import('../../shared/store.js');
    state.language = 'id';
    const installer = await import('./app-installer.js');

    installer.syncInstallUI();
    expect(els['install-app-row'].style.display).toBe('none');
    expect(els['install-prompt'].style.display).toBe('none');

    const res = await installer.promptAppInstall();
    expect(res.status).toBe('already-installed');
    expect(showToastMock).toHaveBeenCalledTimes(1);

    els['install-prompt'].style.display = 'block';
    installer.dismissInstallPrompt();
    expect(els['install-prompt'].style.display).toBe('none');
  });
});
