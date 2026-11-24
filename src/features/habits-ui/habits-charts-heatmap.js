import { useCapability } from '../../app/slots.js';
import { t } from '../../shared/i18n.js';
import { state } from '../../shared/store.js';

export function renderHeatmapChart(habit, containerEl) {
  const core = useCapability('habitsCore');
  if (!containerEl || !core) return;
  containerEl.innerHTML = '';
  const repetitions = state.habitRepetitions[habit.id] || {};
  const habitColor = habit.color || 'var(--md-sys-color-primary)';
  const daysToShow = 91;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - daysToShow + 1);

  const tileSize = 12;
  const gap = 3;
  const cols = Math.ceil(daysToShow / 7);
  let rectsHTML = '';

  for (let i = 0; i < daysToShow; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    d.setHours(12, 0, 0, 0);
    const dateStr = core.getLocalDateString(d);
    const { completed, partial, skipped } = core.getHabitCompletionStatus(habit, repetitions[dateStr]);
    const scheduled = core.isHabitScheduledOnDate(habit, dateStr);
    const x = Math.floor(i / 7) * (tileSize + gap);
    const y = d.getDay() * (tileSize + gap);

    let fill = 'rgba(255,255,255,0.05)';
    let stroke = 'none';
    let opacity = 1;
    if (completed) fill = habitColor;
    else if (partial) { fill = habitColor; opacity = 0.5; }
    else if (skipped) { stroke = habitColor; fill = 'transparent'; opacity = 0.5; }
    else if (!scheduled) { fill = 'rgba(255,255,255,0.02)'; stroke = 'rgba(255,255,255,0.05)'; }

    const status = completed ? `: ${t('status_completed')}` : (partial ? `: ${t('status_partial')}` : (skipped ? `: ${t('status_skipped')}` : (!scheduled ? `: ${t('status_holiday')}` : '')));
    rectsHTML += `<rect x="${x}" y="${y}" width="${tileSize}" height="${tileSize}" rx="2" ry="2" fill="${fill}" stroke="${stroke}" stroke-width="1" opacity="${opacity}"><title>${dateStr}${status}</title></rect>`;
    if (skipped) rectsHTML += `<line x1="${x + 2}" y1="${y + tileSize / 2}" x2="${x + tileSize - 2}" y2="${y + tileSize / 2}" stroke="${habitColor}" stroke-width="1" opacity="0.8"/>`;
  }

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${cols * (tileSize + gap)} ${7 * (tileSize + gap)}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.style.cssText = 'width:100%;height:auto;max-height:140px;';
  svg.innerHTML = rectsHTML;
  containerEl.appendChild(svg);
}

export function renderDayOfWeekChart(habit, containerEl) {
  const core = useCapability('habitsCore');
  if (!containerEl || !core) return;
  containerEl.innerHTML = '';
  const repetitions = state.habitRepetitions[habit.id] || {};
  const daysCount = [0, 0, 0, 0, 0, 0, 0];
  const daysLabel = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  Object.keys(repetitions).forEach((dateStr) => {
    if (core.getHabitCompletionStatus(habit, repetitions[dateStr]).completed) {
      const [yr, mo, dy] = dateStr.split('-').map(Number);
      daysCount[new Date(yr, mo - 1, dy).getDay()]++;
    }
  });

  const maxCount = Math.max(...daysCount, 1);
  const habitColor = habit.color || '#8cd6b5';
  const svgWidth = 300;
  const svgHeight = 120;
  const barPadding = 8;
  const barWidth = ((svgWidth - 20) / 7) - barPadding;
  const chartHeight = svgHeight - 36;
  let barsHTML = '';

  daysCount.forEach((count, i) => {
    const x = 10 + i * (barWidth + barPadding);
    const barHeight = (count / maxCount) * chartHeight;
    const y = 16 + chartHeight - barHeight;
    barsHTML += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="4" ry="4" fill="${habitColor}" opacity="${count > 0 ? 0.85 : 0.15}"/>`;
    if (count > 0) barsHTML += `<text x="${x + barWidth / 2}" y="${y - 4}" text-anchor="middle" class="chart-bar-value" style="font-size:10px;fill:var(--md-sys-color-on-background);font-family:var(--font-family-base);font-weight:700;">${count}</text>`;
    barsHTML += `<text x="${x + barWidth / 2}" y="${svgHeight - 4}" text-anchor="middle" class="chart-bar-label" style="font-size:10px;fill:var(--md-sys-color-outline);font-family:var(--font-family-base);font-weight:600;">${daysLabel[i]}</text>`;
  });

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.innerHTML = barsHTML;
  containerEl.appendChild(svg);
}
