import { dispatch } from '../../app/command-bus.js';
import { registerModalClose, registerModalOpen, swapModal, useCapability } from '../../app/slots.js';
import { t } from '../../shared/i18n.js';
import { saveState, state } from '../../shared/store.js';
import { showToast } from '../../shared/toast.js';
import { closeHabitDetailModal } from './habits-detail.js';
import { renderHabits } from './habits-list.js';
import { attachHabitModalListeners, populateHabitForm, populateLinkedDzikirSelect } from './habits-modal-form.js';
import { requestNotificationPermissionAndRegister } from './habits-reminders.js';

export let currentEditingHabitId = null;

export function openHabitModal(mode, habitId = null) {
  if (typeof document === 'undefined') return;
  currentEditingHabitId = habitId;
  populateLinkedDzikirSelect();
  const modal = document.getElementById('habit-modal');
  if (!modal) return;
  attachHabitModalListeners();
  const habit = mode === 'edit' ? state.habits.find((h) => h.id === habitId) : null;
  populateHabitForm(mode, habit);
  modal.classList.add('active');
  registerModalOpen('habit-modal', closeHabitModal);
}

export function closeHabitModal(fromPopstate = false, { swap = false } = {}) {
  if (typeof document !== 'undefined') {
    const modal = document.getElementById('habit-modal');
    if (modal) modal.classList.remove('active');
  }
  if (swap) swapModal('habit-modal');
  else registerModalClose('habit-modal', fromPopstate);
}

function showValidationModal(titleKey, msgKey) {
  dispatch('ui:show-modal', { title: t(titleKey), message: t(msgKey), isAlert: true }).catch(() => {});
}

export function saveHabitFromModal() {
  const core = useCapability('habitsCore');
  const nameInput = document.getElementById('habit-input-name');
  if (!nameInput || !core) return;
  const nameVal = nameInput.value.trim();
  if (!nameVal) return showValidationModal('modal_invalid_input_title', 'modal_habit_empty_name');

  const descVal = document.getElementById('habit-input-desc')?.value.trim() || '';
  const tagsRaw = document.getElementById('habit-input-tags')?.value || '';
  const tagsVal = tagsRaw.split(',').map((s) => s.trim()).filter(Boolean);
  const schedType = document.getElementById('habit-schedule-type')?.value || 'daily';

  let schedDays = [0, 1, 2, 3, 4, 5, 6];
  if (schedType === 'specific') {
    schedDays = [...document.querySelectorAll('.habit-day-chk:checked')].map((c) => parseInt(c.value, 10));
    if (schedDays.length === 0) return showValidationModal('modal_habit_invalid_schedule_title', 'modal_habit_invalid_schedule_msg');
  }

  const weeklyTarget = schedType === 'weekly' ? parseInt(document.getElementById('habit-input-weekly-target')?.value || '3', 10) : 3;
  let intervalDays = 2;
  let anchorDate = core.getLocalDateString();
  if (schedType === 'interval') {
    intervalDays = parseInt(document.getElementById('habit-input-interval-days')?.value || '2', 10) || 2;
    if (intervalDays < 2) return showValidationModal('modal_invalid_input_title', 'modal_habit_invalid_interval_msg');
    anchorDate = document.getElementById('habit-input-anchor-date')?.value || anchorDate;
  }

  const reminderEnabled = Boolean(document.getElementById('habit-input-reminder-enabled')?.checked);
  const reminderTime = document.getElementById('habit-input-reminder-time')?.value || '08:00';
  const isNumerical = Boolean(document.getElementById('habit-input-numerical')?.checked);
  const targetValue = parseInt(document.getElementById('habit-input-target-val')?.value || '100', 10) || 100;
  const targetUnit = document.getElementById('habit-input-target-unit')?.value.trim() || 'kali';
  const color = document.querySelector('.color-picker-dot.active')?.dataset.color || '#8cd6b5';
  const routineSection = document.getElementById('habit-input-routine')?.value || 'anytime';
  const linkedDzikirId = document.getElementById('habit-input-linked-dzikir')?.value || null;

  const fields = {
    name: nameVal, description: descVal, color, scheduleType: schedType, scheduleDays: schedDays,
    weeklyTarget, intervalDays, anchorDate, reminderEnabled, reminderTime, isNumerical,
    targetValue, targetUnit, tags: tagsVal, routineSection, linkedDzikirId
  };

  if (currentEditingHabitId === null) {
    const newHabit = { id: `h_${Date.now()}`, ...fields, currentStreak: 0, bestStreak: 0, strengthScore: 0, createdAt: Date.now(), archived: false, historicalCount: 0 };
    state.habits.push(newHabit);
    core.updateHabitMetricsCache(newHabit);
  } else {
    const habit = state.habits.find((h) => h.id === currentEditingHabitId);
    if (habit) {
      Object.assign(habit, fields);
      core.updateHabitMetricsCache(habit);
    }
  }

  saveState();
  renderHabits();
  closeHabitModal();
  if (reminderEnabled) requestNotificationPermissionAndRegister();
}

export function deleteHabitFromModal() {
  if (currentEditingHabitId === null) return;
  const targetId = currentEditingHabitId;
  closeHabitModal();
  const habitToDelete = state.habits.find((h) => h.id === targetId);
  if (!habitToDelete) return;
  const index = state.habits.indexOf(habitToDelete);
  const repsBackup = state.habitRepetitions[targetId] ? JSON.parse(JSON.stringify(state.habitRepetitions[targetId])) : null;

  state.habits.splice(index, 1);
  delete state.habitRepetitions[targetId];
  saveState();
  renderHabits();
  closeHabitDetailModal();

  showToast(t('modal_habit_deleted') || 'Habit dihapus', t('btn_undo') || 'Undo', () => {
    state.habits.splice(index, 0, habitToDelete);
    if (repsBackup) state.habitRepetitions[targetId] = repsBackup;
    saveState();
    renderHabits();
  });
}

export function archiveHabitFromModal() {
  if (currentEditingHabitId === null) return;
  const targetId = currentEditingHabitId;
  closeHabitModal(false, { swap: true });
  dispatch('ui:show-modal', {
    title: t('modal_habit_archive_title'),
    message: t('modal_habit_archive_msg'),
    onYes: () => {
      const habit = state.habits.find((h) => h.id === targetId);
      if (habit) { habit.archived = true; saveState(); renderHabits(); closeHabitDetailModal(); }
    },
    onNo: () => openHabitModal('edit', targetId)
  }).catch(() => {});
}
