import { dispatch } from '../../app/command-bus.js';
import { registerModalClose, registerModalOpen, useCapability } from '../../app/slots.js';
import { fireConfetti } from '../../shared/confetti.js';
import { t } from '../../shared/i18n.js';
import { saveState, state } from '../../shared/store.js';
import { renderHabits } from './habits-list.js';
import { triggerCelebrationHeartbeat } from './habits-progress.js';

export let currentLogHabitId = null;
export let currentLogDateStr = null;

export function toggleHabitNumericalFields(checked) {
  if (typeof document === 'undefined') return;
  const container = document.getElementById('habit-numerical-fields-container');
  if (container) container.style.display = checked ? 'flex' : 'none';
}

export function openHabitLogModal(habitId, dateStr) {
  if (typeof document === 'undefined') return;
  const habit = state.habits.find((h) => h.id === habitId);
  if (!habit) return;
  currentLogHabitId = habitId;
  currentLogDateStr = dateStr;

  const modal = document.getElementById('habit-log-modal');
  if (!modal) return;
  const title = document.getElementById('habit-log-modal-title');
  const numSection = document.getElementById('habit-log-numerical-section');
  const valInput = document.getElementById('habit-log-value');
  const unitSpan = document.getElementById('habit-log-unit');
  const noteInput = document.getElementById('habit-log-note');

  const [yr, mo, dy] = dateStr.split('-').map(Number);
  const lang = state.language === 'en' ? 'en-US' : 'id-ID';
  const dateFormatted = new Date(yr, mo - 1, dy).toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric' });
  if (title) title.innerText = `${t('habit_log_title')}: ${dateFormatted}`;

  const entry = (state.habitRepetitions[habitId] || {})[dateStr] || { value: 0, note: '' };
  if (habit.isNumerical) {
    if (numSection) numSection.style.display = 'block';
    if (valInput) valInput.value = entry.value || 0;
    if (unitSpan) unitSpan.innerText = habit.targetUnit || t('habit_kali');
  } else if (numSection) {
    numSection.style.display = 'none';
  }
  if (noteInput) noteInput.value = entry.note || '';

  modal.classList.add('active');
  registerModalOpen('habit-log-modal', closeHabitLogModal);
}

export function closeHabitLogModal(fromPopstate = false) {
  if (typeof document !== 'undefined') {
    const modal = document.getElementById('habit-log-modal');
    if (modal) modal.classList.remove('active');
  }
  registerModalClose('habit-log-modal', fromPopstate);
  currentLogHabitId = null;
  currentLogDateStr = null;
  dispatch('habits:refresh-detail').catch(() => {});
}

function pruneRepetitions(reps, habit) {
  const keys = Object.keys(reps);
  if (keys.length >= 365) {
    keys.sort((a, b) => new Date(a) - new Date(b));
    delete reps[keys[0]];
    habit.historicalCount = (habit.historicalCount || 0) + 1;
  }
}

export function saveHabitLogFromModal() {
  const core = useCapability('habitsCore');
  if (!currentLogHabitId || !currentLogDateStr || !core) return;
  const habit = state.habits.find((h) => h.id === currentLogHabitId);
  if (!habit) return;

  const valueVal = parseInt(document.getElementById('habit-log-value')?.value || '0', 10) || 0;
  const noteVal = (document.getElementById('habit-log-note')?.value || '').trim();
  const wasCompleted = core.isHabitCompletedOn(habit.id, currentLogDateStr);

  if (!state.habitRepetitions[currentLogHabitId]) state.habitRepetitions[currentLogHabitId] = {};
  const reps = state.habitRepetitions[currentLogHabitId];
  reps[currentLogDateStr] = (!habit.isNumerical && noteVal === '')
    ? { value: 1, note: '' }
    : { value: habit.isNumerical ? valueVal : 1, note: noteVal };

  const isCompletedNow = core.getHabitCompletionStatus(habit, reps[currentLogDateStr]).completed;
  if (!wasCompleted && isCompletedNow && currentLogDateStr === core.getLocalDateString()) {
    triggerCelebrationHeartbeat();
    fireConfetti(80);
  }
  pruneRepetitions(reps, habit);
  state.habitRepetitions[currentLogHabitId] = reps;
  core.updateHabitMetricsCache(habit);
  saveState();
  renderHabits();
  closeHabitLogModal();
}

export function skipHabitLogFromModal() {
  const core = useCapability('habitsCore');
  if (!currentLogHabitId || !currentLogDateStr || !core) return;
  const habit = state.habits.find((h) => h.id === currentLogHabitId);
  if (!habit) return;
  if (!state.habitRepetitions[currentLogHabitId]) state.habitRepetitions[currentLogHabitId] = {};
  const reps = state.habitRepetitions[currentLogHabitId];
  reps[currentLogDateStr] = { value: 0, note: '', skipped: true };
  pruneRepetitions(reps, habit);
  state.habitRepetitions[currentLogHabitId] = reps;
  core.updateHabitMetricsCache(habit);
  saveState();
  renderHabits();
  closeHabitLogModal();
}
