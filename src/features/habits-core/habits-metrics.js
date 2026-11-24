import { emitEvent } from '../../app/command-bus.js';
import { saveState, state } from '../../shared/store.js';
import {
  getHabitCompletionStatus,
  getHabitFrequency,
  getLocalDateString,
  isHabitScheduledOnDate
} from './habits-dates.js';

export function calculateHabitStrength(habit) {
  const repetitions = state.habitRepetitions[habit.id] || {};
  const multiplier = Math.pow(0.5, getHabitFrequency(habit) / 13.0);
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  let start = new Date();
  start.setDate(start.getDate() - 90);
  start.setHours(12, 0, 0, 0);
  if (habit.createdAt) {
    const created = new Date(habit.createdAt);
    created.setHours(12, 0, 0, 0);
    if (created > start) start = created;
  }

  let score = 0.0;
  const tempDate = new Date(start);
  tempDate.setHours(12, 0, 0, 0);

  while (tempDate <= today) {
    const dateStr = getLocalDateString(tempDate);
    if (isHabitScheduledOnDate(habit, dateStr)) {
      const entry = repetitions[dateStr];
      let completed = 0;
      let isSkipped = false;
      if (entry) {
        if (entry.skipped) isSkipped = true;
        else if (habit.isNumerical) completed = Math.min(1.0, (entry.value || 0) / (habit.targetValue || 1));
        else completed = 1.0;
      }
      if (!isSkipped) score = score * multiplier + completed * (1 - multiplier);
    }
    tempDate.setDate(tempDate.getDate() + 1);
    tempDate.setHours(12, 0, 0, 0);
  }
  return Math.round(score * 100);
}

function getWeeklyStreaks(habit, repetitions, keys) {
  const target = habit.weeklyTarget || 3;
  const weeklyCompletions = {};
  keys.forEach((dateStr) => {
    if (getHabitCompletionStatus(habit, repetitions[dateStr]).completed) {
      const [yr, mo, dy] = dateStr.split('-').map(Number);
      const date = new Date(yr, mo - 1, dy);
      const sunday = new Date(date);
      sunday.setDate(date.getDate() - date.getDay());
      const sunStr = getLocalDateString(sunday);
      weeklyCompletions[sunStr] = (weeklyCompletions[sunStr] || 0) + 1;
    }
  });

  const start = new Date(habit.createdAt || Date.now());
  start.setDate(start.getDate() - start.getDay());
  start.setHours(12, 0, 0, 0);
  const today = new Date();
  const todaySunday = new Date(today);
  todaySunday.setDate(today.getDate() - today.getDay());
  todaySunday.setHours(12, 0, 0, 0);

  let running = 0;
  let best = 0;
  const temp = new Date(start);
  while (temp <= todaySunday) {
    const count = weeklyCompletions[getLocalDateString(temp)] || 0;
    const isCurrentWeek = temp.getTime() === todaySunday.getTime();
    if (count >= target) {
      running++;
      if (running > best) best = running;
    } else if (!isCurrentWeek) {
      running = 0;
    }
    temp.setDate(temp.getDate() + 7);
    temp.setHours(12, 0, 0, 0);
  }
  return { current: running, best: Math.max(best, running) };
}

function getDailyStreaks(habit, repetitions, keys) {
  const sortedReps = [...keys].sort((a, b) => new Date(a) - new Date(b));
  let start = new Date(habit.createdAt || Date.now());
  if (sortedReps.length > 0) {
    const oldest = new Date(sortedReps[0]);
    if (oldest < start) start = oldest;
  }
  start.setHours(12, 0, 0, 0);

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const multiplier = Math.pow(0.5, getHabitFrequency(habit) / 13.0);

  let running = 0;
  let best = 0;
  let graceUsed = false;
  let runningScore = 0.0;
  const temp = new Date(start);
  temp.setHours(12, 0, 0, 0);

  while (temp <= today) {
    const dateStr = getLocalDateString(temp);
    if (isHabitScheduledOnDate(habit, dateStr)) {
      const { completed: isCompleted, skipped: isSkipped } = getHabitCompletionStatus(habit, repetitions[dateStr]);
      if (!isSkipped) runningScore = runningScore * multiplier + (isCompleted ? 1 : 0) * (1 - multiplier);
      if (isCompleted) {
        running++;
        graceUsed = false;
        if (running > best) best = running;
      } else if (!isSkipped && temp.getTime() !== today.getTime()) {
        if (!graceUsed && (runningScore * 100) >= 80) graceUsed = true;
        else { running = 0; graceUsed = false; }
      }
    }
    temp.setDate(temp.getDate() + 1);
    temp.setHours(12, 0, 0, 0);
  }
  return { current: running, best: Math.max(best, running) };
}

export function getHabitStreaks(habitId) {
  const habit = state.habits.find((h) => h.id === habitId);
  if (!habit) return { current: 0, best: 0 };
  const repetitions = state.habitRepetitions[habitId] || {};
  const keys = Object.keys(repetitions);
  if (keys.length === 0) return { current: 0, best: 0 };
  if (habit.scheduleType === 'weekly') return getWeeklyStreaks(habit, repetitions, keys);
  return getDailyStreaks(habit, repetitions, keys);
}

export function updateHabitMetricsCache(habit) {
  if (!habit) return;
  const streaks = getHabitStreaks(habit.id);
  habit.currentStreak = streaks.current;
  habit.bestStreak = streaks.best;
  habit.strengthScore = calculateHabitStrength(habit);
}

export function refreshAllHabitMetricsCache() {
  if (!state.habits) return;
  state.habits.forEach((habit) => updateHabitMetricsCache(habit));
}

export function checkAndTriggerLinkedHabit(linkedId, notifyStacking = false) {
  if (!state.habits) return [];
  const todayStr = getLocalDateString();
  let updatedAny = false;
  const completedHabits = [];

  state.habits.forEach((habit) => {
    if (!habit.archived && habit.linkedDzikirId === linkedId) {
      if (!state.habitRepetitions[habit.id]) state.habitRepetitions[habit.id] = {};
      const reps = state.habitRepetitions[habit.id];
      const entry = reps[todayStr];
      const done = entry && (habit.isNumerical ? entry.value >= habit.targetValue : !entry.skipped);
      if (!done) {
        reps[todayStr] = {
          value: habit.isNumerical ? (habit.targetValue || 100) : 1,
          note: entry && entry.note ? entry.note : 'Otomatis via Dzikir Stacking'
        };
        state.habitRepetitions[habit.id] = reps;
        updateHabitMetricsCache(habit);
        completedHabits.push(habit.name);
        updatedAny = true;
      }
    }
  });

  if (updatedAny) {
    saveState();
    if (notifyStacking && completedHabits.length > 0) {
      emitEvent('habits:completed-linked', { names: completedHabits });
    }
  }
  return completedHabits;
}
