/**
 * Centralized page hook registry, history stack, and active modal stack.
 */
export const pageHooks = {};
export const activeModalStack = [];
const capabilities = new Map();
let internalHistoryStack = [];
let pendingModalSwap = false;

export function resetModalStack() {
  activeModalStack.length = 0;
  pendingModalSwap = false;
}

export function registerCapability(name, api) {
  capabilities.set(name, api);
}

export function useCapability(name) {
  return capabilities.get(name) || null;
}

export function getInternalHistoryStack() {
  return internalHistoryStack;
}

export function resetInternalHistoryStack() {
  internalHistoryStack = [];
}

export function registerPageHook(pageId, fn) {
  pageHooks[pageId] = fn;
}

export function runPageHook(pageId) {
  if (typeof pageHooks[pageId] === 'function') {
    pageHooks[pageId]();
  }
}

export function registerModalOpen(modalId, closeFn) {
  if (activeModalStack.some((m) => m.id === modalId)) return;
  activeModalStack.push({ id: modalId, closeFn });
  if (typeof history !== 'undefined') {
    const currentUrl = typeof window !== 'undefined' && window.location
      ? (window.location.href || window.location.pathname || '')
      : '';
    if (pendingModalSwap && typeof history.replaceState === 'function') {
      pendingModalSwap = false;
      history.replaceState({ modal: modalId }, '', currentUrl);
    } else if (typeof history.pushState === 'function') {
      pendingModalSwap = false;
      history.pushState({ modal: modalId }, '', currentUrl);
    }
  }
}

export function swapModal(fromModalId) {
  const idx = activeModalStack.findIndex((m) => m.id === fromModalId);
  if (idx !== -1) {
    activeModalStack.splice(idx, 1);
    pendingModalSwap = true;
  }
}

export function registerModalClose(modalId, fromPopstate = false) {
  const idx = activeModalStack.findIndex((m) => m.id === modalId);
  if (idx !== -1) {
    activeModalStack.splice(idx, 1);
    if (!fromPopstate && typeof history !== 'undefined' && typeof history.back === 'function') {
      history.back();
    }
  }
}

export function hasActiveModals() {
  return activeModalStack.length > 0;
}
