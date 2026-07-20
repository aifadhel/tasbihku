import { state } from '../core/store.js';
import { 
    getLocalDateString, 
    getHabitCompletionStatus, 
    isHabitScheduledOnDate, 
    getHabitFrequency 
} from './habits-data.js';

export function renderHeatmapChart(habit, containerEl) {
    if (!containerEl) return;
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
    const svgWidth = cols * (tileSize + gap);
    const svgHeight = 7 * (tileSize + gap);
    
    let rectsHTML = '';
    
    for (let i = 0; i < daysToShow; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        d.setHours(12, 0, 0, 0);
        
        const dateStr = getLocalDateString(d);
        const entry = repetitions[dateStr];
        const { completed: isCompleted, partial: isPartial, skipped: isSkipped } = getHabitCompletionStatus(habit, entry);
        const isScheduled = isHabitScheduledOnDate(habit, dateStr);
        
        const col = Math.floor(i / 7);
        const row = d.getDay(); 
        
        const x = col * (tileSize + gap);
        const y = row * (tileSize + gap);
        
        let fill = 'transparent';
        let stroke = 'rgba(255,255,255,0.05)';
        let opacity = 1;
        
        if (isCompleted) {
            fill = habitColor;
            stroke = 'none';
        } else if (isPartial) {
            fill = habitColor;
            stroke = 'none';
            opacity = 0.5;
        } else if (isSkipped) {
            stroke = habitColor;
            fill = 'transparent';
            opacity = 0.5;
        } else if (!isScheduled) {
            fill = 'rgba(255,255,255,0.02)';
            stroke = 'rgba(255,255,255,0.05)';
        } else {
            fill = 'rgba(255,255,255,0.05)';
            stroke = 'none';
        }
        
        rectsHTML += `<rect x="${x}" y="${y}" width="${tileSize}" height="${tileSize}" rx="2" ry="2" fill="${fill}" stroke="${stroke}" stroke-width="1" opacity="${opacity}">
            <title>${dateStr}${isCompleted ? ': Selesai' : (isPartial ? ': Sebagian' : (isSkipped ? ': Dilewati' : (!isScheduled ? ': Libur' : '')))}</title>
        </rect>`;
        
        if (isSkipped) {
            rectsHTML += `<line x1="${x+2}" y1="${y+tileSize/2}" x2="${x+tileSize-2}" y2="${y+tileSize/2}" stroke="${habitColor}" stroke-width="1" opacity="0.8"/>`;
        }
    }
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.width = '100%';
    svg.style.height = 'auto';
    svg.style.maxHeight = '140px';
    svg.innerHTML = rectsHTML;
    containerEl.appendChild(svg);
}

export function renderDayOfWeekChart(habit, containerEl) {
    if (!containerEl) return;
    containerEl.innerHTML = '';

    const repetitions = state.habitRepetitions[habit.id] || {};
    const keys = Object.keys(repetitions);

    const daysCount = [0, 0, 0, 0, 0, 0, 0]; 
    const daysLabel = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    keys.forEach(dateStr => {
        const entry = repetitions[dateStr];
        const { completed: isCompleted } = getHabitCompletionStatus(habit, entry);
        
        if (isCompleted) {
            const [yr, mo, dy] = dateStr.split('-').map(Number);
            const date = new Date(yr, mo - 1, dy);
            daysCount[date.getDay()]++;
        }
    });

    const maxCount = Math.max(...daysCount, 1);
    const habitColor = habit.color || '#8cd6b5';

    const svgWidth = 300;
    const svgHeight = 120;
    const barPadding = 8;
    const barAreaWidth = svgWidth - 20;
    const barWidth = (barAreaWidth / 7) - barPadding;
    const topPadding = 16;
    const bottomPadding = 20;
    const chartHeight = svgHeight - topPadding - bottomPadding;

    let barsHTML = '';
    daysCount.forEach((count, i) => {
        const x = 10 + i * (barWidth + barPadding);
        const barHeight = maxCount > 0 ? (count / maxCount) * chartHeight : 0;
        const y = topPadding + chartHeight - barHeight;

        barsHTML += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="4" ry="4" fill="${habitColor}" opacity="${count > 0 ? 0.85 : 0.15}"/>`;
        
        if (count > 0) {
            barsHTML += `<text x="${x + barWidth / 2}" y="${y - 4}" text-anchor="middle" class="chart-bar-value" style="font-size: 10px; fill: var(--md-sys-color-on-background); font-family: var(--font-family-base); font-weight: 700;">${count}</text>`;
        }

        barsHTML += `<text x="${x + barWidth / 2}" y="${svgHeight - 4}" text-anchor="middle" class="chart-bar-label" style="font-size: 10px; fill: var(--md-sys-color-outline); font-family: var(--font-family-base); font-weight: 600;">${daysLabel[i]}</text>`;
    });

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.innerHTML = barsHTML;
    containerEl.appendChild(svg);
}

export function renderFrequencyChart(habit, containerEl) {
    if (!containerEl) return;
    containerEl.innerHTML = '';

    const repetitions = state.habitRepetitions[habit.id] || {};
    const keys = Object.keys(repetitions);

    const weeks = [];
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    for (let i = 9; i >= 0; i--) {
        const weekEnd = new Date(today);
        weekEnd.setDate(today.getDate() - (i * 7));
        const dayOfWeek = weekEnd.getDay();
        weekEnd.setDate(weekEnd.getDate() + (6 - dayOfWeek)); 
        weekEnd.setHours(12, 0, 0, 0);
        
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekEnd.getDate() - 6);
        weekStart.setHours(12, 0, 0, 0);

        let count = 0;
        keys.forEach(dateStr => {
            const [yr, mo, dy] = dateStr.split('-').map(Number);
            const repDate = new Date(yr, mo - 1, dy);
            repDate.setHours(12, 0, 0, 0);
            if (repDate >= weekStart && repDate <= weekEnd) {
                const entry = repetitions[dateStr];
                const { completed: isCompleted } = getHabitCompletionStatus(habit, entry);
                if (isCompleted) {
                    count++;
                }
            }
        });

        const weekLabel = `${String(weekStart.getDate()).padStart(2, '0')}/${String(weekStart.getMonth() + 1).padStart(2, '0')}`;
        weeks.push({ label: weekLabel, count });
    }

    const maxCount = Math.max(...weeks.map(w => w.count), 1);
    const habitColor = habit.color || '#8cd6b5';

    const svgWidth = 300;
    const svgHeight = 120;
    const barPadding = 3;
    const barAreaWidth = svgWidth - 10;
    const barWidth = (barAreaWidth / weeks.length) - barPadding;
    const topPadding = 16;
    const bottomPadding = 20;
    const chartHeight = svgHeight - topPadding - bottomPadding;

    let barsHTML = '';
    weeks.forEach((week, i) => {
        const x = 5 + i * (barWidth + barPadding);
        const barHeight = maxCount > 0 ? (week.count / maxCount) * chartHeight : 0;
        const y = topPadding + chartHeight - barHeight;

        barsHTML += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="3" ry="3" fill="${habitColor}" opacity="${week.count > 0 ? 0.85 : 0.15}"/>`;
        
        if (week.count > 0) {
            barsHTML += `<text x="${x + barWidth / 2}" y="${y - 4}" text-anchor="middle" class="chart-bar-value" style="font-size: 9px; fill: var(--md-sys-color-on-background); font-family: var(--font-family-base); font-weight: 700;">${week.count}</text>`;
        }

        if (i % 2 === 0 || i === weeks.length - 1) {
            barsHTML += `<text x="${x + barWidth / 2}" y="${svgHeight - 4}" text-anchor="middle" class="chart-bar-label" style="font-size: 9px; fill: var(--md-sys-color-outline); font-family: var(--font-family-base); font-weight: 600;">${week.label}</text>`;
        }
    });

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.innerHTML = barsHTML;
    containerEl.appendChild(svg);
}

export function renderScoreTrend(habit, canvasEl) {
    if (!canvasEl) return;

    const container = canvasEl.parentElement;
    const habitAge = habit.createdAt ? Math.floor((Date.now() - habit.createdAt) / 86400000) : 0;
    const repetitions = state.habitRepetitions[habit.id] || {};
    const keys = Object.keys(repetitions);

    if (habitAge < 7 || keys.length === 0) {
        canvasEl.style.display = 'none';
        const prev = container.querySelector('.habit-chart-empty');
        if (prev) prev.remove();
        
        const empty = document.createElement('div');
        empty.className = 'habit-chart-empty';
        empty.textContent = 'Belum cukup data. Lanjutkan selama 1 minggu untuk melihat grafik.';
        container.appendChild(empty);
        return;
    }

    const prev = container.querySelector('.habit-chart-empty');
    if (prev) prev.remove();
    canvasEl.style.display = 'block';

    const dpr = window.devicePixelRatio || 1;
    const cssWidth = container.clientWidth || 300;
    const cssHeight = 120;
    canvasEl.width = cssWidth * dpr;
    canvasEl.height = cssHeight * dpr;
    canvasEl.style.width = cssWidth + 'px';
    canvasEl.style.height = cssHeight + 'px';

    const ctx = canvasEl.getContext('2d');
    ctx.scale(dpr, dpr);

    const frequency = getHabitFrequency(habit);
    const multiplier = Math.pow(0.5, frequency / 13.0);

    const today = new Date();
    today.setHours(12, 0, 0, 0);

    let start = new Date();
    start.setDate(start.getDate() - 90);
    start.setHours(12, 0, 0, 0);

    if (habit.createdAt) {
        const created = new Date(habit.createdAt);
        created.setHours(12, 0, 0, 0);
        if (created > start) start = created;
    }

    const scores = [];
    let score = 0.0;
    let tempDate = new Date(start);
    tempDate.setHours(12, 0, 0, 0);

    while (tempDate <= today) {
        const dateStr = getLocalDateString(tempDate);
        const isScheduled = isHabitScheduledOnDate(habit, dateStr);

        if (isScheduled) {
            const entry = repetitions[dateStr];
            let completed = 0;
            if (entry) {
                if (habit.isNumerical) {
                    completed = Math.min(1.0, (entry.value || 0) / (habit.targetValue || 1));
                } else {
                    completed = 1.0;
                }
            }
            score = score * multiplier + completed * (1 - multiplier);
        }
        scores.push(Math.round(score * 100));

        tempDate.setDate(tempDate.getDate() + 1);
        tempDate.setHours(12, 0, 0, 0);
    }

    if (scores.length === 0) return;

    const padding = { top: 10, right: 35, bottom: 20, left: 5 };
    const chartW = cssWidth - padding.left - padding.right;
    const chartH = cssHeight - padding.top - padding.bottom;
    const habitColor = habit.color || '#8cd6b5';

    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const thresholdY = padding.top + chartH * (1 - 0.8);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(220, 196, 140, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, thresholdY);
    ctx.lineTo(cssWidth - padding.right, thresholdY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = '600 9px sans-serif';
    ctx.fillStyle = 'rgba(220, 196, 140, 0.6)';
    ctx.textAlign = 'left';
    ctx.fillText('80%', cssWidth - padding.right + 4, thresholdY + 3);

    const points = scores.map((s, i) => ({
        x: padding.left + (i / Math.max(scores.length - 1, 1)) * chartW,
        y: padding.top + chartH * (1 - s / 100)
    }));

    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    gradient.addColorStop(0, habitColor + '40');
    gradient.addColorStop(1, habitColor + '05');

    ctx.beginPath();
    ctx.moveTo(points[0].x, padding.top + chartH);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = habitColor;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    const lastPoint = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(lastPoint.x, lastPoint.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = habitColor;
    ctx.fill();
    ctx.strokeStyle = '#0e1b15';
    ctx.lineWidth = 2;
    ctx.stroke();

    const currentScore = scores[scores.length - 1];
    ctx.font = '700 11px sans-serif';
    ctx.fillStyle = habitColor;
    ctx.textAlign = 'left';
    ctx.fillText(currentScore + '%', lastPoint.x + 8, lastPoint.y + 4);
}
