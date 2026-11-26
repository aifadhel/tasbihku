import { useCapability } from '../../app/slots.js';
import { t } from '../../shared/i18n.js';
import { state } from '../../shared/store.js';

let activeHabitFilter = null;

export function getActiveHabitFilter() {
  return activeHabitFilter;
}

export function triggerCelebrationHeartbeat() {
  if (typeof document === 'undefined') return;
  const card = document.querySelector('#habit-dashboard-view .card');
  if (!card) return;
  card.classList.add('celebrate-heartbeat');
  setTimeout(() => card.classList.remove('celebrate-heartbeat'), 800);
}

export function updateStreakBadge() {
  if (typeof document === 'undefined') return;
  const core = useCapability('habitsCore');
  const streakBadge = document.getElementById('streak-badge');
  const streakCount = document.getElementById('streak-count');
  if (!streakBadge || !streakCount || !core) return;
  const streak = core.calculateStreak();
  if (streak > 0) {
    streakCount.innerText = streak;
    streakBadge.style.display = 'flex';
  } else {
    streakBadge.style.display = 'none';
  }
}

export function renderStats() {
  if (typeof document === 'undefined') return;
  const core = useCapability('habitsCore');
  const heatmap = document.getElementById('activity-heatmap');
  if (!heatmap || !core) return;

  heatmap.innerHTML = '';
  const today = new Date();
  const uniqueDates = [...new Set(state.activityLog)];
  let activeDaysCount = 0;

  for (let i = 90; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = core.getLocalDateString(d);
    const tile = document.createElement('div');
    tile.className = 'heatmap-tile';
    if (uniqueDates.includes(dateStr)) {
      tile.classList.add('active');
      activeDaysCount++;
    }
    tile.title = `${dateStr}${uniqueDates.includes(dateStr) ? ': Aktif' : ''}`;
    heatmap.appendChild(tile);
  }

  const activeDaysEl = document.getElementById('total-days-active');
  const totalSessionsEl = document.getElementById('stat-total-sessions');
  const currentStreakEl = document.getElementById('stat-current-streak');
  if (activeDaysEl) activeDaysEl.innerText = t('stats_active_days', { count: activeDaysCount });
  if (totalSessionsEl) totalSessionsEl.innerText = uniqueDates.length;
  if (currentStreakEl) currentStreakEl.innerText = core.calculateStreak();
}

export function renderProgressAndFilters(activeHabits, todayStr, onFilterChange) {
  const core = useCapability('habitsCore');
  if (!core) return;
  const totalHabits = activeHabits.length;
  let completedToday = 0;
  activeHabits.forEach((h) => {
    if (core.isHabitCompletedOn(h.id, todayStr)) completedToday++;
  });

  const ratioEl = document.getElementById('habit-today-progress-ratio');
  const barEl = document.getElementById('habit-today-progress-bar');
  if (ratioEl && barEl) {
    ratioEl.textContent = `${completedToday} / ${totalHabits}`;
    barEl.style.width = `${totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0}%`;
  }

  const filterContainer = document.getElementById('habit-filter-container');
  if (!filterContainer) return;
  const uniqueTags = new Set();
  activeHabits.forEach((h) => {
    if (Array.isArray(h.tags)) h.tags.forEach((tag) => uniqueTags.add(tag));
  });
  const tags = Array.from(uniqueTags).sort();
  filterContainer.innerHTML = '';
  if (tags.length === 0) return;

  const mkChip = (label, filterVal) => {
    const chip = document.createElement('div');
    chip.className = `habit-filter-chip ${activeHabitFilter === filterVal ? 'active' : ''}`;
    chip.textContent = label;
    chip.onclick = () => { activeHabitFilter = filterVal; onFilterChange(); };
    return chip;
  };
  filterContainer.appendChild(mkChip(t('filter_all'), null));
  tags.forEach((tag) => filterContainer.appendChild(mkChip(tag, tag)));
}
