// @feature settings-shell | domain: settings | slots: page-shell,app-nav,settings-panel,about-view | cmds: ui:show-modal,ui:close-modal,ui:update-reset-btn,settings:show-page,settings:go-back,settings:switch-app-mode,settings:switch-dashboard-mode,settings:set-language,settings:toggle-wakelock,settings:toggle-oled,settings:toggle-sound,settings:toggle-vibration,settings:set-vibration-interval,settings:set-arabic-size,settings:toggle-pagi-reminder,settings:set-pagi-time,settings:toggle-petang-reminder,settings:set-petang-time,settings:export-data,settings:trigger-import,settings:import-data,settings:update-username,settings:init-ui,settings:handle-routing,settings:check-update,settings:install-app,settings:dismiss-install | summary: SPA router, modal stack dialogs, theme/sound/vibration/font settings, app/dashboard modes, and JSON backup

export const featureManifest = {
  id: 'settings-shell',
  domain: 'settings',
  slots: ['page-shell', 'app-nav', 'settings-panel', 'about-view'],
  cmds: [
    'ui:show-modal',
    'ui:close-modal',
    'ui:update-reset-btn',
    'settings:show-page',
    'settings:go-back',
    'settings:switch-app-mode',
    'settings:switch-dashboard-mode',
    'settings:set-language',
    'settings:toggle-wakelock',
    'settings:toggle-oled',
    'settings:toggle-sound',
    'settings:toggle-vibration',
    'settings:set-vibration-interval',
    'settings:set-arabic-size',
    'settings:toggle-pagi-reminder',
    'settings:set-pagi-time',
    'settings:toggle-petang-reminder',
    'settings:set-petang-time',
    'settings:export-data',
    'settings:trigger-import',
    'settings:import-data',
    'settings:update-username',
    'settings:init-ui',
    'settings:handle-routing',
    'settings:check-update',
    'settings:install-app',
    'settings:dismiss-install'
  ],
  enabled: true,
  load: () => import('./settings-shell.feature.js')
};
