/* ========================================================================= */
/* --- TasbihKu Reactive State Store (src/core/store.js) --- */
/* ========================================================================= */

import { get as idbGet, set as idbSet } from 'idb-keyval';

const STORAGE_KEY = 'tasbihKuState';

const DEFAULT_STATE = {
    freeCount: 0,
    targetLimit: 0,
    customList: [],
    customAzkar: [],
    guidedData: {},
    keepScreenOn: false,
    oledMode: false,
    userName: 'SaudaraKu',
    quoteCollapsed: false,
    activityLog: [],
    playerType: null,
    playerId: null,
    playerIndex: 0,
    playerCount: 0,
    dashboardMode: 'counting',
    arabicFontSize: 2.5,
    stopwatch: { running: false, startTime: null, elapsedTime: 0 },
    timer: { running: false, targetDuration: null, remainingTime: null },
    appMode: 'tasbih',
    habits: [],
    habitRepetitions: {},
    soundEnabled: true,
    vibrationEnabled: true,
    vibrationInterval: 0,
    pagiReminderEnabled: false,
    pagiReminderTime: "06:00",
    petangReminderEnabled: false,
    petangReminderTime: "16:00"
};

// Private raw state container
const rawState = { ...DEFAULT_STATE };

// Pub/Sub Subscribers
const subscribers = new Set();
let saveStateTimeout = null;

// Helper to notify subscribers of changes
function notifySubscribers(changedKeys) {
    for (const sub of subscribers) {
        if (typeof sub.spec === 'function') {
            sub.spec(state, changedKeys);
        } else if (typeof sub.callback === 'function') {
            const keysToWatch = Array.isArray(sub.spec) ? sub.spec : [sub.spec];
            const hasChanged = keysToWatch.some(k => changedKeys.includes(k));
            if (hasChanged) {
                sub.callback(state);
            }
        }
    }
}

// Debounced save
export function saveState() {
    if (saveStateTimeout !== null) {
        clearTimeout(saveStateTimeout);
    }
    saveStateTimeout = setTimeout(() => {
        saveStateTimeout = null;
        performSave();
    }, 300);
}

// Perform localStorage and IndexedDB write
async function performSave() {
    try {
        const dataStr = JSON.stringify(rawState);
        try { localStorage.setItem(STORAGE_KEY, dataStr); } catch(e){}
        await idbSet(STORAGE_KEY, JSON.parse(dataStr));
    } catch (e) {
        console.error('Failed to save state:', e);
        if (e.name === 'QuotaExceededError' || e.code === 22 || e.name === 'DataCloneError') {
            if (typeof window.showModal === 'function') {
                window.showModal(
                    'Penyimpanan Penuh', 
                    'Memori perangkat penuh. Silakan export backup dan bersihkan data browser untuk melanjutkan.', 
                    null, 
                    true
                );
            }
            if (rawState.activityLog && rawState.activityLog.length > 50) {
                rawState.activityLog = rawState.activityLog.slice(-50);
                try {
                    const prunedDataStr = JSON.stringify(rawState);
                    localStorage.setItem(STORAGE_KEY, prunedDataStr);
                    idbSet(STORAGE_KEY, JSON.parse(prunedDataStr)).catch(err => console.error(err));
                } catch (e2) {
                    console.error('Emergency prune failed:', e2);
                }
            }
        }
    }
}

// Exported Reactive State Proxy
// Intercepts mutations, runs subscribers, and saves state automatically.
export const state = new Proxy(rawState, {
    get(target, prop) {
        const val = target[prop];
        // Handle nested object mutations (e.g. state.stopwatch.running = true)
        if (val !== null && typeof val === 'object') {
            return new Proxy(val, {
                get(nestedTarget, nestedProp) {
                    return nestedTarget[nestedProp];
                },
                set(nestedTarget, nestedProp, nestedVal) {
                    if (nestedTarget[nestedProp] !== nestedVal) {
                        nestedTarget[nestedProp] = nestedVal;
                        notifySubscribers([prop]);
                        saveState();
                    }
                    return true;
                },
                deleteProperty(nestedTarget, nestedProp) {
                    if (nestedProp in nestedTarget) {
                        delete nestedTarget[nestedProp];
                        notifySubscribers([prop]);
                        saveState();
                    }
                    return true;
                }
            });
        }
        return val;
    },
    set(target, prop, val) {
        if (target[prop] !== val) {
            target[prop] = val;
            notifySubscribers([prop]);
            saveState();
        }
        return true;
    },
    deleteProperty(target, prop) {
        if (prop in target) {
            delete target[prop];
            notifySubscribers([prop]);
            saveState();
        }
        return true;
    }
});

/**
 * Load state from LocalStorage/IndexedDB and run migrations
 */
export async function loadState() {
    try {
        let loaded = await idbGet(STORAGE_KEY);
        if (!loaded) {
            const savedStr = localStorage.getItem(STORAGE_KEY);
            if (savedStr) {
                loaded = JSON.parse(savedStr);
            }
        }
        
        if (loaded) {
            // Merge onto rawState in-place to preserve proxy target reference
            Object.assign(rawState, DEFAULT_STATE, loaded);

            // Ensure settings defaults
            if (typeof rawState.keepScreenOn === 'undefined') rawState.keepScreenOn = false;
            if (typeof rawState.oledMode === 'undefined') rawState.oledMode = false;
            if (typeof rawState.soundEnabled === 'undefined') rawState.soundEnabled = true;
            if (typeof rawState.vibrationEnabled === 'undefined') rawState.vibrationEnabled = true;
            if (typeof rawState.vibrationInterval === 'undefined') rawState.vibrationInterval = 0;
            if (typeof rawState.arabicFontSize === 'undefined') rawState.arabicFontSize = 2.5;
            if (typeof rawState.userName === 'undefined' || rawState.userName === '') rawState.userName = 'SaudaraKu';
            if (typeof rawState.quoteCollapsed === 'undefined') rawState.quoteCollapsed = false;
            if (typeof rawState.targetLimit === 'undefined') rawState.targetLimit = 0;
            if (!Array.isArray(rawState.customAzkar)) rawState.customAzkar = [];
            if (!Array.isArray(rawState.activityLog)) rawState.activityLog = [];
            if (!rawState.guidedData) rawState.guidedData = {};
            if (typeof rawState.appMode === 'undefined') rawState.appMode = 'tasbih';
            if (!Array.isArray(rawState.habits)) rawState.habits = [];
            if (typeof rawState.habitRepetitions !== 'object' || rawState.habitRepetitions === null) rawState.habitRepetitions = {};
            if (typeof rawState.pagiReminderEnabled === 'undefined') rawState.pagiReminderEnabled = false;
            if (typeof rawState.pagiReminderTime === 'undefined') rawState.pagiReminderTime = "06:00";
            if (typeof rawState.petangReminderEnabled === 'undefined') rawState.petangReminderEnabled = false;
            if (typeof rawState.petangReminderTime === 'undefined') rawState.petangReminderTime = "16:00";

            // Migrate habits scheduling defaults
            rawState.habits.forEach(habit => {
                if (typeof habit.scheduleType === 'undefined') habit.scheduleType = 'daily';
                if (typeof habit.scheduleDays === 'undefined') habit.scheduleDays = [0, 1, 2, 3, 4, 5, 6];
                if (typeof habit.weeklyTarget === 'undefined') habit.weeklyTarget = 3;
                if (typeof habit.intervalDays === 'undefined') habit.intervalDays = 2;
                if (typeof habit.anchorDate === 'undefined') {
                    const d = habit.createdAt ? new Date(habit.createdAt) : new Date();
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const date = String(d.getDate()).padStart(2, '0');
                    habit.anchorDate = `${year}-${month}-${date}`;
                }
                if (typeof habit.reminderEnabled === 'undefined') habit.reminderEnabled = false;
                if (typeof habit.reminderTime === 'undefined') habit.reminderTime = "08:00";
                if (typeof habit.isNumerical === 'undefined') habit.isNumerical = false;
                if (typeof habit.targetValue === 'undefined') habit.targetValue = habit.isNumerical ? 100 : 1;
                if (typeof habit.targetUnit === 'undefined') habit.targetUnit = "kali";
                if (typeof habit.routineSection === 'undefined') habit.routineSection = "anytime";
                if (typeof habit.linkedDzikirId === 'undefined') habit.linkedDzikirId = null;
                if (typeof habit.currentStreak === 'undefined') habit.currentStreak = 0;
                if (typeof habit.bestStreak === 'undefined') habit.bestStreak = 0;
                if (typeof habit.strengthScore === 'undefined') habit.strengthScore = 0;
            });

            // Migrate habitRepetitions from Array to Object if needed
            if (rawState.habitRepetitions && typeof rawState.habitRepetitions === 'object') {
                for (const habitId in rawState.habitRepetitions) {
                    const reps = rawState.habitRepetitions[habitId];
                    if (Array.isArray(reps)) {
                        const migratedReps = {};
                        const habit = rawState.habits.find(h => h.id === habitId);
                        const defaultVal = habit ? (habit.targetValue || 1) : 1;
                        reps.forEach(dateStr => {
                            if (typeof dateStr === 'string') {
                                migratedReps[dateStr] = { value: defaultVal, note: "" };
                            }
                        });
                        rawState.habitRepetitions[habitId] = migratedReps;
                    }
                }
            } else {
                rawState.habitRepetitions = {};
            }

            // Prune activityLog
            if (rawState.activityLog.length > 400) {
                rawState.activityLog = rawState.activityLog.slice(-400);
            }

            // Clear stale player state on fresh app load
            rawState.playerType = null;
            rawState.playerId = null;
            rawState.playerIndex = 0;
            rawState.playerCount = 0;

            // Migration: Old single-page CustomList to multi-page format
            if (rawState.customList && Array.isArray(rawState.customList)) {
                rawState.customList = rawState.customList.map(item => {
                    if (item.pages && Array.isArray(item.pages)) return item;
                    return {
                        id: item.id || Date.now() + Math.random(),
                        name: item.name || "Custom Dzikir",
                        pages: [{
                            id: Date.now() + Math.random(),
                            arabic: "",
                            latin: "",
                            translation: "",
                            reference: "",
                            target: item.target || 33
                        }]
                    };
                });
            }

            // Daily Auto-Reset Logic
            const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
            if (rawState.lastOpenedDate && rawState.lastOpenedDate !== todayStr) {
                rawState.freeCount = 0;
            }
            rawState.lastOpenedDate = todayStr;
        }
    } catch (e) {
        console.error('Failed to load state, resetting to defaults:', e);
        localStorage.removeItem(STORAGE_KEY);
        Object.assign(rawState, DEFAULT_STATE);
    }
    
    // Initial notify
    notifySubscribers(Object.keys(rawState));
}

/**
 * Get a read-only copy of the state
 */
export function getState() {
    return JSON.parse(JSON.stringify(rawState));
}

/**
 * Update state values manually (alternative to direct mutation)
 */
export function updateState(updates, immediateSave = false) {
    const changedKeys = [];
    for (const key in updates) {
        if (Object.prototype.hasOwnProperty.call(updates, key)) {
            if (JSON.stringify(rawState[key]) !== JSON.stringify(updates[key])) {
                rawState[key] = updates[key];
                changedKeys.push(key);
            }
        }
    }

    if (changedKeys.length > 0) {
        notifySubscribers(changedKeys);
        if (immediateSave) {
            saveStateImmediate();
        } else {
            saveState();
        }
    }
}

/**
 * Subscribe to state changes
 */
export function subscribe(listenerSpec, callback) {
    const subscriber = { spec: listenerSpec, callback };
    subscribers.add(subscriber);
    return () => {
        subscribers.delete(subscriber);
    };
}

/**
 * Immediate save (bypass debounce)
 */
export function saveStateImmediate() {
    if (saveStateTimeout !== null) {
        clearTimeout(saveStateTimeout);
        saveStateTimeout = null;
    }
    performSave();
}
