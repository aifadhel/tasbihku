// @feature tasbih-counter | domain: tasbih | slots: dashboard-tasbih | cmds: tasbih:dashboard-main,tasbih:dashboard-reset,tasbih:double-tap,tasbih:increment,tasbih:reset,tasbih:prompt-count,tasbih:prompt-target,tasbih:number-close,tasbih:number-apply,tasbih:stopwatch-toggle,tasbih:stopwatch-stop,tasbih:stopwatch-reset,tasbih:stopwatch-ui,tasbih:timer-toggle,tasbih:timer-stop,tasbih:timer-reset,tasbih:timer-ui,tasbih:timer-preset,tasbih:prompt-timer,tasbih:timer-modal-close,tasbih:timer-modal-apply | summary: Free counter, target limit, stopwatch, and countdown timer

export const featureManifest = {
  id: 'tasbih-counter',
  domain: 'tasbih',
  slots: ['dashboard-tasbih'],
  cmds: [
    'tasbih:dashboard-main',
    'tasbih:dashboard-reset',
    'tasbih:double-tap',
    'tasbih:increment',
    'tasbih:reset',
    'tasbih:prompt-count',
    'tasbih:prompt-target',
    'tasbih:number-close',
    'tasbih:number-apply',
    'tasbih:stopwatch-toggle',
    'tasbih:stopwatch-stop',
    'tasbih:stopwatch-reset',
    'tasbih:stopwatch-ui',
    'tasbih:timer-toggle',
    'tasbih:timer-stop',
    'tasbih:timer-reset',
    'tasbih:timer-ui',
    'tasbih:timer-preset',
    'tasbih:prompt-timer',
    'tasbih:timer-modal-close',
    'tasbih:timer-modal-apply'
  ],
  enabled: true,
  load: () => import('./tasbih-counter.feature.js')
};
