import { dispatch, registerCommand } from '../../app/command-bus.js';
import { getSessionData } from './dzikir-guided.data.js';
import {
  confirmResetPlayer,
  getPlayerSourcePage,
  goToNextPlayerPage,
  incrementPlayer,
  playerUndo,
  startPlayer,
  updatePlayerUI
} from './dzikir-player.js';

export function initFeature() {
  registerCommand('dzikir:start-player', (p) => {
    const type = typeof p === 'string' ? p : p?.type ?? p?.arg;
    const id = typeof p === 'object' ? (p?.id ?? p?.arg2 ?? null) : null;
    startPlayer(type, id);
  });
  registerCommand('dzikir:get-session', (p) => getSessionData(p?.type, p?.id ?? null));
  registerCommand('dzikir:player-update', updatePlayerUI);
  registerCommand('dzikir:player-increment', incrementPlayer);
  registerCommand('dzikir:player-undo', playerUndo);
  registerCommand('dzikir:player-next', goToNextPlayerPage);
  registerCommand('dzikir:player-reset', confirmResetPlayer);
  registerCommand('dzikir:player-back', () => dispatch('settings:go-back', { fallback: getPlayerSourcePage() || 'page-menu' }));
}
