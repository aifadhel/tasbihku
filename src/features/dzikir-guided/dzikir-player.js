import { dispatch } from '../../app/command-bus.js';
import azkarData from '../../data/azkar.json';
import { animateValue, triggerCelebration } from '../../shared/dom-effects.js';
import { t } from '../../shared/i18n.js';
import { playTapSound, vibrate } from '../../shared/media.js';
import { saveState, state } from '../../shared/store.js';
import { getLocalizedText, getSessionData } from './dzikir-guided.data.js';

let playerAutoSkipTimeout = null;
let lastRenderedPlayerIndex = -1;
let lastPlayerTapTime = 0;
let playerSourcePage = 'page-menu';

export function getPlayerSourcePage() {
  return playerSourcePage;
}

export function startPlayer(type, id = null) {
  dispatch('habits:track-activity').catch(() => {});
  lastRenderedPlayerIndex = -1;
  state.playerType = type;
  state.playerId = id;
  state.playerIndex = 0;
  state.playerCount = 0;
  saveState();

  if (typeof document !== 'undefined') {
    const activePageEl = document.querySelector('.page.active');
    if (activePageEl && activePageEl.id && activePageEl.id !== 'page-player') {
      playerSourcePage = activePageEl.id;
    }
  }

  const d = getSessionData(type, id);
  if (!d.pages || d.pages.length === 0) {
    dispatch('ui:show-modal', { title: t('modal_empty_title'), message: t('modal_empty_msg'), isAlert: true }).catch(() => {});
    return;
  }
  updatePlayerUI();
  dispatch('settings:show-page', { arg: 'page-player' }).catch(() => {});
}

export function updatePlayerUI() {
  if (typeof document === 'undefined') return;
  const session = getSessionData(state.playerType, state.playerId);
  if (!session || !session.pages || session.pages.length === 0) return;
  const pages = session.pages;
  if (state.playerIndex >= pages.length) state.playerIndex = pages.length - 1;
  const currentPage = pages[state.playerIndex];

  const scrollViewport = document.getElementById('player-scroll-viewport');
  if (scrollViewport && state.playerIndex !== lastRenderedPlayerIndex) {
    scrollViewport.scrollTop = 0;
    lastRenderedPlayerIndex = state.playerIndex;
  }

  const setText = (id, text) => { const el = document.getElementById(id); if (el) el.innerText = text; };
  const setBlock = (id, text) => {
    const el = document.getElementById(id);
    if (el) { el.innerText = text; el.style.display = text ? 'block' : 'none'; }
  };

  setText('player-title', session.name);
  setText('player-reading-info', `${state.playerIndex + 1} / ${pages.length}`);
  setBlock('player-arabic', currentPage.arabic || '');
  setBlock('player-latin', currentPage.latin || '');
  setBlock('player-translation', getLocalizedText(currentPage.translation, state.language || 'id'));
  setBlock('player-reference', getLocalizedText(currentPage.reference, state.language || 'id'));
  setText('player-counter', state.playerCount);
  setText('player-target-display', t('player_target_format', { target: currentPage.target }));

  const progressEl = document.getElementById('player-progress');
  if (progressEl) {
    const progress = (state.playerCount / Math.max(currentPage.target, 1)) * 100;
    progressEl.style.width = `${Math.min(progress, 100)}%`;
  }

  const undoBtn = document.getElementById('player-undo-btn');
  if (undoBtn) {
    const isDisabled = state.playerIndex === 0 && state.playerCount === 0;
    undoBtn.disabled = isDisabled;
    undoBtn.setAttribute('aria-disabled', isDisabled);
  }
}

export function incrementPlayer() {
  const now = Date.now();
  if (now - lastPlayerTapTime < 60) return false;
  lastPlayerTapTime = now;

  const session = getSessionData(state.playerType, state.playerId);
  if (!session || !session.pages || session.pages.length === 0) return false;

  const currentPage = session.pages[state.playerIndex];
  if (state.playerCount < currentPage.target) {
    state.playerCount++;
    saveState();
    playTapSound();
    updatePlayerUI();
    animateValue('player-counter', state.playerCount);

    if (state.playerCount >= currentPage.target) {
      vibrate([35, 45, 35]);
      triggerCelebration();
      if (currentPage.arabic) {
        const libMatch = azkarData.find((a) => a.arabic && a.arabic.substring(0, 15) === currentPage.arabic.substring(0, 15));
        if (libMatch) {
          dispatch('habits:check-linked', { linkedId: `library-${libMatch.id}` }).catch(() => {});
        }
      }
      if (playerAutoSkipTimeout) clearTimeout(playerAutoSkipTimeout);
      playerAutoSkipTimeout = setTimeout(() => goToNextPlayerPage(), 1000);
    } else if (state.vibrationInterval > 0 && state.playerCount % state.vibrationInterval === 0) {
      vibrate([40, 40]);
    } else {
      vibrate(15);
    }
  }
  return true;
}

export function playerUndo() {
  vibrate([30, 50, 30]);
  if (state.playerCount > 0) {
    state.playerCount--;
    saveState();
    updatePlayerUI();
    animateValue('player-counter', state.playerCount);
  } else if (state.playerIndex > 0) {
    state.playerIndex--;
    const prevPage = getSessionData(state.playerType, state.playerId).pages[state.playerIndex];
    state.playerCount = Math.max(0, prevPage.target - 1);
    saveState();
    updatePlayerUI();
  }
}

export function goToNextPlayerPage() {
  if (playerAutoSkipTimeout) clearTimeout(playerAutoSkipTimeout);
  const session = getSessionData(state.playerType, state.playerId);
  const pages = session.pages;
  const textContainer = typeof document !== 'undefined' ? document.getElementById('player-text-container') : null;

  if (state.playerIndex < pages.length - 1) {
    if (textContainer) {
      textContainer.style.opacity = '0';
      setTimeout(() => {
        state.playerIndex++;
        state.playerCount = 0;
        saveState();
        updatePlayerUI();
        textContainer.style.opacity = '1';
      }, 150);
    } else {
      state.playerIndex++;
      state.playerCount = 0;
      saveState();
      updatePlayerUI();
    }
    return;
  }

  if (state.playerType === 'pagi' || state.playerType === 'petang' || state.playerType === 'wirid') {
    dispatch('habits:check-linked', { linkedId: `guided-${state.playerType}`, notifyStacking: true }).catch(() => {});
  } else if (state.playerType === 'custom') {
    dispatch('habits:check-linked', { linkedId: `custom-${state.playerId}`, notifyStacking: true }).catch(() => {});
  }

  dispatch('ui:show-modal', {
    title: t('modal_celebration_title'),
    message: t('modal_celebration_msg', { name: session.name }),
    onYes: () => dispatch('settings:go-back', { fallback: playerSourcePage || 'page-menu' }).catch(() => {})
  }).catch(() => {});
}

export function confirmResetPlayer() {
  if (state.playerCount === 0 && state.playerIndex === 0) return;
  dispatch('ui:show-modal', {
    title: t('modal_reset_confirm_title'),
    message: t('modal_reset_confirm_msg'),
    onYes: () => {
      state.playerIndex = 0;
      state.playerCount = 0;
      if (playerAutoSkipTimeout) clearTimeout(playerAutoSkipTimeout);
      saveState();
      updatePlayerUI();
    }
  }).catch(() => {});
}
