import { useCapability } from '../../app/slots.js';
import { state } from '../../shared/store.js';

export function renderFrequencyChart(habit, containerEl) {
  const core = useCapability('habitsCore');
  if (!containerEl || !core) return;
  containerEl.innerHTML = '';
  const repetitions = state.habitRepetitions[habit.id] || {};
  const keys = Object.keys(repetitions);
  const weeks = [];
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  for (let i = 9; i >= 0; i--) {
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() - i * 7);
    weekEnd.setDate(weekEnd.getDate() + (6 - weekEnd.getDay()));
    weekEnd.setHours(12, 0, 0, 0);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6);
    weekStart.setHours(12, 0, 0, 0);

    let count = 0;
    keys.forEach((dateStr) => {
      const [yr, mo, dy] = dateStr.split('-').map(Number);
      const repDate = new Date(yr, mo - 1, dy);
      repDate.setHours(12, 0, 0, 0);
      if (repDate >= weekStart && repDate <= weekEnd && core.getHabitCompletionStatus(habit, repetitions[dateStr]).completed) count++;
    });
    weeks.push({ label: `${String(weekStart.getDate()).padStart(2, '0')}/${String(weekStart.getMonth() + 1).padStart(2, '0')}`, count });
  }

  const maxCount = Math.max(...weeks.map((w) => w.count), 1);
  const habitColor = habit.color || '#8cd6b5';
  const svgWidth = 300;
  const svgHeight = 120;
  const barPadding = 3;
  const barWidth = ((svgWidth - 10) / weeks.length) - barPadding;
  const chartHeight = svgHeight - 36;
  let barsHTML = '';

  weeks.forEach((w, i) => {
    const x = 5 + i * (barWidth + barPadding);
    const barH = (w.count / maxCount) * chartHeight;
    const y = 16 + chartHeight - barH;
    barsHTML += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="3" ry="3" fill="${habitColor}" opacity="${w.count > 0 ? 0.85 : 0.15}"/>`;
    if (w.count > 0) barsHTML += `<text x="${x + barWidth / 2}" y="${y - 4}" text-anchor="middle" class="chart-bar-value" style="font-size:9px;fill:var(--md-sys-color-on-background);font-family:var(--font-family-base);font-weight:700;">${w.count}</text>`;
    if (i % 2 === 0 || i === weeks.length - 1) barsHTML += `<text x="${x + barWidth / 2}" y="${svgHeight - 4}" text-anchor="middle" class="chart-bar-label" style="font-size:9px;fill:var(--md-sys-color-outline);font-family:var(--font-family-base);font-weight:600;">${w.label}</text>`;
  });

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.innerHTML = barsHTML;
  containerEl.appendChild(svg);
}

export function renderScoreTrend(habit, canvasEl) {
  const core = useCapability('habitsCore');
  if (!canvasEl || !core) return;
  const container = canvasEl.parentElement;
  const habitAge = habit.createdAt ? Math.floor((Date.now() - habit.createdAt) / 86400000) : 0;
  const repetitions = state.habitRepetitions[habit.id] || {};
  const keys = Object.keys(repetitions);

  const prevEmpty = container.querySelector('.habit-chart-empty');
  if (prevEmpty) prevEmpty.remove();
  if (habitAge < 7 || keys.length === 0) {
    canvasEl.style.display = 'none';
    const empty = document.createElement('div');
    empty.className = 'habit-chart-empty';
    empty.textContent = 'Belum cukup data. Lanjutkan selama 1 minggu untuk melihat grafik.';
    container.appendChild(empty);
    return;
  }

  canvasEl.style.display = 'block';
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = container.clientWidth || 300;
  const cssHeight = 120;
  canvasEl.width = cssWidth * dpr;
  canvasEl.height = cssHeight * dpr;
  canvasEl.style.width = `${cssWidth}px`;
  canvasEl.style.height = `${cssHeight}px`;

  const ctx = canvasEl.getContext('2d');
  ctx.scale(dpr, dpr);
  const multiplier = Math.pow(0.5, core.getHabitFrequency(habit) / 13.0);

  const today = new Date(); today.setHours(12, 0, 0, 0);
  let start = new Date(); start.setDate(start.getDate() - 90); start.setHours(12, 0, 0, 0);
  if (habit.createdAt) {
    const created = new Date(habit.createdAt); created.setHours(12, 0, 0, 0);
    if (created > start) start = created;
  }

  const scores = [];
  let score = 0.0;
  const tempDate = new Date(start);
  while (tempDate <= today) {
    const dateStr = core.getLocalDateString(tempDate);
    if (core.isHabitScheduledOnDate(habit, dateStr)) {
      const entry = repetitions[dateStr];
      const completed = entry ? (habit.isNumerical ? Math.min(1.0, (entry.value || 0) / (habit.targetValue || 1)) : 1.0) : 0;
      score = score * multiplier + completed * (1 - multiplier);
    }
    scores.push(Math.round(score * 100));
    tempDate.setDate(tempDate.getDate() + 1);
    tempDate.setHours(12, 0, 0, 0);
  }
  if (scores.length === 0) return;

  const pad = { top: 10, right: 35, bottom: 20, left: 5 };
  const chartW = cssWidth - pad.left - pad.right;
  const chartH = cssHeight - pad.top - pad.bottom;
  const color = habit.color || '#8cd6b5';
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  const thresholdY = pad.top + chartH * 0.2;
  ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(220, 196, 140, 0.4)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad.left, thresholdY); ctx.lineTo(cssWidth - pad.right, thresholdY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = '600 9px sans-serif'; ctx.fillStyle = 'rgba(220, 196, 140, 0.6)'; ctx.textAlign = 'left';
  ctx.fillText('80%', cssWidth - pad.right + 4, thresholdY + 3);

  const points = scores.map((s, i) => ({ x: pad.left + (i / Math.max(scores.length - 1, 1)) * chartW, y: pad.top + chartH * (1 - s / 100) }));
  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
  grad.addColorStop(0, `${color}40`); grad.addColorStop(1, `${color}05`);

  ctx.beginPath(); ctx.moveTo(points[0].x, pad.top + chartH);
  points.forEach((p) => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, pad.top + chartH); ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();

  ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();

  const last = points[points.length - 1];
  ctx.beginPath(); ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = '#0e1b15'; ctx.lineWidth = 2; ctx.stroke();
  ctx.font = '700 11px sans-serif'; ctx.fillStyle = color; ctx.textAlign = 'left';
  ctx.fillText(`${scores[scores.length - 1]}%`, last.x + 8, last.y + 4);
}
