import { state, saveState } from '../core/store.js';

// --- Date Helper Functions ---
export function getLocalDateString(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
}

export function getDiffDays(d1, d2) {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    date1.setHours(12, 0, 0, 0);
    date2.setHours(12, 0, 0, 0);
    return Math.round((date1 - date2) / 86400000);
}

export function getTodayDate() {
    return getLocalDateString();
}

export function getPreviousDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() - 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getRecentDates() {
    const dates = [];
    const daysIndo = ["Ahd", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    
    for (let i = 4; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        
        const dateStr = getLocalDateString(d);
        
        let label = "";
        if (i === 0) label = "Hi";
        else if (i === 1) label = "Km";
        else label = daysIndo[d.getDay()];
        
        dates.push({ dateStr, label, isToday: i === 0 });
    }
    return dates;
}

// --- Activity Tracking & Global Streak Math ---
export function trackActivity() {
    const today = getTodayDate();
    if (!state.activityLog.includes(today)) {
        state.activityLog.push(today);
        saveState();
        return true; // indicates activity was added
    }
    return false;
}

export function calculateStreak() {
    if (!state.activityLog || state.activityLog.length === 0) return 0;

    const uniqueDates = [...new Set(state.activityLog)].sort();
    const today = getTodayDate();
    const yesterday = getPreviousDate(today);

    if (!uniqueDates.includes(today) && !uniqueDates.includes(yesterday)) return 0;

    let streak = 0;
    let currentDate = uniqueDates.includes(today) ? today : yesterday;

    while (true) {
        if (uniqueDates.includes(currentDate)) {
            streak++;
            currentDate = getPreviousDate(currentDate);
        } else break;
    }
    return streak;
}

// --- Shared Scheduling Helpers ---
export function isHabitScheduledOnDate(habit, dateStr) {
    const [yr, mo, dy] = dateStr.split('-').map(Number);
    const dateObj = new Date(yr, mo - 1, dy);
    const dayOfWeek = dateObj.getDay();
    const diffDays = getDiffDays(dateObj, habit.anchorDate || getLocalDateString());

    if (habit.scheduleType === 'daily') return true;
    if (habit.scheduleType === 'weekly') return true;
    if (habit.scheduleType === 'specific') {
        return !!(habit.scheduleDays && habit.scheduleDays.includes(dayOfWeek));
    }
    if (habit.scheduleType === 'interval') {
        return diffDays >= 0 && diffDays % (habit.intervalDays || 2) === 0;
    }
    return true; // default
}

export function getHabitFrequency(habit) {
    if (habit.scheduleType === 'specific') {
        return (habit.scheduleDays ? habit.scheduleDays.length : 7) / 7.0;
    }
    if (habit.scheduleType === 'weekly') {
        return (habit.weeklyTarget || 3) / 7.0;
    }
    if (habit.scheduleType === 'interval') {
        return 1.0 / (habit.intervalDays || 2);
    }
    return 1.0; // daily
}

export function getHabitCompletionStatus(habit, entry) {
    if (!entry) return { completed: false, partial: false, skipped: false, value: 0 };
    if (entry.skipped) return { completed: false, partial: false, skipped: true, value: 0 };
    
    const value = entry.value || 0;
    const completed = !habit.isNumerical || value >= habit.targetValue;
    const partial = habit.isNumerical && value < habit.targetValue && value > 0;
    
    return { completed, partial, skipped: false, value };
}

export function isHabitSkippedOn(habitId, dateStr) {
    const reps = state.habitRepetitions[habitId] || {};
    const entry = reps[dateStr];
    return !!(entry && entry.skipped);
}

export function calculateHabitStrength(habit) {
    const repetitions = state.habitRepetitions[habit.id] || {};
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
        if (created > start) {
            start = created;
        }
    }
    
    let score = 0.0;
    let tempDate = new Date(start);
    tempDate.setHours(12, 0, 0, 0);
    
    while (tempDate <= today) {
        const dateStr = getLocalDateString(tempDate);
        const isScheduled = isHabitScheduledOnDate(habit, dateStr);
        
        if (isScheduled) {
            const entry = repetitions[dateStr];
            let completed = 0;
            let isSkipped = false;
            if (entry) {
                if (entry.skipped) {
                    isSkipped = true;
                } else if (habit.isNumerical) {
                    completed = Math.min(1.0, (entry.value || 0) / (habit.targetValue || 1));
                } else {
                    completed = 1.0;
                }
            }
            
            if (!isSkipped) {
                score = score * multiplier + completed * (1 - multiplier);
            }
        }
        tempDate.setDate(tempDate.getDate() + 1);
        tempDate.setHours(12, 0, 0, 0);
    }
    
    return Math.round(score * 100);
}

export function getHabitStreaks(habitId) {
    const habit = state.habits.find(h => h.id === habitId);
    if (!habit) return { current: 0, best: 0 };
    
    const repetitions = state.habitRepetitions[habitId] || {};
    const keys = Object.keys(repetitions);
    if (keys.length === 0) return { current: 0, best: 0 };
    
    if (habit.scheduleType === 'weekly') {
        const target = habit.weeklyTarget || 3;
        const weeklyCompletions = {};
        
        keys.forEach(dateStr => {
            const entry = repetitions[dateStr];
            const { completed: isCompleted } = getHabitCompletionStatus(habit, entry);
            if (isCompleted) {
                const [yr, mo, dy] = dateStr.split('-').map(Number);
                const date = new Date(yr, mo - 1, dy);
                const day = date.getDay();
                const sunday = new Date(date);
                sunday.setDate(date.getDate() - day);
                const sunStr = getLocalDateString(sunday);
                
                weeklyCompletions[sunStr] = (weeklyCompletions[sunStr] || 0) + 1;
            }
        });
        
        let start = new Date(habit.createdAt || Date.now());
        start.setDate(start.getDate() - start.getDay());
        start.setHours(12, 0, 0, 0);
        
        const today = new Date();
        const todayDay = today.getDay();
        const todaySunday = new Date(today);
        todaySunday.setDate(today.getDate() - todayDay);
        todaySunday.setHours(12, 0, 0, 0);
        
        let runningStreak = 0;
        let bestStreak = 0;
        let tempSunday = new Date(start);
        
        while (tempSunday <= todaySunday) {
            const sunStr = getLocalDateString(tempSunday);
            const count = weeklyCompletions[sunStr] || 0;
            const isCurrentWeek = tempSunday.getTime() === todaySunday.getTime();
            
            if (count >= target) {
                runningStreak++;
                if (runningStreak > bestStreak) bestStreak = runningStreak;
            } else {
                if (!isCurrentWeek) {
                    runningStreak = 0;
                }
            }
            
            tempSunday.setDate(tempSunday.getDate() + 7);
            tempSunday.setHours(12, 0, 0, 0);
        }
        
        return { current: runningStreak, best: Math.max(bestStreak, runningStreak) };
    }

    const sortedReps = keys.sort((a, b) => new Date(a) - new Date(b));
    let start = new Date(habit.createdAt || Date.now());
    if (sortedReps.length > 0) {
        const oldestCheck = new Date(sortedReps[0]);
        if (oldestCheck < start) {
            start = oldestCheck;
        }
    }
    start.setHours(12, 0, 0, 0);
    
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    
    const frequency = getHabitFrequency(habit);
    const multiplier = Math.pow(0.5, frequency / 13.0);
    
    let runningStreak = 0;
    let bestStreak = 0;
    let graceUsed = false;
    let runningScore = 0.0;
    
    let tempDate = new Date(start);
    tempDate.setHours(12, 0, 0, 0);
    
    while (tempDate <= today) {
        const dateStr = getLocalDateString(tempDate);
        const isScheduled = isHabitScheduledOnDate(habit, dateStr);
        
        if (isScheduled) {
            const entry = repetitions[dateStr];
            const { completed: isCompleted, skipped: isSkipped } = getHabitCompletionStatus(habit, entry);
            
            if (!isSkipped) {
                runningScore = runningScore * multiplier + (isCompleted ? 1 : 0) * (1 - multiplier);
            }
            
            if (isCompleted) {
                runningStreak++;
                graceUsed = false;
                if (runningStreak > bestStreak) {
                    bestStreak = runningStreak;
                }
            } else if (!isSkipped) {
                const isToday = tempDate.getTime() === today.getTime();
                if (!isToday) {
                    if (!graceUsed && (runningScore * 100) >= 80) {
                        graceUsed = true;
                    } else {
                        runningStreak = 0;
                        graceUsed = false;
                    }
                }
            }
        }
        
        tempDate.setDate(tempDate.getDate() + 1);
        tempDate.setHours(12, 0, 0, 0);
    }
    
    return { current: runningStreak, best: Math.max(bestStreak, runningStreak) };
}

export function isHabitCompletedOn(habitId, dateStr) {
    const repetitions = state.habitRepetitions[habitId] || {};
    const entry = repetitions[dateStr];
    if (!entry) return false;
    
    const habit = state.habits.find(h => h.id === habitId);
    if (!habit) return false;
    
    return getHabitCompletionStatus(habit, entry).completed;
}

export function generateHabitCSVData(habit, reps) {
    const keys = Object.keys(reps || {});
    const sortedDates = [...keys].sort((a, b) => new Date(a) - new Date(b));
    
    let csvContent = "Tanggal,Status,Nilai,Catatan\n";
    if (sortedDates.length === 0) {
        csvContent += "Tidak ada data,,,\n";
    } else {
        sortedDates.forEach(dateStr => {
            const entry = reps[dateStr];
            const { completed: isCompleted, partial: isPartial, skipped: isSkipped } = getHabitCompletionStatus(habit, entry);
            let statusText = "Belum";
            if (isCompleted) statusText = "Selesai";
            else if (isSkipped) statusText = "Dilewati";
            else if (isPartial) statusText = "Sebagian";
            const val = entry && entry.value !== undefined ? entry.value : 0;
            const note = entry && entry.note ? entry.note.replace(/"/g, '""') : "";
            csvContent += `${dateStr},${statusText},${val},"${note}"\n`;
        });
    }
    return csvContent;
}

export function updateHabitMetricsCache(habit) {
    if (!habit) return;
    const streaks = getHabitStreaks(habit.id);
    const strength = calculateHabitStrength(habit);
    
    habit.currentStreak = streaks.current;
    habit.bestStreak = streaks.best;
    habit.strengthScore = strength;
}

export function refreshAllHabitMetricsCache() {
    if (!state.habits) return;
    state.habits.forEach(habit => {
        updateHabitMetricsCache(habit);
    });
}

export function checkAndTriggerLinkedHabit(linkedId) {
    if (!state.habits) return [];
    const todayStr = getLocalDateString();
    let updatedAny = false;
    const completedHabits = [];
    
    state.habits.forEach(habit => {
        if (!habit.archived && habit.linkedDzikirId === linkedId) {
            if (!state.habitRepetitions[habit.id]) {
                state.habitRepetitions[habit.id] = {};
            }
            const reps = state.habitRepetitions[habit.id];
            const entry = reps[todayStr];
            
            const isAlreadyCompleted = entry && (habit.isNumerical ? entry.value >= habit.targetValue : !entry.skipped);
            
            if (!isAlreadyCompleted) {
                reps[todayStr] = {
                    value: habit.isNumerical ? (habit.targetValue || 100) : 1,
                    note: entry && entry.note ? entry.note : "Otomatis via Dzikir Stacking"
                };
                
                state.habitRepetitions[habit.id] = reps;
                updateHabitMetricsCache(habit);
                completedHabits.push(habit.name);
                updatedAny = true;
            }
        }
    });
    
    if (updatedAny) {
        saveState();
    }
    return completedHabits;
}

