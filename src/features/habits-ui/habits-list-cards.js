import { useCapability } from '../../app/slots.js';
import { t } from '../../shared/i18n.js';
import { vibrate } from '../../shared/media.js';
import { state } from '../../shared/store.js';
import { SVG_ICONS } from '../../shared/svg-icons.js';
import { attachTouchDrag } from './habits-drag.js';
import {
  isArchivedSectionExpanded,
  launchLinkedDzikir,
  permanentDeleteHabit,
  restoreHabit,
  toggleArchivedSection,
  toggleHabitDay
} from './habits-list-actions.js';

export function createHabitCard(habit, recentDates, todayStr, container, callbacks) {
  const core = useCapability('habitsCore');
  const card = document.createElement('div');
  card.className = 'habit-card';
  card.dataset.id = habit.id;
  card.draggable = true;
  card.addEventListener('dragstart', (e) => {
    card.classList.add('dragging');
    if (e.dataTransfer) { e.dataTransfer.setData('text/plain', habit.id); e.dataTransfer.effectAllowed = 'move'; }
  });
  card.addEventListener('dragend', () => card.classList.remove('dragging'));

  const infoRow = document.createElement('div');
  infoRow.className = 'habit-info';
  const dragHandle = document.createElement('div');
  dragHandle.innerHTML = SVG_ICONS.dragGrip;
  dragHandle.style.cssText = 'cursor:grab;display:flex;align-items:center;padding:8px 4px;margin-right:4px;';
  attachTouchDrag(dragHandle, card, container);

  const infoContent = document.createElement('div');
  infoContent.style.cssText = 'display:flex;align-items:center;gap:12px;flex-grow:1;overflow:hidden;';
  infoContent.onclick = () => callbacks.onOpenDetail(habit.id);

  const colorDot = document.createElement('div');
  colorDot.className = 'habit-color-indicator';
  colorDot.style.backgroundColor = habit.color || 'var(--md-sys-color-primary)';

  const details = document.createElement('div');
  details.className = 'habit-details';
  const title = document.createElement('span');
  title.className = 'habit-title';
  title.textContent = habit.name;
  const desc = document.createElement('span');
  desc.className = 'habit-desc';
  desc.textContent = habit.description || t('no_description');

  const streak = document.createElement('span');
  streak.className = 'habit-streak';
  let targetText = '';
  let suffix = t('suffix_days');
  if (habit.scheduleType === 'weekly') { targetText = ` &nbsp;&bull;&nbsp; 🎯 ${habit.weeklyTarget}${t('target_weekly')}`; suffix = t('suffix_weeks'); }
  else if (habit.scheduleType === 'interval') { targetText = ` &nbsp;&bull;&nbsp; 🎯 ${t('target_interval', { days: habit.intervalDays || 2 })}`; }
  streak.innerHTML = `🔥 ${habit.currentStreak ?? 0}${suffix} &nbsp;&bull;&nbsp; ⚡ ${habit.strengthScore ?? 0}%${targetText}`;
  details.appendChild(title); details.appendChild(desc); details.appendChild(streak);

  if (habit.isNumerical) {
    const mini = document.createElement('span');
    mini.className = 'habit-progress-mini';
    mini.style.color = habit.color || 'var(--md-sys-color-primary)';
    const val = ((state.habitRepetitions[habit.id] || {})[todayStr] || {}).value || 0;
    mini.innerHTML = `🎯 ${val} / ${habit.targetValue || 100} ${habit.targetUnit || 'kali'}`;
    details.appendChild(mini);
  }
  if (habit.linkedDzikirId) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-tonal habit-launch-dzikir-btn';
    btn.innerHTML = `📿 ${t('btn_launch_dzikir') || 'Mulai Dzikir'}`;
    btn.onclick = (e) => { e.stopPropagation(); launchLinkedDzikir(habit.linkedDzikirId); };
    details.appendChild(btn);
  }
  infoContent.appendChild(colorDot); infoContent.appendChild(details);
  infoRow.appendChild(dragHandle); infoRow.appendChild(infoContent);

  const daysStrip = document.createElement('div');
  daysStrip.className = 'habit-days-strip';
  recentDates.forEach((day) => {
    const entry = (state.habitRepetitions[habit.id] || {})[day.dateStr];
    const { completed, partial, skipped } = core.getHabitCompletionStatus(habit, entry);
    const scheduled = core.isHabitScheduledOnDate(habit, day.dateStr);
    const bubble = document.createElement('div');
    let cls = 'habit-day-bubble';
    if (completed) cls += ' completed';
    else if (partial) cls += ' partial';
    else if (skipped || !scheduled) cls += ' skipped';
    if (day.isToday) cls += ' today';
    bubble.className = cls;
    bubble.style.setProperty('--habit-color', habit.color || 'var(--md-sys-color-primary)');

    bubble.onclick = (e) => {
      e.stopPropagation();
      if (!(scheduled || completed || partial)) return callbacks.onOpenLog(habit.id, day.dateStr);
      if (bubble.clickTimeout) {
        clearTimeout(bubble.clickTimeout);
        bubble.clickTimeout = null;
        callbacks.onOpenLog(habit.id, day.dateStr);
      } else {
        bubble.clickTimeout = setTimeout(() => {
          toggleHabitDay(habit.id, day.dateStr, callbacks.onRefresh);
          bubble.clickTimeout = null;
        }, 250);
      }
    };

    const lbl = document.createElement('span'); lbl.className = 'day-label'; lbl.textContent = day.label;
    const circle = document.createElement('div'); circle.className = 'day-circle';
    const chk = document.createElement('span'); chk.className = 'checkmark-icon';
    chk.textContent = (completed || partial) ? '✓' : ((skipped || !scheduled) ? '-' : '✓');
    circle.appendChild(chk); bubble.appendChild(lbl); bubble.appendChild(circle);
    daysStrip.appendChild(bubble);
  });

  card.appendChild(infoRow);
  card.appendChild(daysStrip);
  return card;
}

export function renderArchivedSection(habitListContainer, onRefresh) {
  const archived = state.habits.filter((h) => h.archived);
  const prev = habitListContainer.parentElement?.querySelector('.archived-section-wrapper');
  if (prev) prev.remove();
  if (archived.length === 0 || !habitListContainer.parentElement) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'archived-section-wrapper';
  const header = document.createElement('div');
  header.className = 'archived-section-header';
  header.onclick = () => toggleArchivedSection();
  header.innerHTML = `<span class="archived-section-title">${t('archived_title', { count: archived.length })}</span><svg id="archived-section-chevron" class="archived-section-chevron${isArchivedSectionExpanded() ? ' expanded' : ''}" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>`;

  const content = document.createElement('div');
  content.id = 'archived-section-content';
  content.className = `archived-section-content${isArchivedSectionExpanded() ? ' expanded' : ''}`;
  archived.forEach((h) => {
    const card = document.createElement('div');
    card.className = 'habit-card archived';
    card.innerHTML = `<div class="habit-info"><div class="habit-color-indicator" style="background-color:${h.color || 'var(--md-sys-color-primary)'}"></div><div class="habit-details"><span class="habit-title"></span><span class="habit-desc"></span></div></div><div class="archived-actions"></div>`;
    card.querySelector('.habit-title').textContent = h.name;
    card.querySelector('.habit-desc').textContent = h.description || t('archived_desc');
    const actions = card.querySelector('.archived-actions');
    const rBtn = document.createElement('button'); rBtn.className = 'btn btn-restore'; rBtn.textContent = t('btn_restore_habit');
    rBtn.onclick = (e) => { e.stopPropagation(); restoreHabit(h.id, onRefresh); };
    const dBtn = document.createElement('button'); dBtn.className = 'btn btn-permanent-delete'; dBtn.textContent = t('btn_delete_habit');
    dBtn.onclick = (e) => { e.stopPropagation(); permanentDeleteHabit(h.id, onRefresh); };
    actions.appendChild(rBtn); actions.appendChild(dBtn);
    content.appendChild(card);
  });
  wrapper.appendChild(header);
  wrapper.appendChild(content);
  habitListContainer.parentElement.appendChild(wrapper);
}

export function showStackingCelebrationToast(habitName) {
  if (typeof document === 'undefined') return;
  const container = document.getElementById('stacking-toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'stacking-toast';
  toast.innerHTML = `<div class="stacking-toast-icon">📿</div><div class="stacking-toast-content"><h4 class="stacking-toast-title">Alhamdulillah! Stacking Dzikir</h4><p class="stacking-toast-body">${t('notif_habit_auto_done', { name: habitName })}</p></div>`;
  container.appendChild(toast);
  vibrate([100, 50, 100]);
  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => toast.remove());
  }, 4000);
}
