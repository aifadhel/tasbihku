import { dispatch } from '../../app/command-bus.js';
import { useCapability } from '../../app/slots.js';
import { fireConfetti } from '../../shared/confetti.js';
import { t } from '../../shared/i18n.js';
import { playTapSound, vibrate } from '../../shared/media.js';
import { getRoutineCollapsed, setRoutineCollapsed } from '../../shared/storage.js';
import { saveState, state } from '../../shared/store.js';
import { showToast } from '../../shared/toast.js';
import { triggerCelebrationHeartbeat } from './habits-progress.js';

let archivedSectionExpanded = false;

export function isArchivedSectionExpanded() {
  return archivedSectionExpanded;
}

export function toggleHabitDay(habitId, dateStr, onAfter) {
  const core = useCapability('habitsCore');
  if (!core) return;
  if (!state.habitRepetitions[habitId]) state.habitRepetitions[habitId] = {};
  const reps = state.habitRepetitions[habitId];
  const habit = state.habits.find((h) => h.id === habitId);
  if (!habit) return;

  vibrate(15);
  const entry = reps[dateStr];
  if (!entry) {
    const keys = Object.keys(reps);
    if (keys.length >= 365) {
      keys.sort((a, b) => new Date(a) - new Date(b));
      delete reps[keys[0]];
      habit.historicalCount = (habit.historicalCount || 0) + 1;
    }
    reps[dateStr] = { value: habit.isNumerical ? (habit.targetValue || 100) : 1, note: '' };
    playTapSound();
    if (dateStr === core.getLocalDateString()) {
      triggerCelebrationHeartbeat();
      fireConfetti(80);
    }
  } else if (!entry.skipped) {
    reps[dateStr] = { skipped: true, note: entry.note || '' };
    playTapSound();
  } else {
    delete reps[dateStr];
  }

  state.habitRepetitions[habitId] = reps;
  core.updateHabitMetricsCache(habit);
  saveState();
  if (typeof onAfter === 'function') onAfter();
}

export function restoreHabit(habitId, onAfter) {
  const habit = state.habits.find((h) => h.id === habitId);
  if (!habit) return;
  habit.archived = false;
  saveState();
  if (typeof onAfter === 'function') onAfter();
  vibrate(15);
}

export function permanentDeleteHabit(habitId, onAfter) {
  const habitToDelete = state.habits.find((h) => h.id === habitId);
  if (!habitToDelete) return;
  const index = state.habits.indexOf(habitToDelete);
  const repsBackup = state.habitRepetitions[habitId]
    ? JSON.parse(JSON.stringify(state.habitRepetitions[habitId]))
    : null;

  state.habits.splice(index, 1);
  delete state.habitRepetitions[habitId];
  saveState();
  if (typeof onAfter === 'function') onAfter();

  showToast(t('modal_habit_deleted') || 'Habit dihapus', t('btn_undo') || 'Undo', () => {
    state.habits.splice(index, 0, habitToDelete);
    if (repsBackup) state.habitRepetitions[habitId] = repsBackup;
    saveState();
    if (typeof onAfter === 'function') onAfter();
  });
}

export function toggleArchivedSection() {
  archivedSectionExpanded = !archivedSectionExpanded;
  if (typeof document === 'undefined') return;
  const content = document.getElementById('archived-section-content');
  const chevron = document.getElementById('archived-section-chevron');
  if (content && chevron) {
    content.classList.toggle('expanded', archivedSectionExpanded);
    chevron.classList.toggle('expanded', archivedSectionExpanded);
  }
}

export function toggleRoutineSection(section, onAfter) {
  setRoutineCollapsed(section, !getRoutineCollapsed(section));
  if (typeof onAfter === 'function') onAfter();
}

export function moveHabit(habitId, direction) {
  const index = state.habits.findIndex((h) => h.id === habitId);
  if (index === -1) return false;
  if (direction === 'up' && index > 0) {
    [state.habits[index], state.habits[index - 1]] = [state.habits[index - 1], state.habits[index]];
    return true;
  }
  if (direction === 'down' && index < state.habits.length - 1) {
    [state.habits[index], state.habits[index + 1]] = [state.habits[index + 1], state.habits[index]];
    return true;
  }
  return false;
}

export function launchLinkedDzikir(linkedId) {
  if (!linkedId) return;
  if (linkedId.startsWith('guided-')) {
    dispatch('dzikir:start-player', { type: linkedId.replace('guided-', '') }).catch(() => {});
  } else if (linkedId.startsWith('custom-')) {
    dispatch('dzikir:start-player', { type: 'custom', id: linkedId.replace('custom-', '') }).catch(() => {});
  } else if (linkedId.startsWith('library-')) {
    dispatch('dzikir:start-player', { type: 'library', id: linkedId.replace('library-', '') }).catch(() => {});
  }
}
