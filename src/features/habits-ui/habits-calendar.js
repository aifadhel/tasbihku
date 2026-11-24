import { dispatch } from '../../app/command-bus.js';
import { useCapability } from '../../app/slots.js';
import { t } from '../../shared/i18n.js';
import { state } from '../../shared/store.js';

let calendarYearState = new Date().getFullYear();
let calendarMonthState = new Date().getMonth();
let calendarHabitId = null;

export function getCalendarHabitId() {
  return calendarHabitId;
}

export function setCalendarContext(habitId) {
  calendarHabitId = habitId;
  calendarYearState = new Date().getFullYear();
  calendarMonthState = new Date().getMonth();
}

function createCalendarCell({ dayNum, dStr, isOtherMonth, isToday, habit, reps, todayStr, locale }) {
  const core = useCapability('habitsCore');
  const cell = document.createElement('div');
  const isFuture = dStr > todayStr;
  if (isFuture) {
    cell.className = `calendar-picker-cell${isOtherMonth ? ' other-month' : ''} future-day`;
    cell.setAttribute('aria-hidden', 'true');
    return cell;
  }

  const entry = reps[dStr];
  const { completed, partial, skipped } = core.getHabitCompletionStatus(habit, entry);
  const scheduled = core.isHabitScheduledOnDate(habit, dStr);
  let cls = `calendar-picker-cell${isOtherMonth ? ' other-month' : ''}`;
  if (completed) cls += ' completed';
  else if (partial) cls += ' partial';
  else if (skipped) cls += ' skipped';
  else if (!scheduled) cls += ' not-scheduled';
  if (isToday) cls += ' today';

  cell.className = cls;
  cell.style.setProperty('--habit-color', habit ? habit.color : 'var(--md-sys-color-primary)');
  cell.innerText = skipped ? '—' : dayNum;
  cell.setAttribute('role', 'button');
  cell.setAttribute('tabindex', '0');

  const [yr, mo] = dStr.split('-').map(Number);
  const monthName = new Date(yr, mo - 1).toLocaleDateString(locale, { month: 'long' });
  const statusLbl = completed ? t('status_completed') : (partial ? t('status_partial') : t('status_not_completed'));
  cell.setAttribute('aria-label', `${dayNum} ${monthName} ${yr}, ${statusLbl}${isToday ? ` (${t('status_today')})` : ''}${!scheduled ? ` (${t('status_not_scheduled')})` : ''}`);

  const openLog = () => dispatch('habits:open-log', { habitId: habit.id, dateStr: dStr }).catch(() => {});
  cell.onclick = openLog;
  cell.onkeydown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); openLog(); }
  };
  return cell;
}

export function renderCalendarPicker(habitId) {
  if (typeof document === 'undefined') return;
  const core = useCapability('habitsCore');
  const grid = document.getElementById('calendar-picker-grid');
  const headerText = document.getElementById('calendar-picker-month-year');
  if (!grid || !headerText || !core) return;

  grid.innerHTML = '';
  const locale = state.language === 'en' ? 'en-US' : 'id-ID';
  headerText.textContent = new Date(calendarYearState, calendarMonthState, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });

  const firstDayIndex = new Date(calendarYearState, calendarMonthState, 1).getDay();
  const numDays = new Date(calendarYearState, calendarMonthState + 1, 0).getDate();
  const prevNumDays = new Date(calendarYearState, calendarMonthState, 0).getDate();
  const todayStr = core.getLocalDateString(new Date());
  const reps = state.habitRepetitions[habitId] || {};
  const habit = state.habits.find((h) => h.id === habitId);

  const fmt = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  let prevM = calendarMonthState - 1;
  let prevY = calendarYearState;
  if (prevM < 0) { prevM = 11; prevY--; }
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dNum = prevNumDays - i;
    grid.appendChild(createCalendarCell({ dayNum: dNum, dStr: fmt(prevY, prevM, dNum), isOtherMonth: true, isToday: false, habit, reps, todayStr, locale }));
  }
  for (let i = 1; i <= numDays; i++) {
    const dStr = fmt(calendarYearState, calendarMonthState, i);
    grid.appendChild(createCalendarCell({ dayNum: i, dStr, isOtherMonth: false, isToday: dStr === todayStr, habit, reps, todayStr, locale }));
  }
  const padCells = 42 - grid.children.length;
  let nextM = calendarMonthState + 1;
  let nextY = calendarYearState;
  if (nextM > 11) { nextM = 0; nextY++; }
  for (let i = 1; i <= padCells; i++) {
    grid.appendChild(createCalendarCell({ dayNum: i, dStr: fmt(nextY, nextM, i), isOtherMonth: true, isToday: false, habit, reps, todayStr, locale }));
  }
}

export function navigateCalendarMonth(dir) {
  calendarMonthState += dir;
  if (calendarMonthState < 0) { calendarMonthState = 11; calendarYearState--; }
  else if (calendarMonthState > 11) { calendarMonthState = 0; calendarYearState++; }
  if (calendarHabitId) renderCalendarPicker(calendarHabitId);
}
