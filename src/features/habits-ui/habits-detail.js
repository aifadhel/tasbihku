import { dispatch } from '../../app/command-bus.js';
import { registerModalClose, registerModalOpen, swapModal, useCapability } from '../../app/slots.js';
import { t } from '../../shared/i18n.js';
import { state } from '../../shared/store.js';
import { getCalendarHabitId, renderCalendarPicker, setCalendarContext } from './habits-calendar.js';

export { getCalendarHabitId };

function renderDetailNotes(habit, reps) {
  const gridContainer = document.querySelector('.habit-detail-grid');
  if (!gridContainer || gridContainer.children.length === 0) return;
  const leftCol = gridContainer.children[0];
  let notesList = leftCol.querySelector('.habit-notes-list');
  if (!notesList) {
    notesList = document.createElement('div');
    notesList.className = 'habit-notes-list';
    leftCol.appendChild(notesList);
  }
  notesList.innerHTML = `<label class="label-large" style="display: block; margin-bottom: 8px;">${t('habit_log_note')}</label>`;

  const sortedDates = Object.keys(reps)
    .filter((dStr) => reps[dStr].note && reps[dStr].note.trim() !== '')
    .sort((a, b) => new Date(b) - new Date(a));

  if (sortedDates.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'text-sub';
    empty.style.cssText = 'font-size:0.85rem;opacity:0.6;padding:8px 4px;';
    empty.textContent = t('habit_log_empty');
    notesList.appendChild(empty);
    return;
  }

  const locale = state.language === 'en' ? 'en-US' : 'id-ID';
  sortedDates.forEach((dStr) => {
    const entry = reps[dStr];
    const item = document.createElement('div');
    item.className = 'habit-note-item';
    item.style.setProperty('--habit-color', habit.color || 'var(--md-sys-color-primary)');
    const [yr, mo, dy] = dStr.split('-').map(Number);
    const dateFmt = new Date(yr, mo - 1, dy).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
    const valTxt = habit.isNumerical ? ` (${entry.value || 0} / ${habit.targetValue || 100} ${habit.targetUnit || 'kali'})` : '';
    item.innerHTML = '<div class="habit-note-date"></div><div class="habit-note-content"></div>';
    item.querySelector('.habit-note-date').textContent = `${dateFmt}${valTxt}`;
    item.querySelector('.habit-note-content').textContent = entry.note;
    notesList.appendChild(item);
  });
}

export function refreshHabitDetailModal(habitId) {
  const core = useCapability('habitsCore');
  const habit = state.habits.find((h) => h.id === habitId);
  if (!habit || !core) return;

  const streaks = core.getHabitStreaks(habitId);
  const suffix = habit.scheduleType === 'weekly' ? t('suffix_weeks') : t('suffix_days');
  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setText('habit-detail-streak', `${streaks.current}${suffix}`);
  setText('habit-detail-best-streak', `${streaks.best}${suffix}`);

  const reps = state.habitRepetitions[habitId] || {};
  const completedCount = Object.keys(reps).filter((d) => core.isHabitCompletedOn(habitId, d)).length + (habit.historicalCount || 0);
  setText('habit-detail-completions', completedCount);
  setText('habit-detail-rate', `${core.calculateHabitStrength(habit)}%`);

  renderCalendarPicker(habitId);
  renderDetailNotes(habit, reps);

  Promise.all([
    import('./habits-charts-heatmap.js'),
    import('./habits-charts-trends.js')
  ]).then(([hm, tr]) => {
    const heatmapEl = document.getElementById('habit-detail-heatmap');
    const freqEl = document.getElementById('habit-detail-frequency-chart');
    const dowEl = document.getElementById('habit-detail-dow-chart');
    const scoreCanvas = document.getElementById('habit-detail-score-trend');
    if (heatmapEl) hm.renderHeatmapChart(habit, heatmapEl);
    if (dowEl) hm.renderDayOfWeekChart(habit, dowEl);
    if (freqEl) tr.renderFrequencyChart(habit, freqEl);
    if (scoreCanvas) tr.renderScoreTrend(habit, scoreCanvas);
  }).catch(() => {});
}

export function openHabitDetailModal(habitId) {
  if (typeof document === 'undefined') return;
  const habit = state.habits.find((h) => h.id === habitId);
  if (!habit) return;
  registerModalOpen('habit-detail-modal', closeHabitDetailModal);
  setCalendarContext(habitId);

  const modal = document.getElementById('habit-detail-modal');
  if (!modal) return;
  const titleEl = document.getElementById('habit-detail-title');
  const descEl = document.getElementById('habit-detail-desc');
  if (titleEl) titleEl.textContent = habit.name;
  if (descEl) descEl.textContent = habit.description || 'Tidak ada deskripsi';

  refreshHabitDetailModal(habitId);

  const editBtn = document.getElementById('habit-detail-edit-btn');
  if (editBtn) {
    editBtn.onclick = () => {
      closeHabitDetailModal(false, { swap: true });
      dispatch('habits:open-modal', { mode: 'edit', habitId }).catch(() => {});
    };
  }
  const csvBtn = document.getElementById('habit-detail-csv-btn');
  if (csvBtn) {
    csvBtn.onclick = () => dispatch('habits:export-csv', { habitId }).catch(() => {});
  }
  modal.classList.add('active');
}

export function closeHabitDetailModal(fromPopstate = false, { swap = false } = {}) {
  if (typeof document !== 'undefined') {
    const modal = document.getElementById('habit-detail-modal');
    if (modal) modal.classList.remove('active');
  }
  if (swap) swapModal('habit-detail-modal');
  else registerModalClose('habit-detail-modal', fromPopstate);
}
