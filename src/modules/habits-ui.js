/* ========================================================================= */
/* --- TasbihKu Habits Module (src/modules/habits.js) --- */
/* ========================================================================= */

import { state, saveState, saveStateImmediate } from '../core/store.js';
import { vibrate, playTapSound } from '../hardware/media.js';
import { showModal, closeModal, SVG_ICONS } from '../ui/router.js';
import { fireConfetti } from '../ui/confetti.js';
import {
    getLocalDateString,
    getRecentDates,
    calculateStreak,
    isHabitScheduledOnDate,
    getHabitCompletionStatus,
    calculateHabitStrength,
    getHabitStreaks,
    isHabitCompletedOn,
    updateHabitMetricsCache,
    checkAndTriggerLinkedHabit
} from './habits-data.js';
import { renderHeatmapChart, renderDayOfWeekChart, renderFrequencyChart, renderScoreTrend } from './habits-chart.js';
import { exportHabitCSV } from './habits-export.js';
import azkarData from '../data/azkar.json';

// Private variables for habit session state
export let currentEditingHabitId = null;
export let calendarYearState = new Date().getFullYear();
export let calendarMonthState = new Date().getMonth();
export let calendarHabitId = null;
let archivedSectionExpanded = false;

// --- Activity Tracking & Global Streak Math ---
export function updateStreakBadge() {
    const streakBadge = document.getElementById('streak-badge');
    const streakCount = document.getElementById('streak-count');
    if (!streakBadge || !streakCount) return;

    const streak = calculateStreak();
    if (streak > 0) {
        streakCount.innerText = streak;
        streakBadge.style.display = 'flex';
    } else {
        streakBadge.style.display = 'none';
    }
}

// --- Dashboard Activity Heatmap ---
export function renderStats() {
    const heatmap = document.getElementById('activity-heatmap');
    if (!heatmap) return;

    heatmap.innerHTML = '';
    const today = new Date();
    const uniqueDates = [...new Set(state.activityLog)];
    
    // Generate last 91 days (13 weeks * 7 days)
    const daysToShow = 91;
    let activeDaysCount = 0;

    for (let i = daysToShow - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        
        const tile = document.createElement('div');
        tile.className = 'heatmap-tile';
        
        // Exclude skipped habits from "active" counting if that day was fully skipped for all habits
        // Actually, state.activityLog is just a list of days where any activity happened.
        // It's mostly from Tasbih counts now. We don't need to change `uniqueDates` since it's global,
        // but we can ensure "skipped" doesn't falsely add to it (handled when toggling).
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
    if (activeDaysEl) activeDaysEl.innerText = `${activeDaysCount} Hari Aktif`;
    if (totalSessionsEl) totalSessionsEl.innerText = uniqueDates.length;
    if (currentStreakEl) currentStreakEl.innerText = calculateStreak();
}

export function toggleHabitDay(habitId, dateStr) {
    if (!state.habitRepetitions[habitId]) {
        state.habitRepetitions[habitId] = {};
    }
    
    const reps = state.habitRepetitions[habitId];
    const habit = state.habits.find(h => h.id === habitId);
    if (!habit) return;
    
    vibrate(15);
    
    const entry = reps[dateStr];
    
    if (!entry) {
        const keys = Object.keys(reps);
        if (keys.length >= 365) {
            keys.sort((a, b) => new Date(a) - new Date(b));
            const oldest = keys[0];
            delete reps[oldest];
            habit.historicalCount = (habit.historicalCount || 0) + 1;
        }
        
        reps[dateStr] = { value: habit.isNumerical ? (habit.targetValue || 100) : 1, note: "" };
        playTapSound();
        
        if (dateStr === getLocalDateString()) {
            triggerCelebrationHeartbeat();
            fireConfetti(80);
        }
    } else if (!entry.skipped) {
        reps[dateStr] = { skipped: true, note: entry.note || "" };
        playTapSound();
    } else {
        delete reps[dateStr];
    }
    
    state.habitRepetitions[habitId] = reps;
    if (habit) {
        updateHabitMetricsCache(habit);
    }
    saveState();
    renderHabits();
}

function triggerCelebrationHeartbeat() {
    const habitProgressCard = document.querySelector('#habit-dashboard-view .card');
    if (habitProgressCard) {
        habitProgressCard.classList.add('celebrate-heartbeat');
        setTimeout(() => {
            habitProgressCard.classList.remove('celebrate-heartbeat');
        }, 800);
    }
}

let activeHabitFilter = null;

// --- Habits Main Render List ---
export function renderHabits() {
    const habitListContainer = document.getElementById('habit-list-container');
    if (!habitListContainer) return;
    
    habitListContainer.innerHTML = '';
    
    // Initialize drag-and-drop on container (only once)
    if (!habitListContainer.dataset.dragInit) {
        habitListContainer.dataset.dragInit = 'true';
        
        habitListContainer.addEventListener('dragover', e => {
            e.preventDefault();
            const draggingCard = habitListContainer.querySelector('.dragging');
            if (!draggingCard) return;
            const targetContent = e.target.closest('.routine-section-content');
            if (!targetContent) return;
            
            const afterElement = getDragAfterElement(targetContent, e.clientY);
            if (afterElement == null) {
                targetContent.appendChild(draggingCard);
            } else {
                targetContent.insertBefore(draggingCard, afterElement);
            }
        });
        
        habitListContainer.addEventListener('drop', e => {
            e.preventDefault();
            const cards = [...habitListContainer.querySelectorAll('.habit-card')];
            
            // Update routineSection of each dropped card based on its parent container
            cards.forEach(c => {
                const habitId = c.dataset.id;
                const parentContent = c.closest('.routine-section-content');
                if (parentContent) {
                    const sectionName = parentContent.dataset.section;
                    const habit = state.habits.find(h => h.id === habitId);
                    if (habit && habit.routineSection !== sectionName) {
                        habit.routineSection = sectionName;
                    }
                }
            });

            const newOrderIds = cards.map(c => c.dataset.id);
            
            const activeHabitMap = new Map();
            state.habits.forEach(h => {
                if (!h.archived) activeHabitMap.set(h.id, h);
            });
            
            const newHabitsList = [];
            newOrderIds.forEach(id => {
                if (activeHabitMap.has(id)) {
                    newHabitsList.push(activeHabitMap.get(id));
                    activeHabitMap.delete(id);
                }
            });
            activeHabitMap.forEach(h => newHabitsList.push(h));
            state.habits.forEach(h => {
                if (h.archived) newHabitsList.push(h);
            });
            
            state.habits = newHabitsList;
            saveState();
            renderHabits();
        });
        
        habitListContainer.addEventListener('touchstart', e => {
            // Handled via individual drag handles now
        }, {passive: true});
        
        function getDragAfterElement(container, y) {
            const draggableElements = [...container.querySelectorAll('.habit-card:not(.dragging)')];
            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }
    }

    
    let activeHabits = state.habits.filter(h => !h.archived);
    const todayStr = getLocalDateString();
    const totalHabits = activeHabits.length;
    let completedToday = 0;
    
    activeHabits.forEach(h => {
        if (isHabitCompletedOn(h.id, todayStr)) {
            completedToday++;
        }
    });
    
    const progressRatioEl = document.getElementById('habit-today-progress-ratio');
    const progressBarEl = document.getElementById('habit-today-progress-bar');
    if (progressRatioEl && progressBarEl) {
        progressRatioEl.textContent = `${completedToday} / ${totalHabits}`;
        const pct = totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0;
        progressBarEl.style.width = `${pct}%`;
    }

    const filterContainer = document.getElementById('habit-filter-container');
    if (filterContainer) {
        const uniqueTags = new Set();
        activeHabits.forEach(h => {
            if (h.tags && Array.isArray(h.tags)) {
                h.tags.forEach(t => uniqueTags.add(t));
            }
        });
        const tags = Array.from(uniqueTags).sort();
        
        filterContainer.innerHTML = '';
        if (tags.length > 0) {
            const allChip = document.createElement('div');
            allChip.className = 'habit-filter-chip ' + (activeHabitFilter === null ? 'active' : '');
            allChip.textContent = 'Semua';
            allChip.onclick = () => {
                activeHabitFilter = null;
                renderHabits();
            };
            filterContainer.appendChild(allChip);
            
            tags.forEach(t => {
                const chip = document.createElement('div');
                chip.className = 'habit-filter-chip ' + (activeHabitFilter === t ? 'active' : '');
                chip.textContent = t;
                chip.onclick = () => {
                    activeHabitFilter = t;
                    renderHabits();
                };
                filterContainer.appendChild(chip);
            });
        }
    }

    if (activeHabitFilter) {
        activeHabits = activeHabits.filter(h => h.tags && h.tags.includes(activeHabitFilter));
    }
    
    if (activeHabits.length === 0) {
        const emptyCard = document.createElement('div');
        emptyCard.className = 'habit-empty-card';
        emptyCard.innerHTML = `
            <div class="habit-empty-icon">${SVG_ICONS.calendar}</div>
            <div class="label-large" style="margin-bottom: 8px;">Belum Ada Kebiasaan</div>
            <div class="text-sub" style="font-size: 0.85rem;">Mulai buat kebiasaan baik Anda hari ini.</div>
        `;
        habitListContainer.appendChild(emptyCard);
    }
    
    const recentDates = getRecentDates();
    
    // Group activeHabits by routineSection to create DOM wrappers first
    const sections = {
        pagi: { title: "☀️ Pagi", habits: [], contentWrapper: null },
        siang: { title: "☀️ Siang", habits: [], contentWrapper: null },
        sore: { title: "🌅 Sore", habits: [], contentWrapper: null },
        malam: { title: "🌙 Malam", habits: [], contentWrapper: null },
        anytime: { title: "📅 Bebas", habits: [], contentWrapper: null }
    };

    activeHabits.forEach(h => {
        const sec = h.routineSection || 'anytime';
        if (sections[sec]) {
            sections[sec].habits.push(h);
        } else {
            sections.anytime.habits.push(h);
        }
    });

    Object.keys(sections).forEach(sectionKey => {
        const sectionData = sections[sectionKey];
        if (sectionData.habits.length === 0) return;

        const isCollapsed = localStorage.getItem(`collapsed_routine_${sectionKey}`) === 'true';
        const totalInSection = sectionData.habits.length;
        let completedInSection = 0;
        sectionData.habits.forEach(h => {
            if (isHabitCompletedOn(h.id, todayStr)) {
                completedInSection++;
            }
        });

        const secContainer = document.createElement('div');
        secContainer.className = 'routine-section';

        const header = document.createElement('div');
        header.className = 'routine-section-header';
        header.onclick = () => toggleRoutineSection(sectionKey);

        header.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span class="routine-section-title" style="font-weight: 800; font-size: 1.1rem; color: var(--md-sys-color-primary);">${sectionData.title}</span>
                <span class="routine-section-count" style="font-size: 0.8rem; background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 12px; opacity: 0.8;">${completedInSection}/${totalInSection}</span>
            </div>
            <svg class="routine-section-chevron ${isCollapsed ? '' : 'expanded'}" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="transition: transform 0.2s ease; transform: ${isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)'};">
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/>
            </svg>
        `;

        const contentWrapper = document.createElement('div');
        contentWrapper.className = `routine-section-content ${isCollapsed ? 'collapsed' : ''}`;
        contentWrapper.dataset.section = sectionKey;
        contentWrapper.style.display = isCollapsed ? 'none' : 'flex';
        contentWrapper.style.flexDirection = 'column';
        contentWrapper.style.gap = '12px';
        contentWrapper.style.padding = '8px 0';

        secContainer.appendChild(header);
        secContainer.appendChild(contentWrapper);
        habitListContainer.appendChild(secContainer);

        sectionData.contentWrapper = contentWrapper;
    });

    activeHabits.forEach(habit => {
        const card = document.createElement('div');
        card.className = 'habit-card';
        card.dataset.id = habit.id;
        card.draggable = true;
        
        card.addEventListener('dragstart', (e) => {
            card.classList.add('dragging');
            if (e.dataTransfer) {
                e.dataTransfer.setData('text/plain', habit.id);
                e.dataTransfer.effectAllowed = 'move';
            }
        });
        
        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
        });
        
        const infoRow = document.createElement('div');
        infoRow.className = 'habit-info';
        
        const dragHandle = document.createElement('div');
        dragHandle.innerHTML = SVG_ICONS.dragGrip;
        dragHandle.style.cursor = 'grab';
        dragHandle.style.display = 'flex';
        dragHandle.style.alignItems = 'center';
        dragHandle.style.padding = '8px 4px';
        dragHandle.style.marginRight = '4px';
        
        // Touch Drag Implementation
        let touchDragClone = null;
        dragHandle.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Stop scrolling
            const touch = e.touches[0];
            
            touchDragClone = card.cloneNode(true);
            touchDragClone.style.position = 'fixed';
            touchDragClone.style.zIndex = '9999';
            touchDragClone.style.width = card.offsetWidth + 'px';
            touchDragClone.style.opacity = '0.9';
            touchDragClone.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)';
            touchDragClone.style.pointerEvents = 'none'; // So elementFromPoint works
            
            touchDragClone.style.left = card.getBoundingClientRect().left + 'px';
            touchDragClone.style.top = (touch.clientY - card.offsetHeight / 2) + 'px';
            
            document.body.appendChild(touchDragClone);
            card.style.opacity = '0.2';
            card.classList.add('dragging');
        }, {passive: false});

        dragHandle.addEventListener('touchmove', (e) => {
            if (!touchDragClone) return;
            e.preventDefault();
            const touch = e.touches[0];
            touchDragClone.style.top = (touch.clientY - card.offsetHeight / 2) + 'px';
            
            const elementHovered = document.elementFromPoint(touch.clientX, touch.clientY);
            if (!elementHovered) return;
            const cardHovered = elementHovered.closest('.habit-card');
            if (cardHovered && cardHovered !== card && !cardHovered.classList.contains('archived')) {
                const box = cardHovered.getBoundingClientRect();
                if (touch.clientY < box.top + box.height / 2) {
                    habitListContainer.insertBefore(card, cardHovered);
                } else {
                    habitListContainer.insertBefore(card, cardHovered.nextSibling);
                }
            }
        }, {passive: false});

        dragHandle.addEventListener('touchend', (e) => {
            if (!touchDragClone) return;
            touchDragClone.remove();
            touchDragClone = null;
            card.style.opacity = '1';
            card.classList.remove('dragging');
            
            // Trigger saving the new order
            habitListContainer.dispatchEvent(new Event('drop'));
        });

        const infoContent = document.createElement('div');
        infoContent.style.display = 'flex';
        infoContent.style.alignItems = 'center';
        infoContent.style.gap = '12px';
        infoContent.style.flexGrow = '1';
        infoContent.style.overflow = 'hidden';
        infoContent.onclick = () => openHabitDetailModal(habit.id);
        
        const colorIndicator = document.createElement('div');
        colorIndicator.className = 'habit-color-indicator';
        colorIndicator.style.backgroundColor = habit.color || 'var(--md-sys-color-primary)';
        
        const details = document.createElement('div');
        details.className = 'habit-details';
        
        const title = document.createElement('span');
        title.className = 'habit-title';
        title.textContent = habit.name;
        
        const desc = document.createElement('span');
        desc.className = 'habit-desc';
        desc.textContent = habit.description || 'Tidak ada deskripsi';
        
        const currentStreak = typeof habit.currentStreak !== 'undefined' ? habit.currentStreak : 0;
        const strength = typeof habit.strengthScore !== 'undefined' ? habit.strengthScore : 0;
        const streak = document.createElement('span');
        streak.className = 'habit-streak';
        let targetText = "";
        let streakSuffix = " Hari";
        if (habit.scheduleType === 'weekly') {
            targetText = ` &nbsp;&bull;&nbsp; 🎯 ${habit.weeklyTarget}x/minggu`;
            streakSuffix = " Minggu";
        } else if (habit.scheduleType === 'interval') {
            targetText = ` &nbsp;&bull;&nbsp; 🎯 Tiap ${habit.intervalDays || 2} hari`;
        }
        streak.innerHTML = `🔥 ${currentStreak}${streakSuffix} &nbsp;&bull;&nbsp; ⚡ ${strength}%${targetText}`;
        
        details.appendChild(title);
        details.appendChild(desc);
        details.appendChild(streak);
        
        if (habit.isNumerical) {
            const progressMini = document.createElement('span');
            progressMini.className = 'habit-progress-mini';
            progressMini.style.color = habit.color || 'var(--md-sys-color-primary)';
            const reps = state.habitRepetitions[habit.id] || {};
            const todayEntry = reps[todayStr] || { value: 0 };
            progressMini.innerHTML = `🎯 ${todayEntry.value || 0} / ${habit.targetValue || 100} ${habit.targetUnit || 'kali'}`;
            details.appendChild(progressMini);
        }
        
        infoContent.appendChild(colorIndicator);
        infoContent.appendChild(details);
        
        infoRow.appendChild(dragHandle);
        infoRow.appendChild(infoContent);
        
        const daysStrip = document.createElement('div');
        daysStrip.className = 'habit-days-strip';
        
        recentDates.forEach(day => {
            const reps = state.habitRepetitions[habit.id] || {};
            const entry = reps[day.dateStr];
            const { completed: isCompleted, partial: isPartial, skipped: isSkipped } = getHabitCompletionStatus(habit, entry);
            
            const isScheduled = isHabitScheduledOnDate(habit, day.dateStr);
            
            const bubble = document.createElement('div');
            let bubbleClass = 'habit-day-bubble';
            if (isCompleted) {
                bubbleClass += ' completed';
            } else if (isPartial) {
                bubbleClass += ' partial';
            } else if (isSkipped || !isScheduled) {
                bubbleClass += ' skipped';
            }
            if (day.isToday) {
                bubbleClass += ' today';
            }
            bubble.className = bubbleClass;
            bubble.style.setProperty('--habit-color', habit.color || 'var(--md-sys-color-primary)');
            
            if (isScheduled || isCompleted || isPartial) {
                bubble.onclick = (e) => {
                    e.stopPropagation();
                    if (bubble.clickTimeout) {
                        clearTimeout(bubble.clickTimeout);
                        bubble.clickTimeout = null;
                        openHabitLogModal(habit.id, day.dateStr);
                    } else {
                        bubble.clickTimeout = setTimeout(() => {
                            toggleHabitDay(habit.id, day.dateStr);
                            bubble.clickTimeout = null;
                        }, 250);
                    }
                };
            } else {
                bubble.onclick = (e) => {
                    e.stopPropagation();
                    openHabitLogModal(habit.id, day.dateStr);
                };
            }
            
            const labelSpan = document.createElement('span');
            labelSpan.className = 'day-label';
            labelSpan.textContent = day.label;
            
            const circle = document.createElement('div');
            circle.className = 'day-circle';
            
            const checkIcon = document.createElement('span');
            checkIcon.className = 'checkmark-icon';
            if (isCompleted || isPartial) {
                checkIcon.textContent = '✓';
            } else if (isSkipped || !isScheduled) {
                checkIcon.textContent = '-';
            } else {
                checkIcon.textContent = '✓';
            }
            
            circle.appendChild(checkIcon);
            bubble.appendChild(labelSpan);
            bubble.appendChild(circle);
            daysStrip.appendChild(bubble);
        });
        
        card.appendChild(infoRow);
        card.appendChild(daysStrip);
        
        const sec = habit.routineSection || 'anytime';
        const targetWrapper = sections[sec]?.contentWrapper || sections.anytime.contentWrapper;
        if (targetWrapper) {
            targetWrapper.appendChild(card);
        } else {
            habitListContainer.appendChild(card);
        }
    });

    const archivedHabits = state.habits.filter(h => h.archived);
    const prevArchived = habitListContainer.parentElement.querySelector('.archived-section-wrapper');
    if (prevArchived) prevArchived.remove();

    if (archivedHabits.length > 0) {
        const wrapper = document.createElement('div');
        wrapper.className = 'archived-section-wrapper';

        const header = document.createElement('div');
        header.className = 'archived-section-header';
        header.onclick = () => toggleArchivedSection();

        const titleSpan = document.createElement('span');
        titleSpan.className = 'archived-section-title';
        titleSpan.textContent = `Diarsipkan (${archivedHabits.length})`;

        const chevron = document.createElement('svg');
        chevron.id = 'archived-section-chevron';
        chevron.className = 'archived-section-chevron' + (archivedSectionExpanded ? ' expanded' : '');
        chevron.setAttribute('width', '20');
        chevron.setAttribute('height', '20');
        chevron.setAttribute('viewBox', '0 0 24 24');
        chevron.setAttribute('fill', 'currentColor');
        chevron.innerHTML = '<path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/>';

        header.appendChild(titleSpan);
        header.appendChild(chevron);
        wrapper.appendChild(header);

        const content = document.createElement('div');
        content.id = 'archived-section-content';
        content.className = 'archived-section-content' + (archivedSectionExpanded ? ' expanded' : '');

        archivedHabits.forEach(habit => {
            const card = document.createElement('div');
            card.className = 'habit-card archived';

            const infoRow = document.createElement('div');
            infoRow.className = 'habit-info';

            const colorIndicator = document.createElement('div');
            colorIndicator.className = 'habit-color-indicator';
            colorIndicator.style.backgroundColor = habit.color || 'var(--md-sys-color-primary)';

            const details = document.createElement('div');
            details.className = 'habit-details';

            const title = document.createElement('span');
            title.className = 'habit-title';
            title.textContent = habit.name;

            const desc = document.createElement('span');
            desc.className = 'habit-desc';
            desc.textContent = habit.description || 'Diarsipkan';

            details.appendChild(title);
            details.appendChild(desc);
            infoRow.appendChild(colorIndicator);
            infoRow.appendChild(details);

            const actions = document.createElement('div');
            actions.className = 'archived-actions';

            const restoreBtn = document.createElement('button');
            restoreBtn.className = 'btn btn-restore';
            restoreBtn.textContent = 'Pulihkan';
            restoreBtn.onclick = (e) => { e.stopPropagation(); restoreHabit(habit.id); };

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-permanent-delete';
            deleteBtn.textContent = 'Hapus';
            deleteBtn.onclick = (e) => { e.stopPropagation(); permanentDeleteHabit(habit.id); };

            actions.appendChild(restoreBtn);
            actions.appendChild(deleteBtn);
            card.appendChild(infoRow);
            card.appendChild(actions);
            content.appendChild(card);
        });

        wrapper.appendChild(content);
        habitListContainer.parentElement.appendChild(wrapper);
    }
}

// --- Habit Modal Actions ---
export function toggleScheduleDaysView(val) {
    const daysContainer = document.getElementById('habit-schedule-days-container');
    const weeklyContainer = document.getElementById('habit-schedule-weekly-container');
    const intervalContainer = document.getElementById('habit-schedule-interval-container');
    if (daysContainer) {
        daysContainer.style.display = (val === 'specific') ? 'flex' : 'none';
    }
    if (weeklyContainer) {
        weeklyContainer.style.display = (val === 'weekly') ? 'flex' : 'none';
    }
    if (intervalContainer) {
        intervalContainer.style.display = (val === 'interval') ? 'flex' : 'none';
    }
}

export function applyPreset(presetType) {
    const presets = {
        tilawah: {
            name: "Tilawah Al-Qur'an",
            desc: "Membaca Al-Qur'an harian",
            routine: "anytime",
            numerical: true,
            targetVal: 1,
            targetUnit: "juz",
            color: "#8cd6b5"
        },
        dhuha: {
            name: "Shalat Dhuha",
            desc: "Melaksanakan shalat sunnah Dhuha",
            routine: "pagi",
            numerical: true,
            targetVal: 2,
            targetUnit: "rakaat",
            color: "#dcc48c"
        },
        sedekah: {
            name: "Sedekah Subuh",
            desc: "Sedekah harian setelah shalat Subuh",
            routine: "pagi",
            numerical: false,
            targetVal: 1,
            targetUnit: "kali",
            color: "#ff8a65"
        },
        tahajjud: {
            name: "Shalat Tahajjud",
            desc: "Melaksanakan shalat sunnah Tahajjud",
            routine: "malam",
            numerical: true,
            targetVal: 2,
            targetUnit: "rakaat",
            color: "#4fc3f7"
        }
    };

    const data = presets[presetType];
    if (!data) return;

    const nameInput = document.getElementById('habit-input-name');
    const descInput = document.getElementById('habit-input-desc');
    const routineSelect = document.getElementById('habit-input-routine');
    const numericalChk = document.getElementById('habit-input-numerical');
    const targetValInput = document.getElementById('habit-input-target-val');
    const targetUnitInput = document.getElementById('habit-input-target-unit');

    if (nameInput) nameInput.value = data.name;
    if (descInput) descInput.value = data.desc;
    if (routineSelect) routineSelect.value = data.routine;
    if (numericalChk) {
        numericalChk.checked = data.numerical;
        toggleHabitNumericalFields(data.numerical);
    }
    if (targetValInput) targetValInput.value = data.targetVal;
    if (targetUnitInput) targetUnitInput.value = data.targetUnit;

    const colorDot = document.querySelector(`.color-picker-dot[data-color="${data.color}"]`);
    if (colorDot) {
        document.querySelectorAll('.color-picker-dot').forEach(el => el.classList.remove('active'));
        colorDot.classList.add('active');
    }
}

export function openHabitModal(mode, habitId = null) {
    currentEditingHabitId = habitId;
    
    const modal = document.getElementById('habit-modal');
    const titleEl = document.getElementById('habit-modal-title');
    const nameInput = document.getElementById('habit-input-name');
    const descInput = document.getElementById('habit-input-desc');
    const deleteBtn = document.getElementById('habit-btn-delete');
    
    // Populate linked dzikir select dynamically
    const linkedDzikirSelect = document.getElementById('habit-input-linked-dzikir');
    if (linkedDzikirSelect) {
        linkedDzikirSelect.innerHTML = `
            <option value="">Tidak ada link (Manual)</option>
            <option value="guided-pagi">☀️ Sesi Dzikir Pagi</option>
            <option value="guided-petang">🌙 Sesi Dzikir Petang</option>
            <option value="guided-wirid">📿 Sesi Wirid Ba'da Shalat</option>
        `;
        
        if (azkarData && Array.isArray(azkarData)) {
            const groupLib = document.createElement('optgroup');
            groupLib.label = "Pustaka Azkar";
            azkarData.forEach(zkr => {
                const opt = document.createElement('option');
                opt.value = `library-${zkr.id}`;
                opt.textContent = `📿 ${zkr.name}`;
                groupLib.appendChild(opt);
            });
            linkedDzikirSelect.appendChild(groupLib);
        }

        if (state.customAzkar && state.customAzkar.length > 0) {
            const groupCustom = document.createElement('optgroup');
            groupCustom.label = "Dzikir Custom Anda";
            state.customAzkar.forEach(zkr => {
                const opt = document.createElement('option');
                opt.value = `custom-${zkr.id}`;
                opt.textContent = `✏️ ${zkr.name}`;
                groupCustom.appendChild(opt);
            });
            linkedDzikirSelect.appendChild(groupCustom);
        }
    }
    
    if (!modal) return;

    // Attach listener for quick presets
    const presetContainer = document.querySelector('.habit-preset-container');
    if (presetContainer && !presetContainer.dataset.hasListener) {
        presetContainer.dataset.hasListener = "true";
        presetContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.preset-btn');
            if (!btn) return;
            applyPreset(btn.dataset.preset);
        });
    }
    
    const picker = document.getElementById('habit-color-picker');
    if (picker && !picker.dataset.hasListener) {
        picker.dataset.hasListener = "true";
        picker.addEventListener('click', (e) => {
            const dot = e.target.closest('.color-picker-dot');
            if (!dot) return;
            document.querySelectorAll('.color-picker-dot').forEach(el => el.classList.remove('active'));
            dot.classList.add('active');
        });
    }
    
    document.querySelectorAll('.color-picker-dot').forEach(el => el.classList.remove('active'));
    const defaultDot = document.querySelector('.color-picker-dot[data-color="#8cd6b5"]');
    if (defaultDot) defaultDot.classList.add('active');
    
    const numericalChk = document.getElementById('habit-input-numerical');
    const targetValInput = document.getElementById('habit-input-target-val');
    const targetUnitInput = document.getElementById('habit-input-target-unit');

    if (mode === 'new') {
        if (titleEl) titleEl.textContent = 'Tambah Kebiasaan';
        if (nameInput) nameInput.value = '';
        if (descInput) descInput.value = '';
        if (deleteBtn) deleteBtn.style.display = 'none';
        const archiveBtn = document.getElementById('habit-btn-archive');
        if (archiveBtn) archiveBtn.style.display = 'none';

        const routineInput = document.getElementById('habit-input-routine');
        if (routineInput) routineInput.value = 'anytime';
        const linkedDzikirSelect = document.getElementById('habit-input-linked-dzikir');
        if (linkedDzikirSelect) linkedDzikirSelect.value = '';
        
        if (numericalChk) numericalChk.checked = false;
        toggleHabitNumericalFields(false);
        if (targetValInput) targetValInput.value = 100;
        if (targetUnitInput) targetUnitInput.value = 'kali';

        const typeSelect = document.getElementById('habit-schedule-type');
        if (typeSelect) typeSelect.value = 'daily';
        toggleScheduleDaysView('daily');
        document.querySelectorAll('.habit-day-chk').forEach(chk => chk.checked = true);
        const weeklyTargetInput = document.getElementById('habit-input-weekly-target');
        if (weeklyTargetInput) {
            weeklyTargetInput.value = 3;
            const targetLabel = document.getElementById('weekly-target-label');
            if (targetLabel) targetLabel.innerText = '3 Kali';
        }
        
        const intervalDaysInput = document.getElementById('habit-input-interval-days');
        if (intervalDaysInput) intervalDaysInput.value = 2;
        const anchorDateInput = document.getElementById('habit-input-anchor-date');
        if (anchorDateInput) anchorDateInput.value = getLocalDateString();
        
        const reminderEnabledInput = document.getElementById('habit-input-reminder-enabled');
        if (reminderEnabledInput) reminderEnabledInput.checked = false;
        const reminderTimeInput = document.getElementById('habit-input-reminder-time');
        if (reminderTimeInput) {
            reminderTimeInput.value = "08:00";
            reminderTimeInput.style.display = 'none';
        }
    } else if (mode === 'edit') {
        if (titleEl) titleEl.textContent = 'Edit Kebiasaan';
        const habit = state.habits.find(h => h.id === habitId);
        if (habit) {
            if (nameInput) nameInput.value = habit.name;
            if (descInput) descInput.value = habit.description || '';
            const tagsInput = document.getElementById('habit-input-tags');
            if (tagsInput) tagsInput.value = habit.tags ? habit.tags.join(', ') : '';
            if (deleteBtn) deleteBtn.style.display = 'block';
            const archiveBtn = document.getElementById('habit-btn-archive');
            if (archiveBtn) {
                archiveBtn.style.display = habit.archived ? 'none' : 'block';
                archiveBtn.textContent = habit.archived ? 'Pulihkan' : 'Arsipkan';
            }
            
            if (numericalChk) numericalChk.checked = !!habit.isNumerical;
            toggleHabitNumericalFields(!!habit.isNumerical);
            if (targetValInput) targetValInput.value = habit.targetValue || 100;
            if (targetUnitInput) targetUnitInput.value = habit.targetUnit || 'kali';

            const colorDot = document.querySelector(`.color-picker-dot[data-color="${habit.color}"]`);
            if (colorDot) {
                document.querySelectorAll('.color-picker-dot').forEach(el => el.classList.remove('active'));
                colorDot.classList.add('active');
            }
            
            const typeSelect = document.getElementById('habit-schedule-type');
            const schedType = habit.scheduleType || 'daily';
            if (typeSelect) typeSelect.value = schedType;
            toggleScheduleDaysView(schedType);
            
            const schedDays = habit.scheduleDays || [0, 1, 2, 3, 4, 5, 6];
            document.querySelectorAll('.habit-day-chk').forEach(chk => {
                chk.checked = schedDays.includes(parseInt(chk.value));
            });
            const weeklyTargetInput = document.getElementById('habit-input-weekly-target');
            if (weeklyTargetInput) {
                weeklyTargetInput.value = habit.weeklyTarget || 3;
                const targetLabel = document.getElementById('weekly-target-label');
                if (targetLabel) targetLabel.innerText = (habit.weeklyTarget || 3) + ' Kali';
            }
            
            const intervalDaysInput = document.getElementById('habit-input-interval-days');
            if (intervalDaysInput) intervalDaysInput.value = habit.intervalDays || 2;
            const anchorDateInput = document.getElementById('habit-input-anchor-date');
            if (anchorDateInput) anchorDateInput.value = habit.anchorDate || getLocalDateString();
            
            const reminderEnabledInput = document.getElementById('habit-input-reminder-enabled');
            if (reminderEnabledInput) reminderEnabledInput.checked = !!habit.reminderEnabled;
            const reminderTimeInput = document.getElementById('habit-input-reminder-time');
            if (reminderTimeInput) {
                reminderTimeInput.value = habit.reminderTime || "08:00";
                reminderTimeInput.style.display = habit.reminderEnabled ? 'block' : 'none';
            }

            const routineInput = document.getElementById('habit-input-routine');
            if (routineInput) routineInput.value = habit.routineSection || 'anytime';
            const linkedDzikirSelect = document.getElementById('habit-input-linked-dzikir');
            if (linkedDzikirSelect) linkedDzikirSelect.value = habit.linkedDzikirId || '';
        }
    }
    
    const chk = document.getElementById('habit-input-reminder-enabled');
    if (chk) {
        chk.onchange = (e) => {
            const reminderTimeInput = document.getElementById('habit-input-reminder-time');
            if (e.target.checked) {
                if (reminderTimeInput) reminderTimeInput.style.display = 'block';
                requestNotificationPermissionAndRegister();
            } else {
                if (reminderTimeInput) reminderTimeInput.style.display = 'none';
            }
        };
    }
    
    modal.classList.add('active');
}

export function closeHabitModal() {
    const modal = document.getElementById('habit-modal');
    if (modal) modal.classList.remove('active');
}

export function saveHabitFromModal() {
    const nameInput = document.getElementById('habit-input-name');
    const descInput = document.getElementById('habit-input-desc');
    const tagsInput = document.getElementById('habit-input-tags');
    if (!nameInput) return;
    
    const nameVal = nameInput.value.trim();
    const descVal = descInput ? descInput.value.trim() : '';
    const tagsVal = tagsInput ? tagsInput.value.split(',').map(t => t.trim()).filter(t => t) : [];
    
    if (!nameVal) {
        showModal('Input Tidak Valid', 'Nama kebiasaan tidak boleh kosong.', null, true);
        return;
    }
    
    const typeSelect = document.getElementById('habit-schedule-type');
    const schedType = typeSelect ? typeSelect.value : 'daily';
    let schedDays = [0, 1, 2, 3, 4, 5, 6];
    
    if (schedType === 'specific') {
        schedDays = [];
        document.querySelectorAll('.habit-day-chk:checked').forEach(chk => {
            schedDays.push(parseInt(chk.value));
        });
        if (schedDays.length === 0) {
            showModal('Jadwal Tidak Valid', 'Pilih setidaknya satu hari untuk jadwal kebiasaan.', null, true);
            return;
        }
    }
    
    let weeklyTargetVal = 3;
    if (schedType === 'weekly') {
        const weeklyTargetInput = document.getElementById('habit-input-weekly-target');
        weeklyTargetVal = weeklyTargetInput ? parseInt(weeklyTargetInput.value) : 3;
    }

    let intervalDaysVal = 2;
    let anchorDateVal = getLocalDateString();
    if (schedType === 'interval') {
        const intervalDaysInput = document.getElementById('habit-input-interval-days');
        intervalDaysVal = intervalDaysInput ? parseInt(intervalDaysInput.value) || 2 : 2;
        if (intervalDaysVal < 2) {
            showModal('Input Tidak Valid', 'Interval pengulangan minimal 2 hari.', null, true);
            return;
        }
        const anchorDateInput = document.getElementById('habit-input-anchor-date');
        anchorDateVal = anchorDateInput && anchorDateInput.value ? anchorDateInput.value : getLocalDateString();
    }

    const reminderEnabledInput = document.getElementById('habit-input-reminder-enabled');
    const reminderEnabledVal = reminderEnabledInput ? reminderEnabledInput.checked : false;
    const reminderTimeInput = document.getElementById('habit-input-reminder-time');
    const reminderTimeVal = reminderTimeInput ? reminderTimeInput.value : "08:00";
    
    const numericalChk = document.getElementById('habit-input-numerical');
    const isNumericalVal = numericalChk ? numericalChk.checked : false;
    const targetValInput = document.getElementById('habit-input-target-val');
    const targetValVal = targetValInput ? parseInt(targetValInput.value) || 100 : 100;
    const targetUnitInput = document.getElementById('habit-input-target-unit');
    const targetUnitVal = targetUnitInput ? targetUnitInput.value.trim() || "kali" : "kali";

    const activeDot = document.querySelector('.color-picker-dot.active');
    const selectedColor = activeDot ? activeDot.dataset.color : '#8cd6b5';
    
    const routineInput = document.getElementById('habit-input-routine');
    const routineVal = routineInput ? routineInput.value : "anytime";
    const linkedDzikirInput = document.getElementById('habit-input-linked-dzikir');
    const linkedDzikirVal = linkedDzikirInput ? linkedDzikirInput.value || null : null;

    if (currentEditingHabitId === null) {
        const newHabit = {
            id: 'h_' + Date.now(),
            name: nameVal,
            description: descVal,
            color: selectedColor,
            scheduleType: schedType,
            scheduleDays: schedDays,
            weeklyTarget: weeklyTargetVal,
            intervalDays: intervalDaysVal,
            anchorDate: anchorDateVal,
            reminderEnabled: reminderEnabledVal,
            reminderTime: reminderTimeVal,
            isNumerical: isNumericalVal,
            targetValue: targetValVal,
            targetUnit: targetUnitVal,
            tags: tagsVal,
            routineSection: routineVal,
            linkedDzikirId: linkedDzikirVal,
            currentStreak: 0,
            bestStreak: 0,
            strengthScore: 0,
            createdAt: Date.now(),
            archived: false,
            historicalCount: 0
        };
        state.habits.push(newHabit);
        updateHabitMetricsCache(newHabit);
    } else {
        const habit = state.habits.find(h => h.id === currentEditingHabitId);
        if (habit) {
            habit.name = nameVal;
            habit.description = descVal;
            habit.color = selectedColor;
            habit.scheduleType = schedType;
            habit.scheduleDays = schedDays;
            habit.weeklyTarget = weeklyTargetVal;
            habit.intervalDays = intervalDaysVal;
            habit.anchorDate = anchorDateVal;
            habit.reminderEnabled = reminderEnabledVal;
            habit.reminderTime = reminderTimeVal;
            habit.isNumerical = isNumericalVal;
            habit.targetValue = targetValVal;
            habit.targetUnit = targetUnitVal;
            habit.tags = tagsVal;
            habit.routineSection = routineVal;
            habit.linkedDzikirId = linkedDzikirVal;
            updateHabitMetricsCache(habit);
        }
    }

    saveState();
    renderHabits();
    closeHabitModal();
    
    if (reminderEnabledVal) {
        requestNotificationPermissionAndRegister();
    }
}


export function deleteHabitFromModal() {
    if (currentEditingHabitId === null) return;
    
    closeHabitModal();
    
    showModal('Hapus Kebiasaan', 'Apakah Anda yakin ingin menghapus kebiasaan ini? Semua riwayat penyelesaian akan dihapus secara permanen.', () => {
        state.habits = state.habits.filter(h => h.id !== currentEditingHabitId);
        delete state.habitRepetitions[currentEditingHabitId];
        
        saveState();
        renderHabits();
        closeHabitDetailModal();
    }, false, () => {
        openHabitModal('edit', currentEditingHabitId);
    });
}

// --- Habit Detail Analytics Modal ---
export function openHabitDetailModal(habitId) {
    const habit = state.habits.find(h => h.id === habitId);
    if (!habit) return;

    // History API integration
    if (typeof window !== 'undefined') {
        window.isHabitDetailModalOpen = true;
    }
    if (typeof history !== 'undefined') {
        history.pushState({ modal: 'habit-detail', habitId }, '', '');
    }

    calendarHabitId = habitId;
    calendarYearState = new Date().getFullYear();
    calendarMonthState = new Date().getMonth();

    const modal = document.getElementById('habit-detail-modal');
    const titleEl = document.getElementById('habit-detail-title');
    const descEl = document.getElementById('habit-detail-desc');
    
    if (!modal) return;

    if (titleEl) titleEl.textContent = habit.name;
    if (descEl) descEl.textContent = habit.description || 'Tidak ada deskripsi';

    refreshHabitDetailModal(habitId);

    const editBtn = document.getElementById('habit-detail-edit-btn');
    if (editBtn) {
        editBtn.onclick = () => {
            closeHabitDetailModal();
            openHabitModal('edit', habitId);
        };
    }

    const csvBtn = document.getElementById('habit-detail-csv-btn');
    if (csvBtn) {
        csvBtn.onclick = () => {
            exportHabitCSV(habitId);
        };
    }

    modal.classList.add('active');
}

export function closeHabitDetailModal(fromPopstate = false) {
    const modal = document.getElementById('habit-detail-modal');
    if (!modal) return;
    
    if (typeof window !== 'undefined' && window.isHabitDetailModalOpen) {
        window.isHabitDetailModalOpen = false;
        if (typeof history !== 'undefined' && !fromPopstate) {
            history.back();
        }
    }

    modal.classList.remove('active');
}

// Expose for router popstate handling
if (typeof window !== 'undefined') {
    window.closeHabitDetailModal = closeHabitDetailModal;
}

export function refreshHabitDetailModal(habitId) {
    const habit = state.habits.find(h => h.id === habitId);
    if (!habit) return;

    const streakEl = document.getElementById('habit-detail-streak');
    const bestStreakEl = document.getElementById('habit-detail-best-streak');
    const completionsEl = document.getElementById('habit-detail-completions');
    const rateEl = document.getElementById('habit-detail-rate');
    const heatmapEl = document.getElementById('habit-detail-heatmap');

    const streaks = getHabitStreaks(habitId);
    let streakSuffix = " Hari";
    if (habit.scheduleType === 'weekly') {
        streakSuffix = " Minggu";
    }
    if (streakEl) streakEl.textContent = `${streaks.current}${streakSuffix}`;
    if (bestStreakEl) bestStreakEl.textContent = `${streaks.best}${streakSuffix}`;

    const reps = state.habitRepetitions[habitId] || {};
    const completedKeys = Object.keys(reps).filter(dStr => isHabitCompletedOn(habitId, dStr));
    const totalCompletions = completedKeys.length + (habit.historicalCount || 0);
    if (completionsEl) completionsEl.textContent = totalCompletions;

    const strength = calculateHabitStrength(habit);
    if (rateEl) rateEl.textContent = `${strength}%`;

    if (heatmapEl) {
        renderHeatmapChart(habit, heatmapEl);
    }

    renderCalendarPicker(habitId);

    // Render notes list
    const gridContainer = document.querySelector('.habit-detail-grid');
    if (gridContainer && gridContainer.children.length > 0) {
        const leftCol = gridContainer.children[0];
        let notesList = leftCol.querySelector('.habit-notes-list');
        if (!notesList) {
            notesList = document.createElement('div');
            notesList.className = 'habit-notes-list';
            leftCol.appendChild(notesList);
        }
        notesList.innerHTML = '<label class="label-large" style="display: block; margin-bottom: 8px;">Catatan Harian</label>';

        const sortedNoteDates = Object.keys(reps)
            .filter(dStr => reps[dStr].note && reps[dStr].note.trim() !== '')
            .sort((a, b) => new Date(b) - new Date(a));

        if (sortedNoteDates.length === 0) {
            const emptyNote = document.createElement('div');
            emptyNote.className = 'text-sub';
            emptyNote.style.fontSize = '0.85rem';
            emptyNote.style.opacity = '0.6';
            emptyNote.style.padding = '8px 4px';
            emptyNote.textContent = 'Belum ada catatan harian.';
            notesList.appendChild(emptyNote);
        } else {
            sortedNoteDates.forEach(dStr => {
                const entry = reps[dStr];
                const noteItem = document.createElement('div');
                noteItem.className = 'habit-note-item';
                noteItem.style.setProperty('--habit-color', habit.color || 'var(--md-sys-color-primary)');

                const [yr, mo, dy] = dStr.split('-').map(Number);
                const monthsIndoShort = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
                const dateFormatted = `${dy} ${monthsIndoShort[mo - 1]} ${yr}`;

                const noteDate = document.createElement('div');
                noteDate.className = 'habit-note-date';
                let valText = "";
                if (habit.isNumerical) {
                    valText = ` (${entry.value || 0} / ${habit.targetValue || 100} ${habit.targetUnit || 'kali'})`;
                }
                noteDate.textContent = `${dateFormatted}${valText}`;

                const noteContent = document.createElement('div');
                noteContent.className = 'habit-note-content';
                noteContent.textContent = entry.note;

                noteItem.appendChild(noteDate);
                noteItem.appendChild(noteContent);
                notesList.appendChild(noteItem);
            });
        }
    }

    const freqChartEl = document.getElementById('habit-detail-frequency-chart');
    if (freqChartEl) {
        renderFrequencyChart(habit, freqChartEl);
    }

    const dowChartEl = document.getElementById('habit-detail-dow-chart');
    if (dowChartEl) {
        renderDayOfWeekChart(habit, dowChartEl);
    }

    const scoreCanvas = document.getElementById('habit-detail-score-trend');
    if (scoreCanvas) {
        renderScoreTrend(habit, scoreCanvas);
    }
}

export function renderCalendarPicker(habitId) {
    const grid = document.getElementById('calendar-picker-grid');
    const headerText = document.getElementById('calendar-picker-month-year');
    if (!grid || !headerText) return;

    grid.innerHTML = '';
    const monthsIndo = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    headerText.textContent = `${monthsIndo[calendarMonthState]} ${calendarYearState}`;

    const firstDayIndex = new Date(calendarYearState, calendarMonthState, 1).getDay();
    const numDays = new Date(calendarYearState, calendarMonthState + 1, 0).getDate();
    const prevNumDays = new Date(calendarYearState, calendarMonthState, 0).getDate();

    const today = new Date();
    const todayStr = getLocalDateString(today);
    const reps = state.habitRepetitions[habitId] || {};

    const habit = state.habits.find(h => h.id === habitId);
    const habitColor = habit ? habit.color : 'var(--md-sys-color-primary)';

    // Prev month days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
        const dayNum = prevNumDays - i;
        let prevMonth = calendarMonthState - 1;
        let prevYear = calendarYearState;
        if (prevMonth < 0) {
            prevMonth = 11;
            prevYear--;
        }
        const dStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        const entry = reps[dStr];
        const { completed: isCompleted, partial: isPartial, skipped: isSkipped } = getHabitCompletionStatus(habit, entry);

        const isScheduled = isHabitScheduledOnDate(habit, dStr);

        const cell = document.createElement('div');
        const isFuture = dStr > todayStr;
        if (isFuture) {
            cell.className = 'calendar-picker-cell other-month future-day';
            cell.setAttribute('aria-hidden', 'true');
        } else {
            let cellClass = `calendar-picker-cell other-month`;
            if (isCompleted) {
                cellClass += ' completed';
            } else if (isPartial) {
                cellClass += ' partial';
            } else if (isSkipped) {
                cellClass += ' skipped';
            } else if (!isScheduled) {
                cellClass += ' not-scheduled';
            }
            cell.className = cellClass;
            cell.style.setProperty('--habit-color', habitColor);
            cell.innerText = isSkipped ? '—' : dayNum;
            
            // a11y support
            cell.setAttribute('role', 'button');
            cell.setAttribute('tabindex', '0');
            cell.setAttribute('aria-label', `${dayNum} ${monthsIndo[prevMonth]} ${prevYear}, ${isCompleted ? 'Selesai' : (isPartial ? 'Selesai Sebagian' : 'Belum Selesai')}${!isScheduled ? ' (Tidak dijadwalkan)' : ''}`);
            
            cell.onclick = () => openHabitLogModal(habitId, dStr);
            cell.onkeydown = (e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    openHabitLogModal(habitId, dStr);
                }
            };
        }
        grid.appendChild(cell);
    }

    // Current month days
    for (let i = 1; i <= numDays; i++) {
        const dStr = `${calendarYearState}-${String(calendarMonthState + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const entry = reps[dStr];
        const { completed: isCompleted, partial: isPartial, skipped: isSkipped } = getHabitCompletionStatus(habit, entry);
        const isToday = dStr === todayStr;

        const isScheduled = isHabitScheduledOnDate(habit, dStr);

        const cell = document.createElement('div');
        const isFuture = dStr > todayStr;
        if (isFuture) {
            cell.className = 'calendar-picker-cell future-day';
            cell.setAttribute('aria-hidden', 'true');
        } else {
            let cellClass = `calendar-picker-cell`;
            if (isCompleted) {
                cellClass += ' completed';
            } else if (isPartial) {
                cellClass += ' partial';
            } else if (isSkipped) {
                cellClass += ' skipped';
            } else if (!isScheduled) {
                cellClass += ' not-scheduled';
            }
            if (isToday) {
                cellClass += ' today';
            }
            cell.className = cellClass;
            cell.style.setProperty('--habit-color', habitColor);
            cell.innerText = isSkipped ? '—' : i;

            // a11y support
            cell.setAttribute('role', 'button');
            cell.setAttribute('tabindex', '0');
            cell.setAttribute('aria-label', `${i} ${monthsIndo[calendarMonthState]} ${calendarYearState}, ${isCompleted ? 'Selesai' : (isPartial ? 'Selesai Sebagian' : 'Belum Selesai')}${isToday ? ' (Hari ini)' : ''}${!isScheduled ? ' (Tidak dijadwalkan)' : ''}`);

            cell.onclick = () => openHabitLogModal(habitId, dStr);
            cell.onkeydown = (e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    openHabitLogModal(habitId, dStr);
                }
            };
        }
        grid.appendChild(cell);
    }

    // Next month days
    const totalCells = grid.children.length;
    const padCells = 42 - totalCells;
    for (let i = 1; i <= padCells; i++) {
        let nextMonth = calendarMonthState + 1;
        let nextYear = calendarYearState;
        if (nextMonth > 11) {
            nextMonth = 0;
            nextYear++;
        }
        const dStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const entry = reps[dStr];
        const { completed: isCompleted, partial: isPartial, skipped: isSkipped } = getHabitCompletionStatus(habit, entry);

        const isScheduled = isHabitScheduledOnDate(habit, dStr);

        const cell = document.createElement('div');
        const isFuture = dStr > todayStr;
        if (isFuture) {
            cell.className = 'calendar-picker-cell other-month future-day';
            cell.setAttribute('aria-hidden', 'true');
        } else {
            let cellClass = `calendar-picker-cell other-month`;
            if (isCompleted) {
                cellClass += ' completed';
            } else if (isPartial) {
                cellClass += ' partial';
            } else if (isSkipped) {
                cellClass += ' skipped';
            } else if (!isScheduled) {
                cellClass += ' not-scheduled';
            }
            cell.className = cellClass;
            cell.style.setProperty('--habit-color', habitColor);
            cell.innerText = isSkipped ? '—' : i;

            // a11y support
            cell.setAttribute('role', 'button');
            cell.setAttribute('tabindex', '0');
            cell.setAttribute('aria-label', `${i} ${monthsIndo[nextMonth]} ${nextYear}, ${isCompleted ? 'Selesai' : (isPartial ? 'Selesai Sebagian' : 'Belum Selesai')}${!isScheduled ? ' (Tidak dijadwalkan)' : ''}`);

            cell.onclick = () => openHabitLogModal(habitId, dStr);
            cell.onkeydown = (e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    openHabitLogModal(habitId, dStr);
                }
            };
        }
        grid.appendChild(cell);
    }
}

export function toggleCalendarPickerDay(habitId, dateStr) {
    toggleHabitDay(habitId, dateStr);
    refreshHabitDetailModal(habitId);
}

export function navigateCalendarMonth(dir) {
    calendarMonthState += dir;
    if (calendarMonthState < 0) {
        calendarMonthState = 11;
        calendarYearState--;
    } else if (calendarMonthState > 11) {
        calendarMonthState = 0;
        calendarYearState++;
    }
    if (calendarHabitId) {
        renderCalendarPicker(calendarHabitId);
    }
}

// --- Habit Collapsible Archive/Restore/Delete ---
export function archiveHabitFromModal() {
    if (currentEditingHabitId === null) return;

    closeHabitModal();

    showModal('Arsipkan Kebiasaan', 'Kebiasaan ini akan dipindahkan ke arsip. Anda dapat memulihkannya kapan saja.', () => {
        const habit = state.habits.find(h => h.id === currentEditingHabitId);
        if (habit) {
            habit.archived = true;
            saveState();
            renderHabits();
            closeHabitDetailModal();
        }
    }, false, () => {
        openHabitModal('edit', currentEditingHabitId);
    });
}

export function restoreHabit(habitId) {
    const habit = state.habits.find(h => h.id === habitId);
    if (habit) {
        habit.archived = false;
        saveState();
        renderHabits();
        vibrate(15);
    }
}

export function permanentDeleteHabit(habitId) {
    showModal('Hapus Permanen', 'Apakah Anda yakin? Kebiasaan dan seluruh riwayatnya akan dihapus secara permanen dan tidak dapat dipulihkan.', () => {
        state.habits = state.habits.filter(h => h.id !== habitId);
        delete state.habitRepetitions[habitId];
        saveState();
        renderHabits();
    });
}

export function toggleArchivedSection() {
    archivedSectionExpanded = !archivedSectionExpanded;
    const content = document.getElementById('archived-section-content');
    const chevron = document.getElementById('archived-section-chevron');
    if (content && chevron) {
        content.classList.toggle('expanded', archivedSectionExpanded);
        chevron.classList.toggle('expanded', archivedSectionExpanded);
    }
}

export function requestNotificationPermission(onGranted = null, onDenied = null) {
    if (!("Notification" in window)) {
        showModal('Notifikasi Tidak Didukung', 'Browser atau perangkat Anda tidak mendukung fitur notifikasi pengingat.', null, true);
        if (onDenied) onDenied();
        return;
    }
    
    if (Notification.permission === "default") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                if (onGranted) onGranted();
            } else {
                showModal('Izin Ditolak', 'Anda harus memberikan izin notifikasi agar pengingat dapat bekerja.', null, true);
                if (onDenied) onDenied();
            }
        });
    } else if (Notification.permission === "denied") {
        showModal('Izin Notifikasi Diblokir', 'Izin notifikasi diblokir di pengaturan browser Anda. Silakan aktifkan secara manual di pengaturan situs.', null, true);
        if (onDenied) onDenied();
    } else if (Notification.permission === "granted") {
        if (onGranted) onGranted();
    }
}

export function requestNotificationPermissionAndRegister() {
    requestNotificationPermission(null, () => {
        const chk = document.getElementById('habit-input-reminder-enabled');
        if (chk) {
            chk.checked = false;
            const reminderTimeInput = document.getElementById('habit-input-reminder-time');
            if (reminderTimeInput) reminderTimeInput.style.display = 'none';
        }
    });
}

export function triggerNotification(habit) {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
        sendNotification(habit);
    }
}

function sendNotification(habit) {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(reg => {
            reg.showNotification("Ingat Kebiasaan Baik!", {
                body: `Jangan lupa untuk menyelesaikan kebiasaan Anda hari ini: ${habit.name}`,
                icon: './icon-192.png',
                badge: './icon-192.png',
                vibrate: [200, 100, 200],
                tag: `reminder-${habit.id}`,
                renotify: true,
                data: {
                    habitId: habit.id
                }
            });
        });
    } else {
        new Notification("Ingat Kebiasaan Baik!", {
            body: `Jangan lupa untuk menyelesaikan kebiasaan Anda hari ini: ${habit.name}`,
            icon: './icon-192.png',
            tag: `reminder-${habit.id}`
        });
    }
}

export function triggerDzikirNotification(type) {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const title = type === 'pagi' ? "Waktunya Dzikir Pagi ☀️" : "Waktunya Dzikir Petang 🌙";
    const body = type === 'pagi' 
        ? "Sudah masuk waktu pagi, yuk luangkan waktu sejenak untuk berdzikir." 
        : "Sudah masuk waktu petang, yuk luangkan waktu sejenak untuk berdzikir.";

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(reg => {
            reg.showNotification(title, {
                body: body,
                icon: './icon-192.png',
                badge: './icon-192.png',
                vibrate: [300, 100, 300],
                tag: `dzikir-${type}`,
                renotify: true,
                data: {
                    type: `dzikir-${type}`
                }
            });
        });
    } else {
        new Notification(title, {
            body: body,
            icon: './icon-192.png',
            tag: `dzikir-${type}`
        });
    }
}

export function triggerTimerNotification() {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(reg => {
            reg.showNotification("Waktu Selesai!", {
                body: "Waktu timer telah habis. Alhamdulillah!",
                icon: './icon-192.png',
                badge: './icon-192.png',
                vibrate: [500, 200, 500],
                tag: `timer-finished`,
                renotify: true,
                data: {
                    type: 'timer-finished'
                }
            });
        });
    } else {
        new Notification("Waktu Selesai!", {
            body: "Waktu timer telah habis. Alhamdulillah!",
            icon: './icon-192.png',
            tag: `timer-finished`
        });
    }
}
export let currentLogHabitId = null;
export let currentLogDateStr = null;

export function toggleHabitNumericalFields(checked) {
    const container = document.getElementById('habit-numerical-fields-container');
    if (container) {
        container.style.display = checked ? 'flex' : 'none';
    }
}

export function openHabitLogModal(habitId, dateStr) {
    const habit = state.habits.find(h => h.id === habitId);
    if (!habit) return;

    currentLogHabitId = habitId;
    currentLogDateStr = dateStr;

    const modal = document.getElementById('habit-log-modal');
    const title = document.getElementById('habit-log-modal-title');
    const numSection = document.getElementById('habit-log-numerical-section');
    const valInput = document.getElementById('habit-log-value');
    const unitSpan = document.getElementById('habit-log-unit');
    const noteInput = document.getElementById('habit-log-note');

    if (!modal) return;

    // Format date in Indonesian for title
    const [yr, mo, dy] = dateStr.split('-').map(Number);
    const monthsIndoShort = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
    if (title) title.innerText = `Catatan: ${dy} ${monthsIndoShort[mo - 1]} ${yr}`;

    const reps = state.habitRepetitions[habitId] || {};
    const entry = reps[dateStr] || { value: 0, note: "" };

    if (habit.isNumerical) {
        if (numSection) numSection.style.display = 'block';
        if (valInput) valInput.value = entry.value || 0;
        if (unitSpan) unitSpan.innerText = habit.targetUnit || "kali";
    } else {
        if (numSection) numSection.style.display = 'none';
    }

    if (noteInput) noteInput.value = entry.note || "";

    modal.classList.add('active');
}

export function closeHabitLogModal() {
    const modal = document.getElementById('habit-log-modal');
    if (modal) modal.classList.remove('active');
    currentLogHabitId = null;
    currentLogDateStr = null;
    
    // If the habit details modal is open, refresh it
    if (calendarHabitId) {
        refreshHabitDetailModal(calendarHabitId);
    }
}

export function saveHabitLogFromModal() {
    if (!currentLogHabitId || !currentLogDateStr) return;

    const habit = state.habits.find(h => h.id === currentLogHabitId);
    if (!habit) return;

    const valInput = document.getElementById('habit-log-value');
    const noteInput = document.getElementById('habit-log-note');

    const valueVal = valInput ? parseInt(valInput.value) || 0 : 0;
    const noteVal = noteInput ? noteInput.value.trim() : "";

    const wasCompleted = isHabitCompletedOn(habit.id, currentLogDateStr);

    if (!state.habitRepetitions[currentLogHabitId]) {
        state.habitRepetitions[currentLogHabitId] = {};
    }

    const reps = state.habitRepetitions[currentLogHabitId];

    if (!habit.isNumerical && noteVal === "") {
        reps[currentLogDateStr] = { value: 1, note: "" };
    } else {
        reps[currentLogDateStr] = {
            value: habit.isNumerical ? valueVal : 1,
            note: noteVal
        };
    }

    const isCompletedNow = getHabitCompletionStatus(habit, reps[currentLogDateStr]).completed;

    if (!wasCompleted && isCompletedNow && currentLogDateStr === getLocalDateString()) {
        triggerCelebrationHeartbeat();
        fireConfetti(80);
    }

    // Keep size under 365
    const keys = Object.keys(reps);
    if (keys.length >= 365) {
        keys.sort((a, b) => new Date(a) - new Date(b));
        const oldest = keys[0];
        delete reps[oldest];
        habit.historicalCount = (habit.historicalCount || 0) + 1;
    }

    state.habitRepetitions[currentLogHabitId] = reps;
    updateHabitMetricsCache(habit);
    saveState();
    renderHabits();
    closeHabitLogModal();
}

export function skipHabitLogFromModal() {
    if (!currentLogHabitId || !currentLogDateStr) return;

    const habit = state.habits.find(h => h.id === currentLogHabitId);
    if (!habit) return;

    if (!state.habitRepetitions[currentLogHabitId]) {
        state.habitRepetitions[currentLogHabitId] = {};
    }

    const reps = state.habitRepetitions[currentLogHabitId];

    reps[currentLogDateStr] = {
        value: 0,
        note: "",
        skipped: true
    };

    // Keep size under 365
    const keys = Object.keys(reps);
    if (keys.length >= 365) {
        keys.sort((a, b) => new Date(a) - new Date(b));
        const oldest = keys[0];
        delete reps[oldest];
        habit.historicalCount = (habit.historicalCount || 0) + 1;
    }

    state.habitRepetitions[currentLogHabitId] = reps;
    updateHabitMetricsCache(habit);
    saveState();
    renderHabits();
    closeHabitLogModal();
}

export function moveHabit(habitId, direction) {
    const index = state.habits.findIndex(h => h.id === habitId);
    if (index === -1) return false;
    
    if (direction === 'up' && index > 0) {
        const temp = state.habits[index];
        state.habits[index] = state.habits[index - 1];
        state.habits[index - 1] = temp;
        return true;
    } else if (direction === 'down' && index < state.habits.length - 1) {
        const temp = state.habits[index];
        state.habits[index] = state.habits[index + 1];
        state.habits[index + 1] = temp;
        return true;
    }
    return false;
}

let lastReminderCheckMinute = -1;
export function initRemindersTimer() {
    setInterval(() => {
        const now = new Date();
        const currentMinute = now.getMinutes();
        if (currentMinute === lastReminderCheckMinute) return;
        lastReminderCheckMinute = currentMinute;

        const currentHour = now.getHours();
        const hourStr = String(currentHour).padStart(2, '0');
        const minStr = String(currentMinute).padStart(2, '0');
        const timeStr = `${hourStr}:${minStr}`;

        const todayStr = getLocalDateString();

        state.habits.forEach(habit => {
            if (habit.reminderEnabled && !habit.archived && habit.reminderTime === timeStr) {
                const reps = state.habitRepetitions[habit.id] || {};
                if (!reps[todayStr]) {
                    const isScheduled = isHabitScheduledOnDate(habit, todayStr);

                    if (isScheduled) {
                        triggerNotification(habit);
                    }
                }
            }
        });

        // Check Dzikir Pagi reminder
        if (state.pagiReminderEnabled && state.pagiReminderTime === timeStr) {
            triggerDzikirNotification('pagi');
        }
        // Check Dzikir Petang reminder
        if (state.petangReminderEnabled && state.petangReminderTime === timeStr) {
            triggerDzikirNotification('petang');
        }
    }, 30000);
}

export function toggleRoutineSection(section) {
    const key = `collapsed_routine_${section}`;
    const isCollapsed = localStorage.getItem(key) === 'true';
    localStorage.setItem(key, isCollapsed ? 'false' : 'true');
    renderHabits();
}
export function showStackingCelebrationToast(habitName) {
    const container = document.getElementById('stacking-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'stacking-toast';
    toast.innerHTML = `
        <div class="stacking-toast-icon">📿</div>
        <div class="stacking-toast-content">
            <h4 class="stacking-toast-title">Alhamdulillah! Stacking Dzikir</h4>
            <p class="stacking-toast-body">Kebiasaan <b>${habitName}</b> selesai otomatis!</p>
        </div>
    `;

    container.appendChild(toast);

    // Vibrate to celebrate
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate([100, 50, 100]);
    }

    // Auto dismiss after 4 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 4000);
}

// Bind handlers to window for HTML actions compatibility
if (typeof window !== 'undefined') {
    window.checkAndTriggerLinkedHabit = checkAndTriggerLinkedHabit;
    window.showStackingCelebrationToast = showStackingCelebrationToast;
    window.openHabitModal = openHabitModal;
    window.closeHabitModal = closeHabitModal;
    window.saveHabitFromModal = saveHabitFromModal;
    window.deleteHabitFromModal = deleteHabitFromModal;
    window.openHabitDetailModal = openHabitDetailModal;
    window.closeHabitDetailModal = closeHabitDetailModal;
    window.toggleCalendarPickerDay = toggleCalendarPickerDay;
    window.navigateCalendarMonth = navigateCalendarMonth;
    window.archiveHabitFromModal = archiveHabitFromModal;
    window.restoreHabit = restoreHabit;
    window.permanentDeleteHabit = permanentDeleteHabit;
    window.toggleArchivedSection = toggleArchivedSection;
    window.toggleScheduleDaysView = toggleScheduleDaysView;
    window.exportHabitCSV = exportHabitCSV;
    window.requestNotificationPermissionAndRegister = requestNotificationPermissionAndRegister;
    window.requestNotificationPermission = requestNotificationPermission;
    window.toggleHabitNumericalFields = toggleHabitNumericalFields;
    window.openHabitLogModal = openHabitLogModal;
    window.closeHabitLogModal = closeHabitLogModal;
    window.saveHabitLogFromModal = saveHabitLogFromModal;
    window.skipHabitLogFromModal = skipHabitLogFromModal;
    window.toggleRoutineSection = toggleRoutineSection;

    // Start reminders check loop
    initRemindersTimer();
}
