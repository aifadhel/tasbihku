import { onEvent, registerCommand } from '../../app/command-bus.js';
import { t } from '../../shared/i18n.js';
import { navigateCalendarMonth } from './habits-calendar.js';
import { closeHabitDetailModal, getCalendarHabitId, openHabitDetailModal, refreshHabitDetailModal } from './habits-detail.js';
import { renderHabits } from './habits-list.js';
import { showStackingCelebrationToast } from './habits-list-cards.js';
import { closeHabitLogModal, openHabitLogModal, saveHabitLogFromModal, skipHabitLogFromModal, toggleHabitNumericalFields } from './habits-log-modal.js';
import { archiveHabitFromModal, closeHabitModal, deleteHabitFromModal, openHabitModal, saveHabitFromModal } from './habits-modal.js';
import { toggleScheduleDaysView } from './habits-modal-form.js';
import { renderStats, updateStreakBadge } from './habits-progress.js';
import { initRemindersTimer, requestNotificationPermission, triggerTimerNotification } from './habits-reminders.js';

let initialized = false;

export function initFeature() {
  if (initialized) return;
  initialized = true;
  registerCommand('habits:render', renderHabits);
  registerCommand('habits:render-stats', renderStats);
  registerCommand('habits:update-streak', updateStreakBadge);
  registerCommand('habits:open-modal', (p) => openHabitModal(p?.mode ?? p?.arg, p?.habitId ?? null));
  registerCommand('habits:close-modal', () => closeHabitModal(false));
  registerCommand('habits:save-modal', saveHabitFromModal);
  registerCommand('habits:delete-modal', deleteHabitFromModal);
  registerCommand('habits:archive-modal', archiveHabitFromModal);
  registerCommand('habits:toggle-schedule-days', (p) => toggleScheduleDaysView(p?.value ?? p));
  registerCommand('habits:toggle-numerical', (p) => toggleHabitNumericalFields(Boolean(p?.checked ?? p)));
  registerCommand('habits:update-weekly-label', (p) => {
    const label = document.getElementById('weekly-target-label');
    if (label) label.innerText = `${p?.value ?? p} ${t('habit_kali') || 'Kali'}`;
  });
  registerCommand('habits:open-detail', (p) => openHabitDetailModal(p?.habitId ?? p?.arg));
  registerCommand('habits:close-detail', () => closeHabitDetailModal(false));
  registerCommand('habits:refresh-detail', () => { const id = getCalendarHabitId(); if (id) refreshHabitDetailModal(id); });
  registerCommand('habits:calendar-prev', () => navigateCalendarMonth(-1));
  registerCommand('habits:calendar-next', () => navigateCalendarMonth(1));
  registerCommand('habits:open-log', (p) => openHabitLogModal(p?.habitId, p?.dateStr));
  registerCommand('habits:close-log', () => closeHabitLogModal(false));
  registerCommand('habits:save-log', saveHabitLogFromModal);
  registerCommand('habits:skip-log', skipHabitLogFromModal);
  registerCommand('habits:notify-timer', triggerTimerNotification);
  registerCommand('habits:request-notif', (p) => requestNotificationPermission(p?.onGranted ?? null, p?.onDenied ?? null));
  registerCommand('habits:init-reminders', initRemindersTimer);

  onEvent('habits:completed-linked', (payload) => {
    if (payload && Array.isArray(payload.names)) {
      payload.names.forEach((name) => showStackingCelebrationToast(name));
    }
  });
}
