const fs = require('fs');
const content = fs.readFileSync('src/modules/habits.js', 'utf8');

let newContent = content;

// Replace top imports
newContent = newContent.replace(
    /import \{ state, saveState, saveStateImmediate \} from '\.\.\/core\/store\.js';\nimport \{ vibrate, playTapSound \} from '\.\.\/hardware\/media\.js';\nimport \{ showModal, closeModal, SVG_ICONS \} from '\.\.\/ui\/router\.js';/g,
    `import { state, saveState, saveStateImmediate } from '../core/store.js';
import { vibrate, playTapSound } from '../hardware/media.js';
import { showModal, closeModal, SVG_ICONS } from '../ui/router.js';
import {
    getLocalDateString,
    getRecentDates,
    calculateStreak,
    isHabitScheduledOnDate,
    getHabitCompletionStatus,
    calculateHabitStrength,
    getHabitStreaks,
    isHabitCompletedOn
} from './habits-data.js';
import { renderDayOfWeekChart, renderFrequencyChart, renderScoreTrend } from './habits-chart.js';
import { exportHabitCSV } from './habits-export.js';`
);

// Remove Date Helper Functions completely
newContent = newContent.replace(/\/\/ --- Date Helper Functions ---[\s\S]*?\/\/ --- Activity Tracking & Global Streak Math ---/, '// --- Activity Tracking & Global Streak Math ---');

// Remove trackActivity and calculateStreak
newContent = newContent.replace(/export function trackActivity\(\) \{[\s\S]*?export function updateStreakBadge/, 'export function updateStreakBadge');

// Remove Shared Scheduling Helpers
newContent = newContent.replace(/\/\/ --- Shared Scheduling Helpers ---[\s\S]*?export function toggleHabitDay/, 'export function toggleHabitDay');

// Remove renderDayOfWeekChart, renderFrequencyChart, renderScoreTrend
newContent = newContent.replace(/export function renderDayOfWeekChart[\s\S]*?\/\/ --- Habit Collapsible Archive\/Restore\/Delete ---/, '// --- Habit Collapsible Archive/Restore/Delete ---');

// Remove generateHabitCSVData and exportHabitCSV
newContent = newContent.replace(/export function generateHabitCSVData[\s\S]*?export function requestNotificationPermission/, 'export function requestNotificationPermission');

fs.writeFileSync('src/modules/habits-ui.js', newContent);
console.log('habits-ui.js created with length:', newContent.length);
