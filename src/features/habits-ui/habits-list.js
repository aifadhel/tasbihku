import { useCapability } from '../../app/slots.js';
import { t } from '../../shared/i18n.js';
import { getRoutineCollapsed } from '../../shared/storage.js';
import { state } from '../../shared/store.js';
import { SVG_ICONS } from '../../shared/svg-icons.js';
import { openHabitDetailModal } from './habits-detail.js';
import { initDragAndDrop } from './habits-drag.js';
import { createHabitCard, renderArchivedSection } from './habits-list-cards.js';
import { toggleRoutineSection } from './habits-list-actions.js';
import { openHabitLogModal } from './habits-log-modal.js';
import { getActiveHabitFilter, renderProgressAndFilters } from './habits-progress.js';

export function renderHabits() {
  if (typeof document === 'undefined') return;
  const core = useCapability('habitsCore');
  const container = document.getElementById('habit-list-container');
  if (!container || !core) return;

  container.innerHTML = '';
  initDragAndDrop(container, renderHabits);

  let activeHabits = state.habits.filter((h) => !h.archived);
  const todayStr = core.getLocalDateString();
  renderProgressAndFilters(activeHabits, todayStr, renderHabits);

  const filterTag = getActiveHabitFilter();
  if (filterTag) {
    activeHabits = activeHabits.filter((h) => h.tags && h.tags.includes(filterTag));
  }

  if (activeHabits.length === 0) {
    const emptyCard = document.createElement('div');
    emptyCard.className = 'habit-empty-card';
    emptyCard.innerHTML = `<div class="habit-empty-icon">${SVG_ICONS.calendar}</div><div class="label-large" style="margin-bottom: 8px;">${t('habit_empty_title')}</div><div class="text-sub" style="font-size: 0.85rem;">${t('habit_empty_desc')}</div>`;
    container.appendChild(emptyCard);
  }

  const recentDates = core.getRecentDates();
  const sections = {
    pagi: { title: t('routine_pagi'), habits: [], contentWrapper: null },
    siang: { title: t('routine_siang'), habits: [], contentWrapper: null },
    sore: { title: t('routine_sore'), habits: [], contentWrapper: null },
    malam: { title: t('routine_malam'), habits: [], contentWrapper: null },
    anytime: { title: t('routine_anytime'), habits: [], contentWrapper: null }
  };

  activeHabits.forEach((h) => {
    const sec = h.routineSection || 'anytime';
    (sections[sec] || sections.anytime).habits.push(h);
  });

  Object.keys(sections).forEach((key) => {
    const data = sections[key];
    if (data.habits.length === 0) return;
    const isCollapsed = getRoutineCollapsed(key);
    const done = data.habits.filter((h) => core.isHabitCompletedOn(h.id, todayStr)).length;

    const secWrap = document.createElement('div');
    secWrap.className = 'routine-section';
    const header = document.createElement('div');
    header.className = 'routine-section-header';
    header.onclick = () => toggleRoutineSection(key, renderHabits);
    header.innerHTML = `<div style="display:flex;align-items:center;gap:8px;"><span class="routine-section-title" style="font-weight:800;font-size:1.1rem;color:var(--md-sys-color-primary);">${data.title}</span><span class="routine-section-count" style="font-size:0.8rem;background:rgba(255,255,255,0.05);padding:2px 8px;border-radius:12px;opacity:0.8;">${done}/${data.habits.length}</span></div><svg class="routine-section-chevron ${isCollapsed ? '' : 'expanded'}" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="transition:transform 0.2s ease;transform:${isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)'};"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>`;

    const content = document.createElement('div');
    content.className = `routine-section-content ${isCollapsed ? 'collapsed' : ''}`;
    content.dataset.section = key;
    content.style.cssText = `display:${isCollapsed ? 'none' : 'flex'};flex-direction:column;gap:12px;padding:8px 0;`;

    secWrap.appendChild(header);
    secWrap.appendChild(content);
    container.appendChild(secWrap);
    data.contentWrapper = content;
  });

  activeHabits.forEach((habit) => {
    const card = createHabitCard(habit, recentDates, todayStr, container, {
      onOpenDetail: openHabitDetailModal,
      onOpenLog: openHabitLogModal,
      onRefresh: renderHabits
    });
    const target = sections[habit.routineSection || 'anytime']?.contentWrapper || sections.anytime.contentWrapper;
    (target || container).appendChild(card);
  });

  renderArchivedSection(container, renderHabits);
}
