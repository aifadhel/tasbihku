import { dispatch } from './command-bus.js';
import { activeModalStack } from './slots.js';
import { vibrate } from '../shared/media.js';

let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
let lastTapTime = 0;
let longPressTimer = null;
const SWIPE_THRESHOLD = 50;

function extractArg(el, event) {
  if (el.dataset.argJson) {
    try {
      return JSON.parse(el.dataset.argJson);
    } catch (_) {
      return undefined;
    }
  }
  const payload = {};
  if (el.dataset.arg !== undefined) payload.arg = el.dataset.arg;
  if (el.dataset.arg2 !== undefined) payload.arg2 = el.dataset.arg2;
  if ('checked' in el && el.type === 'checkbox') payload.checked = el.checked;
  const tag = el.tagName ? el.tagName.toUpperCase() : '';
  const isValueControl = !tag || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';
  if (isValueControl && 'value' in el && !['checkbox', 'button', 'submit', 'reset'].includes(el.type)) {
    payload.value = el.value;
  }
  if (el.files && el.files[0]) payload.file = el.files[0];
  payload.event = event;
  payload.target = el;
  return payload;
}

export function handleTablistKeyboard(e) {
  const tablist = document.getElementById('dashboard-mode-switcher');
  if (!tablist) return false;
  const focusedTab = document.activeElement
    ? document.activeElement.closest('#dashboard-mode-switcher [role="tab"]')
    : null;
  if (!focusedTab) return false;

  const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
  const currentIndex = tabs.indexOf(focusedTab);
  if (currentIndex === -1) return false;

  let targetIndex = -1;
  if (e.key === 'ArrowRight') targetIndex = (currentIndex + 1) % tabs.length;
  else if (e.key === 'ArrowLeft') targetIndex = (currentIndex - 1 + tabs.length) % tabs.length;
  else if (e.key === 'Home') targetIndex = 0;
  else if (e.key === 'End') targetIndex = tabs.length - 1;

  if (targetIndex !== -1) {
    e.preventDefault();
    const targetTab = tabs[targetIndex];
    const mode = targetTab.getAttribute('data-mode');
    if (mode) {
      dispatch('settings:switch-dashboard-mode', { arg: mode }).catch(console.error);
      targetTab.focus();
    }
    return true;
  }
  return false;
}

function handleSwipeGesture() {
  if (touchStartX < 35) return;
  const diffX = touchEndX - touchStartX;
  const diffY = Math.abs(touchEndY - touchStartY);
  if (Math.abs(diffX) > SWIPE_THRESHOLD && diffY < SWIPE_THRESHOLD) {
    const playerPage = document.getElementById('page-player');
    if (playerPage && playerPage.classList.contains('active')) {
      dispatch('dzikir:player-undo').catch(console.error);
    }
  }
}

export function initDomBridge() {
  if (typeof document === 'undefined') return;

  document.addEventListener('click', (e) => {
    const stopEl = e.target.closest('[data-stop-prop]');
    if (stopEl) e.stopPropagation();

    const el = e.target.closest('[data-cmd]');
    if (el) {
      const cmd = el.dataset.cmd;
      if (cmd === 'ui:select-self') {
        if (typeof el.select === 'function') el.select();
        return;
      }
      if (cmd) {
        dispatch(cmd, extractArg(el, e)).catch(console.error);
        return;
      }
    }

    if (e.target && e.target.classList && (e.target.classList.contains('m3-modal-overlay') || e.target.classList.contains('habit-detail-overlay'))) {
      const top = activeModalStack[activeModalStack.length - 1];
      if (top && top.id === e.target.id && typeof top.closeFn === 'function') {
        top.closeFn(false);
      } else if (e.target.id === 'time-input-modal') {
        e.target.classList.remove('active');
      }
    }
  });

  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-cmd-change]');
    if (el && el.dataset.cmdChange) {
      dispatch(el.dataset.cmdChange, extractArg(el, e)).catch(console.error);
    }
  });

  document.addEventListener('input', (e) => {
    const el = e.target.closest('[data-cmd-input]');
    if (el && el.dataset.cmdInput) {
      dispatch(el.dataset.cmdInput, extractArg(el, e)).catch(console.error);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const top = activeModalStack[activeModalStack.length - 1];
      if (top && typeof top.closeFn === 'function') {
        top.closeFn(false);
        return;
      }
      const timeModal = document.getElementById('time-input-modal');
      if (timeModal && timeModal.classList.contains('active')) {
        timeModal.classList.remove('active');
        return;
      }
    }

    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (document.querySelector('.modal.active') || activeModalStack.length > 0) return;
    if (handleTablistKeyboard(e)) return;

    const dashEl = document.getElementById('page-dashboard');
    const playerEl = document.getElementById('page-player');
    const dashboardActive = Boolean(dashEl && dashEl.classList.contains('active'));
    const playerActive = Boolean(playerEl && playerEl.classList.contains('active'));

    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (dashboardActive) dispatch('tasbih:dashboard-main').catch(console.error);
      else if (playerActive) dispatch('dzikir:player-increment').catch(console.error);
    } else if ((e.key === 'r' || e.key === 'R' || e.code === 'KeyR') && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (dashboardActive) {
        e.preventDefault();
        dispatch('tasbih:dashboard-reset').catch(console.error);
      }
    } else if (e.key === 'z' && (e.ctrlKey || e.metaKey) && playerActive) {
      e.preventDefault();
      dispatch('dzikir:player-undo').catch(console.error);
    }
  });

  document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    const target = e.target.closest('#dashboard-main-btn, #player-main-btn');
    if (target) {
      const now = Date.now();
      const tapLength = now - lastTapTime;
      if (tapLength < 300 && tapLength > 0) {
        if (e.cancelable) e.preventDefault();
        if (target.id === 'dashboard-main-btn') dispatch('tasbih:double-tap').catch(console.error);
        else if (target.id === 'player-main-btn') dispatch('dzikir:player-increment').catch(console.error);
      }
      lastTapTime = now;
      longPressTimer = setTimeout(() => {
        vibrate([50, 50, 50]);
        dispatch('settings:show-page', { arg: 'page-menu' }).catch(console.error);
      }, 800);
    }
  }, { passive: false });

  document.addEventListener('touchmove', () => {
    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipeGesture();
  }, { passive: true });
}
