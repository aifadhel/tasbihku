import { dispatch } from '../../app/command-bus.js';
import { t } from '../../shared/i18n.js';
import { vibrate } from '../../shared/media.js';
import { state } from '../../shared/store.js';
import { getHabitCompletionStatus } from './habits-dates.js';

export function generateHabitCSVData(habit, reps) {
  const keys = Object.keys(reps || {});
  const sortedDates = [...keys].sort((a, b) => new Date(a) - new Date(b));

  let csvContent = 'Tanggal,Status,Nilai,Catatan\n';
  if (sortedDates.length === 0) {
    csvContent += `${t('modal_empty_title')},,,\n`;
  } else {
    sortedDates.forEach((dateStr) => {
      const entry = reps[dateStr];
      const { completed, partial, skipped } = getHabitCompletionStatus(habit, entry);
      let statusText = t('status_not_completed');
      if (completed) statusText = t('status_completed');
      else if (skipped) statusText = t('status_skipped');
      else if (partial) statusText = t('status_partial');
      const val = entry && entry.value !== undefined ? entry.value : 0;
      const note = entry && entry.note ? entry.note.replace(/"/g, '""') : '';
      csvContent += `${dateStr},${statusText},${val},"${note}"\n`;
    });
  }
  return csvContent;
}

export function exportHabitCSV(habitId) {
  const habit = state.habits.find((h) => h.id === habitId);
  if (!habit || typeof document === 'undefined') return;
  const reps = state.habitRepetitions[habitId] || {};
  const csvContent = generateHabitCSVData(habit, reps);

  try {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const safeName = habit.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.setAttribute('download', `riwayat_kebiasaan_${safeName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    vibrate(15);
  } catch (e) {
    console.error('CSV Export failed', e);
    dispatch('ui:show-modal', {
      title: t('modal_export_failed_title'),
      message: t('modal_export_failed_msg'),
      isAlert: true
    }).catch(() => {});
  }
}
