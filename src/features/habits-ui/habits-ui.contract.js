// @feature habits-ui | domain: habits | slots: dashboard-habit,habits-modals | cmds: habits:render,habits:render-stats,habits:update-streak,habits:open-modal,habits:close-modal,habits:save-modal,habits:delete-modal,habits:archive-modal,habits:toggle-schedule-days,habits:toggle-numerical,habits:update-weekly-label,habits:open-detail,habits:close-detail,habits:refresh-detail,habits:calendar-prev,habits:calendar-next,habits:open-log,habits:close-log,habits:save-log,habits:skip-log,habits:notify-timer,habits:request-notif,habits:init-reminders | summary: Habit list, routine sections, modals, calendar, reminders, and lazy charts

export const featureManifest = {
  id: 'habits-ui',
  domain: 'habits',
  slots: ['dashboard-habit', 'habits-modals'],
  cmds: [
    'habits:render',
    'habits:render-stats',
    'habits:update-streak',
    'habits:open-modal',
    'habits:close-modal',
    'habits:save-modal',
    'habits:delete-modal',
    'habits:archive-modal',
    'habits:toggle-schedule-days',
    'habits:toggle-numerical',
    'habits:update-weekly-label',
    'habits:open-detail',
    'habits:close-detail',
    'habits:refresh-detail',
    'habits:calendar-prev',
    'habits:calendar-next',
    'habits:open-log',
    'habits:close-log',
    'habits:save-log',
    'habits:skip-log',
    'habits:notify-timer',
    'habits:request-notif',
    'habits:init-reminders'
  ],
  enabled: true,
  load: () => import('./habits-ui.feature.js')
};
