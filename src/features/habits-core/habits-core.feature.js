import { registerCommand } from '../../app/command-bus.js';
import { registerCapability } from '../../app/slots.js';
import * as dates from './habits-dates.js';
import * as metrics from './habits-metrics.js';
import { exportHabitCSV, generateHabitCSVData } from './habits-export.js';

export function initFeature() {
  registerCapability('habitsCore', {
    ...dates,
    ...metrics,
    exportHabitCSV,
    generateHabitCSVData
  });
  registerCommand('habits:track-activity', dates.trackActivity);
  registerCommand('habits:check-linked', (p) => metrics.checkAndTriggerLinkedHabit(p?.linkedId ?? p, Boolean(p?.notifyStacking)));
  registerCommand('habits:refresh-cache', metrics.refreshAllHabitMetricsCache);
  registerCommand('habits:export-csv', (p) => exportHabitCSV(p?.habitId ?? p?.arg));
}
