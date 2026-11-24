import { saveState, state } from '../../shared/store.js';

export function getLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

export function getDiffDays(d1, d2) {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  date1.setHours(12, 0, 0, 0);
  date2.setHours(12, 0, 0, 0);
  return Math.round((date1 - date2) / 86400000);
}

export function getTodayDate() {
  return getLocalDateString();
}

export function getPreviousDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getRecentDates() {
  const dates = [];
  const daysIndo = ['Ahd', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  for (let i = 4; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = getLocalDateString(d);
    const label = i === 0 ? 'Hi' : (i === 1 ? 'Km' : daysIndo[d.getDay()]);
    dates.push({ dateStr, label, isToday: i === 0 });
  }
  return dates;
}

export function trackActivity() {
  const today = getTodayDate();
  if (!state.activityLog.includes(today)) {
    state.activityLog.push(today);
    saveState();
    return true;
  }
  return false;
}

export function calculateStreak(useGrace = Boolean(state.istiqamahGrace)) {
  if (!state.activityLog || state.activityLog.length === 0) return 0;
  const uniqueDates = [...new Set(state.activityLog)].sort();
  const today = getTodayDate();
  const yesterday = getPreviousDate(today);
  if (!uniqueDates.includes(today) && !uniqueDates.includes(yesterday)) return 0;

  let streak = 0;
  let currentDate = uniqueDates.includes(today) ? today : yesterday;
  let graceUsed = false;

  while (true) {
    if (uniqueDates.includes(currentDate)) {
      streak++;
      currentDate = getPreviousDate(currentDate);
    } else if (useGrace && !graceUsed) {
      const dayBefore = getPreviousDate(currentDate);
      if (uniqueDates.includes(dayBefore)) {
        graceUsed = true;
        currentDate = dayBefore;
      } else break;
    } else break;
  }
  return streak;
}

export function isHabitScheduledOnDate(habit, dateStr) {
  const [yr, mo, dy] = dateStr.split('-').map(Number);
  const dateObj = new Date(yr, mo - 1, dy);
  const dayOfWeek = dateObj.getDay();
  const diffDays = getDiffDays(dateObj, habit.anchorDate || getLocalDateString());
  if (habit.scheduleType === 'daily' || habit.scheduleType === 'weekly') return true;
  if (habit.scheduleType === 'specific') return Boolean(habit.scheduleDays && habit.scheduleDays.includes(dayOfWeek));
  if (habit.scheduleType === 'interval') return diffDays >= 0 && diffDays % (habit.intervalDays || 2) === 0;
  return true;
}

export function getHabitFrequency(habit) {
  if (habit.scheduleType === 'specific') return (habit.scheduleDays ? habit.scheduleDays.length : 7) / 7.0;
  if (habit.scheduleType === 'weekly') return (habit.weeklyTarget || 3) / 7.0;
  if (habit.scheduleType === 'interval') return 1.0 / (habit.intervalDays || 2);
  return 1.0;
}

export function getHabitCompletionStatus(habit, entry) {
  if (!entry) return { completed: false, partial: false, skipped: false, value: 0 };
  if (entry.skipped) return { completed: false, partial: false, skipped: true, value: 0 };
  const value = entry.value || 0;
  const completed = !habit.isNumerical || value >= habit.targetValue;
  const partial = habit.isNumerical && value < habit.targetValue && value > 0;
  return { completed, partial, skipped: false, value };
}

export function isHabitSkippedOn(habitId, dateStr) {
  const entry = (state.habitRepetitions[habitId] || {})[dateStr];
  return Boolean(entry && entry.skipped);
}

export function isHabitCompletedOn(habitId, dateStr) {
  const entry = (state.habitRepetitions[habitId] || {})[dateStr];
  if (!entry) return false;
  const habit = state.habits.find((h) => h.id === habitId);
  return habit ? getHabitCompletionStatus(habit, entry).completed : false;
}
