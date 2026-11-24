// @feature dzikir-guided | domain: dzikir | slots: player-view | cmds: dzikir:start-player,dzikir:get-session,dzikir:player-update,dzikir:player-increment,dzikir:player-undo,dzikir:player-next,dzikir:player-reset,dzikir:player-back | summary: Guided wirid, morning and evening dzikir datasets and player

export const featureManifest = {
  id: 'dzikir-guided',
  domain: 'dzikir',
  slots: ['player-view'],
  cmds: [
    'dzikir:start-player',
    'dzikir:get-session',
    'dzikir:player-update',
    'dzikir:player-increment',
    'dzikir:player-undo',
    'dzikir:player-next',
    'dzikir:player-reset',
    'dzikir:player-back'
  ],
  enabled: true,
  load: () => import('./dzikir-guided.feature.js')
};
