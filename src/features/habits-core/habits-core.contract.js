// @feature habits-core | domain: habits | slots: none | cmds: habits:track-activity,habits:check-linked,habits:refresh-cache,habits:export-csv | summary: Pure habit dates, streaks, EMA strength, and CSV export

export const featureManifest = {
  id: 'habits-core',
  domain: 'habits',
  slots: [],
  cmds: [
    'habits:track-activity',
    'habits:check-linked',
    'habits:refresh-cache',
    'habits:export-csv'
  ],
  enabled: true,
  load: () => import('./habits-core.feature.js')
};
