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

describe('router-nav & modal stack navigation', () => {
  let slots;
  let nav;
  let popstateHandler;

  beforeAll(async () => {
    global.window = {
      addEventListener: vi.fn((evt, cb) => { if (evt === 'popstate') popstateHandler = cb; }),
      location: { pathname: '/', href: 'http://localhost/' }
    };
    global.history = { pushState: vi.fn(), replaceState: vi.fn(), back: vi.fn() };
    global.document = {
      querySelector: vi.fn(() => null),
      querySelectorAll: vi.fn(() => []),
      getElementById: vi.fn(() => null)
    };
    slots = await import('../../app/slots.js');
    nav = await import('./router-nav.js');
  });

  beforeEach(() => {
    slots.resetModalStack();
    slots.resetInternalHistoryStack();
    vi.clearAllMocks();
  });

  it('pushes modal to activeModalStack once (idempotent) and pushes history', () => {
    const closeFn = vi.fn();
    slots.registerModalOpen('test-modal', closeFn);
    slots.registerModalOpen('test-modal', closeFn);
    expect(slots.hasActiveModals()).toBe(true);
    expect(slots.activeModalStack).toHaveLength(1);
    expect(global.history.pushState).toHaveBeenCalledTimes(1);
  });

  it('calls history.back when closed via UI action, not when closed via popstate', () => {
    const closeFn = vi.fn();
    slots.registerModalOpen('m1', closeFn);
    slots.registerModalClose('m1', false);
    expect(slots.hasActiveModals()).toBe(false);
    expect(global.history.back).toHaveBeenCalledTimes(1);

    slots.registerModalOpen('m2', closeFn);
    slots.registerModalClose('m2', true);
    expect(slots.hasActiveModals()).toBe(false);
    expect(global.history.back).toHaveBeenCalledTimes(1);
  });

  it('intercepts popstate to close topmost modal without changing pages', () => {
    const close1 = vi.fn();
    const close2 = vi.fn();
    slots.registerModalOpen('m1', close1);
    slots.registerModalOpen('m2', close2);
    expect(typeof popstateHandler).toBe('function');

    popstateHandler({ state: { pageId: 'page-menu' } });
    expect(close2).toHaveBeenCalledWith(true);
    expect(close1).not.toHaveBeenCalled();
    expect(slots.activeModalStack).toHaveLength(1);
    expect(slots.activeModalStack[0].id).toBe('m1');
  });

  it('goBack dismisses top modal without history.back and uses history.back when stack non-empty', () => {
    const closeFn = vi.fn();
    slots.registerModalOpen('m1', closeFn);
    nav.goBack('page-dashboard');
    expect(closeFn).toHaveBeenCalledWith(false);
    expect(global.history.back).not.toHaveBeenCalled();

    slots.activeModalStack.length = 0;
    slots.getInternalHistoryStack().push('page-menu');
    nav.goBack('page-dashboard');
    expect(global.history.back).toHaveBeenCalledTimes(1);
  });

  it('showPage is idempotent when target page is already active', () => {
    const active = { id: 'page-dashboard', classList: { contains: () => true, add: vi.fn(), remove: vi.fn() } };
    global.document.querySelector = vi.fn((sel) => (sel === '.page.active' ? active : null));
    nav.showPage('page-dashboard');
    expect(global.history.pushState).not.toHaveBeenCalled();
    global.document.querySelector = vi.fn(() => null);
  });

  it('replaces history entry in-place via swapModal during modal-to-modal transition without history.back', () => {
    const close1 = vi.fn();
    const close2 = vi.fn();
    slots.registerModalOpen('modal-detail', close1);
    slots.swapModal('modal-detail');
    slots.registerModalOpen('modal-edit', close2);
    expect(global.history.back).not.toHaveBeenCalled();
    expect(global.history.replaceState).toHaveBeenCalledWith({ modal: 'modal-edit' }, '', expect.any(String));
    expect(slots.activeModalStack).toHaveLength(1);
    expect(slots.activeModalStack[0].id).toBe('modal-edit');
  });
});
