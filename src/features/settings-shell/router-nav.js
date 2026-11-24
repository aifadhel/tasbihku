import {
  activeModalStack,
  getInternalHistoryStack,
  registerModalClose,
  registerModalOpen,
  runPageHook
} from '../../app/slots.js';
import { t } from '../../shared/i18n.js';

let currentModalCallback = null;
let currentModalCancelCallback = null;
let popstateBound = false;

export function showPage(pageId, pushToHistory = true) {
  const internalHistoryStack = getInternalHistoryStack();
  if (typeof document !== 'undefined') {
    const currentActive = document.querySelector('.page.active');
    if (currentActive && currentActive.id === pageId) return;

    document.querySelectorAll('.page').forEach((p) => {
      if (p.id === pageId) p.classList.add('active');
      else p.classList.remove('active');
    });
  }

  runPageHook(pageId);

  if (pushToHistory) {
    const targetUrl = pageId === 'page-about' ? '/about' : (pageId === 'page-dashboard' ? '/' : `#${pageId}`);
    if (typeof history !== 'undefined' && typeof history.pushState === 'function') {
      history.pushState({ pageId }, '', targetUrl);
    }
    internalHistoryStack.push(pageId);
  }
}

export function goBack(fallbackPage = 'page-dashboard') {
  if (activeModalStack.length > 0) {
    const topModal = activeModalStack[activeModalStack.length - 1];
    if (topModal && typeof topModal.closeFn === 'function') {
      topModal.closeFn(false);
    }
    return;
  }

  const internalHistoryStack = getInternalHistoryStack();
  if (internalHistoryStack.length > 0) {
    if (typeof history !== 'undefined' && typeof history.back === 'function') {
      history.back();
    } else {
      internalHistoryStack.pop();
      showPage(fallbackPage, false);
    }
  } else {
    const targetUrl = fallbackPage === 'page-about' ? '/about' : (fallbackPage === 'page-dashboard' ? '/' : `#${fallbackPage}`);
    if (typeof history !== 'undefined' && typeof history.replaceState === 'function') {
      history.replaceState({ pageId: fallbackPage }, '', targetUrl);
    }
    showPage(fallbackPage, false);
  }
}

export function showModal(title, message, yesCallback, isAlert = false, noCallback = null) {
  const titleEl = document.getElementById('modal-title');
  const msgEl = document.getElementById('modal-message');
  const yesBtn = document.getElementById('modal-btn-yes');
  const overlay = document.getElementById('modal-overlay');

  if (titleEl) titleEl.innerText = title;
  if (msgEl) msgEl.innerText = message;
  if (yesBtn) {
    yesBtn.innerText = isAlert ? t('modal_ok') : t('modal_yes');
    yesBtn.onclick = () => {
      const yesCb = currentModalCallback;
      currentModalCallback = null;
      currentModalCancelCallback = null;
      closeModal();
      if (yesCb) yesCb();
    };
  }
  currentModalCallback = yesCallback;
  currentModalCancelCallback = noCallback;

  if (overlay) {
    overlay.classList.add('active');
    registerModalOpen('modal-overlay', closeModal);
  }
}

export function closeModal(fromPopstate = false) {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.remove('active');
  registerModalClose('modal-overlay', fromPopstate);
  currentModalCallback = null;
  if (currentModalCancelCallback) {
    const cancelCb = currentModalCancelCallback;
    currentModalCancelCallback = null;
    cancelCb();
  }
}

export function initRouterListeners() {
  if (popstateBound || typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;
  popstateBound = true;

  window.addEventListener('popstate', (e) => {
    if (activeModalStack.length > 0) {
      const topModal = activeModalStack.pop();
      if (topModal && typeof topModal.closeFn === 'function') {
        topModal.closeFn(true);
      }
      return;
    }

    const internalHistoryStack = getInternalHistoryStack();
    if (internalHistoryStack.length > 0) internalHistoryStack.pop();

    if (e.state && e.state.pageId) {
      showPage(e.state.pageId, false);
    } else if (window.location && window.location.pathname && window.location.pathname.replace(/\/$/, '') === '/about') {
      showPage('page-about', false);
    } else {
      showPage('page-dashboard', false);
    }
  });
}

initRouterListeners();
