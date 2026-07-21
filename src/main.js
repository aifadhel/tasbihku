/* --- TasbihKu Main Entry Orchestrator (src/main.js) --- */
/* ========================================================================= */

import '@fontsource-variable/google-sans-flex';
import '@fontsource/google-sans-code/400.css';
import '@fontsource/google-sans-code/500.css';
import '@fontsource/google-sans-code/700.css';

import { loadState, state, subscribe, saveState } from './core/store.js';
import { 
    vibrate, 
    playTapSound, 
    isVibrationSupported, 
    applyVibrationCapability 
} from './hardware/media.js';
import { 
    requestWakeLock, 
    releaseWakeLock, 
    toggleWakeLock, 
    initServiceWorker, 
    initInstallPrompt 
} from './hardware/system.js';
import { 
    incrementFree, 
    confirmResetFree,
    undoFreeReset, 
    toggleStopwatch, 
    toggleTimer, 
    resetStopwatch, 
    resetTimer, 
    updateStopwatchUI, 
    updateTimerUI, 
    promptCustomTimer, 
    closeTimeInputModal, 
    applyTimeInputModal,
    setTimerPreset,
    promptManualCount,
    promptTargetLimit,
    closeNumberInputModal,
    applyNumberInputModal
} from './modules/tasbih.js';
import { 
    startPlayer, 
    incrementPlayer, 
    playerUndo, 
    confirmResetPlayer, 
    renderCustomList, 
    openEditor 
} from './modules/dzikir.js';
import { 
    renderHabits, 
    renderStats, 
    updateStreakBadge, 
    trackActivity,
    requestNotificationPermission,
    refreshAllHabitMetricsCache
} from './modules/habits.js';
import { 
    showPage, 
    goBack,
    pageHooks, 
    showModal, 
    closeModal, 
    toggleOledMode, 
    applyOledMode, 
    toggleSoundMode, 
    toggleVibrationMode, 
    updateArabicFontSize, 
    switchAppMode, 
    switchDashboardMode, 
    exportData, 
    triggerImport, 
    importDataProcess, 
    toggleQuote, 
    applyQuoteState, 
    APP_VERSION 
} from './ui/router.js';

// Expose core store, navigation, and module APIs globally to bridge with index.html events
window.loadState = loadState;
window.state = state;
window.subscribe = subscribe;
window.saveState = saveState;
window.showPage = showPage;
window.goBack = goBack;
window.showModal = showModal;
window.closeModal = closeModal;
window.switchAppMode = switchAppMode;
window.switchDashboardMode = switchDashboardMode;
window.toggleOledMode = toggleOledMode;
window.toggleSoundMode = toggleSoundMode;
window.toggleVibrationMode = toggleVibrationMode;
window.updateArabicFontSize = updateArabicFontSize;
window.exportData = exportData;
window.triggerImport = triggerImport;
window.importDataProcess = importDataProcess;
window.toggleQuote = toggleQuote;
window.startPlayer = startPlayer;
window.openEditor = openEditor;
window.promptCustomTimer = promptCustomTimer;
window.closeTimeInputModal = closeTimeInputModal;
window.applyTimeInputModal = applyTimeInputModal;
window.handleDashboardReset = handleDashboardReset;
window.setTimerPreset = setTimerPreset;
window.toggleWakeLock = toggleWakeLock;
window.togglePagiReminder = togglePagiReminder;
window.updatePagiReminderTime = updatePagiReminderTime;
window.togglePetangReminder = togglePetangReminder;
window.updatePetangReminderTime = updatePetangReminderTime;
window.updateVibrationInterval = updateVibrationInterval;

// --- Dzikir Reminders Toggles & Time Setters ---
function togglePagiReminder(isChecked) {
    if (isChecked) {
        requestNotificationPermission(() => {
            state.pagiReminderEnabled = true;
            saveState();
            const timeEl = document.getElementById('input-pagi-reminder-time');
            if (timeEl) {
                timeEl.value = state.pagiReminderTime || "06:00";
                timeEl.style.display = 'block';
            }
        }, () => {
            const chk = document.getElementById('toggle-pagi-reminder');
            if (chk) chk.checked = false;
            state.pagiReminderEnabled = false;
            saveState();
            const timeEl = document.getElementById('input-pagi-reminder-time');
            if (timeEl) timeEl.style.display = 'none';
        });
    } else {
        state.pagiReminderEnabled = false;
        saveState();
        const timeEl = document.getElementById('input-pagi-reminder-time');
        if (timeEl) timeEl.style.display = 'none';
    }
}

function updatePagiReminderTime(timeVal) {
    if (timeVal) {
        state.pagiReminderTime = timeVal;
        saveState();
    }
}

function togglePetangReminder(isChecked) {
    if (isChecked) {
        requestNotificationPermission(() => {
            state.petangReminderEnabled = true;
            saveState();
            const timeEl = document.getElementById('input-petang-reminder-time');
            if (timeEl) {
                timeEl.value = state.petangReminderTime || "16:00";
                timeEl.style.display = 'block';
            }
        }, () => {
            const chk = document.getElementById('toggle-petang-reminder');
            if (chk) chk.checked = false;
            state.petangReminderEnabled = false;
            saveState();
            const timeEl = document.getElementById('input-petang-reminder-time');
            if (timeEl) timeEl.style.display = 'none';
        });
    } else {
        state.petangReminderEnabled = false;
        saveState();
        const timeEl = document.getElementById('input-petang-reminder-time');
        if (timeEl) timeEl.style.display = 'none';
    }
}

function updatePetangReminderTime(timeVal) {
    if (timeVal) {
        state.petangReminderTime = timeVal;
        saveState();
    }
}

function updateVibrationInterval(val) {
    state.vibrationInterval = parseInt(val) || 0;
    saveState();
}

// --- Dashboard Helper Actions ---
function handleDashboardMainBtn() {
    trackActivity();
    if (state.dashboardMode === 'counting') {
        incrementFree();
    } else if (state.dashboardMode === 'stopwatch') {
        toggleStopwatch();
    } else if (state.dashboardMode === 'timer') {
        toggleTimer();
    }
}

function handleDashboardReset() {
    if (state.dashboardMode === 'counting') {
        const freeCounterEl = document.getElementById('free-counter');
        const count = freeCounterEl ? parseInt(freeCounterEl.innerText) || 0 : 0;
        if (count > 0) {
            // Confirm free counter reset
            confirmResetFree();
        }
    } else if (state.dashboardMode === 'stopwatch') {
        resetStopwatch();
    } else if (state.dashboardMode === 'timer') {
        resetTimer();
    }
}

// Bind reset globally for index.html onclick
window.handleDashboardMainBtn = handleDashboardMainBtn;
window.handleDashboardReset = handleDashboardReset;
window.promptManualCount = promptManualCount;
window.promptTargetLimit = promptTargetLimit;
window.closeNumberInputModal = closeNumberInputModal;
window.applyNumberInputModal = applyNumberInputModal;

// --- Set Up Page hooks to avoid circular imports ---
pageHooks['page-menu'] = () => {
    renderCustomList();
};
pageHooks['page-dashboard'] = () => {
    if (state.appMode === 'tasbih') {
        const tasbihView = document.getElementById('tasbih-dashboard-view');
        const habitView = document.getElementById('habit-dashboard-view');
        if (tasbihView) tasbihView.style.display = 'flex';
        if (habitView) habitView.style.display = 'none';
        if (state.keepScreenOn) requestWakeLock();
    } else if (state.appMode === 'habit') {
        const tasbihView = document.getElementById('tasbih-dashboard-view');
        const habitView = document.getElementById('habit-dashboard-view');
        if (tasbihView) tasbihView.style.display = 'none';
        if (habitView) habitView.style.display = 'flex';
        releaseWakeLock();
        renderHabits();
    }
    renderStats();
};

// --- Reactive State Subscriptions ---
subscribe('freeCount', (state) => {
    const el = document.getElementById('free-counter');
    if (el) el.innerText = state.freeCount;
});
subscribe('targetLimit', (state) => {
    const el = document.getElementById('free-target-display');
    if (el) {
        el.innerText = state.targetLimit > 0 ? state.targetLimit : '∞';
    }
});
subscribe('userName', (state) => {
    const el = document.getElementById('username-input');
    if (el) el.value = state.userName;
});
subscribe('activityLog', () => {
    renderStats();
    updateStreakBadge();
});
subscribe(['habits', 'habitRepetitions'], () => {
    renderHabits();
});
subscribe('vibrationInterval', (state) => {
    const el = document.getElementById('select-vibration-interval');
    if (el) el.value = state.vibrationInterval || 0;
});
subscribe('vibrationEnabled', (state) => {
    const el = document.getElementById('select-vibration-interval');
    if (el) el.disabled = !state.vibrationEnabled;
});

// --- Initialization on DomContentLoaded ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initial State Loading
    await loadState();
    if (typeof refreshAllHabitMetricsCache === 'function') {
        refreshAllHabitMetricsCache();
    }

    // 2. Setup inputs and listeners
    const nameInput = document.getElementById('username-input');
    if (nameInput) {
        nameInput.value = state.userName;
        nameInput.addEventListener('input', (e) => {
            state.userName = e.target.value;
            saveState();
        });
    }

    const fileInput = document.getElementById('import-file');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            importDataProcess(file);
        });
    }

    // 3. Setup settings checkboxes
    const toggleOledEl = document.getElementById('toggle-oled');
    if (toggleOledEl) toggleOledEl.checked = state.oledMode;

    const toggleSoundEl = document.getElementById('toggle-sound');
    if (toggleSoundEl) toggleSoundEl.checked = state.soundEnabled;

    const toggleVibrEl = document.getElementById('toggle-vibration');
    if (toggleVibrEl) toggleVibrEl.checked = state.vibrationEnabled;

    const selectVibrIntervalEl = document.getElementById('select-vibration-interval');
    if (selectVibrIntervalEl) {
        selectVibrIntervalEl.value = state.vibrationInterval || 0;
        selectVibrIntervalEl.disabled = !state.vibrationEnabled;
    }

    const togglePagiEl = document.getElementById('toggle-pagi-reminder');
    if (togglePagiEl) {
        togglePagiEl.checked = !!state.pagiReminderEnabled;
        const timeEl = document.getElementById('input-pagi-reminder-time');
        if (timeEl) {
            timeEl.value = state.pagiReminderTime || "06:00";
            timeEl.style.display = state.pagiReminderEnabled ? 'block' : 'none';
        }
    }

    const togglePetangEl = document.getElementById('toggle-petang-reminder');
    if (togglePetangEl) {
        togglePetangEl.checked = !!state.petangReminderEnabled;
        const timeEl = document.getElementById('input-petang-reminder-time');
        if (timeEl) {
            timeEl.value = state.petangReminderTime || "16:00";
            timeEl.style.display = state.petangReminderEnabled ? 'block' : 'none';
        }
    }

    const toggleWakelockEl = document.getElementById('toggle-wakelock');
    if (toggleWakelockEl) {
        toggleWakelockEl.checked = state.keepScreenOn;
        toggleWakelockEl.addEventListener('change', (e) => {
            toggleWakeLock(e.target.checked);
        });
    }

    // 4. Set UI Options based on state
    applyOledMode(state.oledMode);
    applyVibrationCapability();
    updateArabicFontSize(state.arabicFontSize, false);
    applyQuoteState();

    // 5. Initial App Mode & Dashboard Mode Setup
    switchDashboardMode(state.dashboardMode || 'counting');
    switchAppMode(state.appMode || 'tasbih', false);

    // 6. Navigation Router Setup
    handleHashRouting();

    // 7. Install SW and PWA Prompting
    initServiceWorker();
    initInstallPrompt();

    // 8. Bind App Version Label
    const versionEl = document.getElementById('app-version');
    if (versionEl) {
        versionEl.textContent = `tasbihku-v${APP_VERSION}`;
    }
    const aboutVersionEl = document.getElementById('about-app-version');
    if (aboutVersionEl) {
        aboutVersionEl.textContent = `TasbihKu v${APP_VERSION}`;
    }
});

// --- Hash & Path Navigation Router ---
function handleHashRouting() {
    let startPage = 'page-dashboard';
    const pathname = window.location.pathname.replace(/\/$/, '') || '/';
    const hash = window.location.hash;

    if (pathname === '/about' || hash === '#page-about') {
        startPage = 'page-about';
    } else if (hash === '#page-player-pagi') {
        startPage = 'page-player';
        setTimeout(() => {
            switchAppMode('tasbih', false);
            if (typeof window.startPlayer === 'function') {
                window.startPlayer('pagi');
            }
        }, 100);
    } else if (hash === '#page-player-petang') {
        startPage = 'page-player';
        setTimeout(() => {
            switchAppMode('tasbih', false);
            if (typeof window.startPlayer === 'function') {
                window.startPlayer('petang');
            }
        }, 100);
    } else if (hash === '#page-menu') {
        startPage = 'page-menu';
        switchAppMode('tasbih', false);
    } else if (hash === '#page-dashboard-timer') {
        startPage = 'page-dashboard';
        switchAppMode('tasbih', false);
        switchDashboardMode('timer');
    } else if (hash === '#page-dashboard-habit') {
        startPage = 'page-dashboard';
        switchAppMode('habit', false);
    } else if (history.state && history.state.pageId) {
        startPage = history.state.pageId;
    }

    const targetUrl = startPage === 'page-about' ? '/about' : (startPage === 'page-dashboard' && !hash ? '/' : `#${startPage}`);
    history.replaceState({ pageId: startPage }, "", targetUrl);
    showPage(startPage, false);
}

window.addEventListener('hashchange', () => {
    handleHashRouting();
});

// --- Keyboard & Keybindings Orchestration ---
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const dashboardActive = document.getElementById('page-dashboard').classList.contains('active');
    const playerActive = document.getElementById('page-player').classList.contains('active');

    // Space or Enter to increment/start/stop
    if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (dashboardActive) {
            handleDashboardMainBtn();
        } else if (playerActive) {
            incrementPlayer();
        }
    }

    // Ctrl+Z or Cmd+Z to undo
    if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (dashboardActive && state.dashboardMode === 'counting') {
            undoFreeReset();
        } else if (playerActive) {
            playerUndo();
        }
    }
});

// --- Touch Gestures Orchestration (Swipe & Double-Tap & Long-Press) ---
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
let lastTapTime = 0;
let longPressTimer = null;
const SWIPE_THRESHOLD = 50;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    
    const target = e.target.closest('#dashboard-main-btn, #player-main-btn');
    if (target) {
        // Double tap detection
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTapTime;
        
        if (tapLength < 300 && tapLength > 0) {
            if (e.cancelable) e.preventDefault();
            
            if (target.id === 'dashboard-main-btn' && state.dashboardMode === 'counting') {
                incrementFree();
            } else if (target.id === 'player-main-btn') {
                incrementPlayer();
            }
        }
        lastTapTime = currentTime;
        
        // Long press detection
        longPressTimer = setTimeout(() => {
            vibrate([50, 50, 50]);
            showPage('page-menu');
        }, 800);
    }
}, { passive: false });

document.addEventListener('touchmove', () => {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
}, { passive: true });

document.addEventListener('touchend', (e) => {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }

    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    
    handleSwipeGesture();
}, { passive: true });

function handleSwipeGesture() {
    const diffX = touchEndX - touchStartX;
    const diffY = Math.abs(touchEndY - touchStartY);
    
    if (Math.abs(diffX) > SWIPE_THRESHOLD && diffY < SWIPE_THRESHOLD) {
        const dashboardActive = document.getElementById('page-dashboard').classList.contains('active');
        const playerActive = document.getElementById('page-player').classList.contains('active');
        
        if (dashboardActive && state.dashboardMode === 'counting') {
            undoFreeReset();
        } else if (playerActive) {
            playerUndo();
        }
    }
}

// --- Stealth Mode & Fullscreen ---
window.toggleFullscreen = function() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
};

window.toggleStealthMode = function() {
    document.body.classList.toggle('stealth-mode');
};
