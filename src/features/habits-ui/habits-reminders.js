import { dispatch } from '../../app/command-bus.js';
import { useCapability } from '../../app/slots.js';
import { t } from '../../shared/i18n.js';
import { state } from '../../shared/store.js';

let lastReminderCheckMinute = -1;
let reminderTimerId = null;

function notifyModal(titleKey, msgKey) {
  dispatch('ui:show-modal', { title: t(titleKey), message: t(msgKey), isAlert: true }).catch(() => {});
}

export function requestNotificationPermission(onGranted = null, onDenied = null) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    notifyModal('modal_notif_unsupported_title', 'modal_notif_unsupported_msg');
    if (onDenied) onDenied();
    return;
  }
  if (Notification.permission === 'default') {
    Notification.requestPermission().then((perm) => {
      if (perm === 'granted') { if (onGranted) onGranted(); }
      else { notifyModal('modal_notif_denied_title', 'modal_notif_denied_msg'); if (onDenied) onDenied(); }
    });
  } else if (Notification.permission === 'denied') {
    notifyModal('modal_notif_blocked_title', 'modal_notif_blocked_msg');
    if (onDenied) onDenied();
  } else if (Notification.permission === 'granted' && onGranted) {
    onGranted();
  }
}

export function requestNotificationPermissionAndRegister() {
  requestNotificationPermission(null, () => {
    if (typeof document === 'undefined') return;
    const chk = document.getElementById('habit-input-reminder-enabled');
    if (chk) {
      chk.checked = false;
      const timeInput = document.getElementById('habit-input-reminder-time');
      if (timeInput) timeInput.style.display = 'none';
    }
  });
}

function showAppNotification(title, options) {
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((reg) => reg.showNotification(title, options)).catch(() => {});
  } else {
    new Notification(title, options);
  }
}

export function triggerNotification(habit) {
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;
  showAppNotification('Ingat Kebiasaan Baik!', {
    body: t('notif_habit_reminder', { name: habit.name }),
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: [200, 100, 200],
    tag: `reminder-${habit.id}`,
    renotify: true,
    data: { habitId: habit.id }
  });
}

export function triggerDzikirNotification(type) {
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;
  const title = type === 'pagi' ? t('notif_time_pagi') : t('notif_time_petang');
  const body = type === 'pagi'
    ? 'Sudah masuk waktu pagi, yuk luangkan waktu sejenak untuk berdzikir.'
    : 'Sudah masuk waktu petang, yuk luangkan waktu sejenak untuk berdzikir.';
  showAppNotification(title, {
    body,
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: [300, 100, 300],
    tag: `dzikir-${type}`,
    renotify: true,
    data: { type: `dzikir-${type}` }
  });
}

export function triggerTimerNotification() {
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;
  showAppNotification(t('notif_time_up'), {
    body: 'Waktu timer telah habis. Alhamdulillah!',
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: [500, 200, 500],
    tag: 'timer-finished',
    renotify: true,
    data: { type: 'timer-finished' }
  });
}

export function initRemindersTimer() {
  if (reminderTimerId) return;
  reminderTimerId = setInterval(() => {
    const core = useCapability('habitsCore');
    if (!core) return;
    const now = new Date();
    const min = now.getMinutes();
    if (min === lastReminderCheckMinute) return;
    lastReminderCheckMinute = min;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    const todayStr = core.getLocalDateString();

    state.habits.forEach((habit) => {
      if (habit.reminderEnabled && !habit.archived && habit.reminderTime === timeStr) {
        const reps = state.habitRepetitions[habit.id] || {};
        if (!reps[todayStr] && core.isHabitScheduledOnDate(habit, todayStr)) triggerNotification(habit);
      }
    });
    if (state.pagiReminderEnabled && state.pagiReminderTime === timeStr) triggerDzikirNotification('pagi');
    if (state.petangReminderEnabled && state.petangReminderTime === timeStr) triggerDzikirNotification('petang');
  }, 30000);
}
