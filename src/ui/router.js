/* ========================================================================= */
/* --- TasbihKu UI Router Module (src/ui/router.js) --- */
/* ========================================================================= */

import { state, saveState, updateState } from '../core/store.js';
import { playTapSound, isVibrationSupported, showSoundHint, vibrate } from '../hardware/media.js';
import { requestWakeLock, releaseWakeLock } from '../hardware/system.js';
import { stopStopwatch, stopTimer, updateStopwatchUI, updateTimerUI } from '../modules/tasbih.js';
import { renderHabits, renderStats } from '../modules/habits.js';

export const APP_VERSION = '1.7.6';

export const SVG_ICONS = {
    tap: `<svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor"><path d="M9 11.24V7.5a2.5 2.5 0 0 1 5 0v3.74c1.21-.81 2-2.18 2-3.74C16 4.46 13.54 2 10.5 2S5 4.46 5 7.5c0 1.56.79 2.93 2 3.74zm12.3 3.65c-.2-.6-.7-.95-1.3-.95h-2.5v-2.73c0-.67-.58-1.21-1.3-1.21-.72 0-1.3.54-1.3 1.21v5.79h-1.3v-4.58c0-.67-.58-1.21-1.3-1.21-.72 0-1.3.54-1.3 1.21v4.58H9.9v-2.16c0-.67-.58-1.21-1.3-1.21-.72 0-1.3.54-1.3 1.21v5.3c0 2.21 1.79 4 4 4h5.2c1.78 0 3.29-1.18 3.79-2.87l1.01-3.34c.2-.67-.01-1.41-.5-1.92z"/></svg>`,
    pause: `<svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`,
    play: `<svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
    fire: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: middle; margin-right: 4px; color: #ff9a56;"><path d="M12 18c-3.1 0-5-1.9-5-4.5C7 10.9 9.3 7 12 3c2.7 4 5 7.9 5 10.5 0 2.6-1.9 4.5-5 4.5z"/></svg>`,
    arrowUp: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: middle;"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z"/></svg>`,
    arrowDown: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: middle;"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>`,
    calendar: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: middle;"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z"/></svg>`,
    dragGrip: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: middle; opacity: 0.4; cursor: grab; padding: 2px;"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>`
};

// Page routing hooks registry
export const pageHooks = {};

// --- Router Navigation ---
let internalHistoryStack = [];

export function showPage(pageId, pushToHistory = true) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    setTimeout(() => {
        const pageEl = document.getElementById(pageId);
        if (pageEl) pageEl.classList.add('active');
    }, 50);

    // Run registered page hooks
    if (typeof pageHooks[pageId] === 'function') {
        pageHooks[pageId]();
    }

    if (pushToHistory) {
        history.pushState({ pageId }, '', '');
        internalHistoryStack.push(pageId);
    }
}

// Global popstate back navigation support
window.addEventListener('popstate', (e) => {
    internalHistoryStack.pop();

    if (window.isHabitDetailModalOpen && typeof window.closeHabitDetailModal === 'function') {
        window.closeHabitDetailModal(true);
        // If the state pageId matches the current active page, we don't need to re-show it.
        // But to be safe, we can let it fall through or just return.
        // Usually, closing the modal is enough because the dashboard is already beneath it.
        return;
    }

    if (e.state && e.state.pageId) {
        showPage(e.state.pageId, false);
    } else {
        showPage('page-dashboard', false);
    }
});

export function goBack(fallbackPage = 'page-dashboard') {
    if (internalHistoryStack.length > 0) {
        history.back();
    } else {
        history.replaceState({ pageId: fallbackPage }, '', '');
        showPage(fallbackPage, false);
    }
}

// --- Modal Popup Dialogs ---
let currentModalCallback = null;
let currentModalCancelCallback = null;

export function showModal(title, message, yesCallback, isAlert = false, noCallback = null) {
    const titleEl = document.getElementById('modal-title');
    const msgEl = document.getElementById('modal-message');
    const yesBtn = document.getElementById('modal-btn-yes');
    const overlay = document.getElementById('modal-overlay');

    if (titleEl) titleEl.innerText = title;
    if (msgEl) msgEl.innerText = message;
    if (yesBtn) {
        yesBtn.innerText = isAlert ? "OK" : "Ya";
        yesBtn.onclick = () => {
            const yesCb = currentModalCallback;
            currentModalCallback = null;
            currentModalCancelCallback = null;
            closeModal();
            if (yesCb) yesCb();
        };
    }
    currentModalCallback = yesCallback;
    currentModalCancelCallback = noCallback;

    if (overlay) overlay.classList.add('active');
}

export function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.remove('active');
    currentModalCallback = null;
    if (currentModalCancelCallback) {
        const cancelCb = currentModalCancelCallback;
        currentModalCancelCallback = null;
        cancelCb();
    }
}

// ESC Key dismiss handling
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modalOverlay = document.getElementById('modal-overlay');
        const timeModalOverlay = document.getElementById('time-input-modal');
        const habitModal = document.getElementById('habit-modal');
        const habitDetailModal = document.getElementById('habit-detail-modal');
        const habitLogModal = document.getElementById('habit-log-modal');
        const libraryModal = document.getElementById('library-modal');
        const customAzkarModal = document.getElementById('custom-azkar-modal');
        
        if (modalOverlay && modalOverlay.classList.contains('active')) {
            closeModal();
        } else if (timeModalOverlay && timeModalOverlay.classList.contains('active')) {
            timeModalOverlay.classList.remove('active');
        } else if (customAzkarModal && customAzkarModal.classList.contains('active')) {
            if (typeof window.closeCustomAzkarModal === 'function') window.closeCustomAzkarModal();
        } else if (libraryModal && libraryModal.classList.contains('active')) {
            if (typeof window.closeLibraryModal === 'function') window.closeLibraryModal();
        } else if (habitLogModal && habitLogModal.classList.contains('active')) {
            if (typeof window.closeHabitLogModal === 'function') window.closeHabitLogModal();
        } else if (habitModal && habitModal.classList.contains('active')) {
            if (typeof window.closeHabitModal === 'function') window.closeHabitModal();
        } else if (habitDetailModal && habitDetailModal.classList.contains('active')) {
            if (typeof window.closeHabitDetailModal === 'function') window.closeHabitDetailModal();
        }
    }
});

// Backdrop click dismiss handling
document.addEventListener('click', (e) => {
    const modalOverlay = document.getElementById('modal-overlay');
    const timeModalOverlay = document.getElementById('time-input-modal');
    const habitModal = document.getElementById('habit-modal');
    const habitDetailModal = document.getElementById('habit-detail-modal');
    const habitLogModal = document.getElementById('habit-log-modal');
    const libraryModal = document.getElementById('library-modal');
    const customAzkarModal = document.getElementById('custom-azkar-modal');
    
    if (modalOverlay && modalOverlay.classList.contains('active') && e.target === modalOverlay) {
        closeModal();
    } else if (timeModalOverlay && timeModalOverlay.classList.contains('active') && e.target === timeModalOverlay) {
        timeModalOverlay.classList.remove('active');
    } else if (customAzkarModal && customAzkarModal.classList.contains('active') && e.target === customAzkarModal) {
        if (typeof window.closeCustomAzkarModal === 'function') window.closeCustomAzkarModal();
    } else if (libraryModal && libraryModal.classList.contains('active') && e.target === libraryModal) {
        if (typeof window.closeLibraryModal === 'function') window.closeLibraryModal();
    } else if (habitLogModal && habitLogModal.classList.contains('active') && e.target === habitLogModal) {
        if (typeof window.closeHabitLogModal === 'function') window.closeHabitLogModal();
    } else if (habitModal && habitModal.classList.contains('active') && e.target === habitModal) {
        if (typeof window.closeHabitModal === 'function') window.closeHabitModal();
    } else if (habitDetailModal && habitDetailModal.classList.contains('active') && e.target === habitDetailModal) {
        if (typeof window.closeHabitDetailModal === 'function') window.closeHabitDetailModal();
    }
});

// --- Settings & Configuration toggles ---
export function toggleOledMode(isChecked) {
    state.oledMode = isChecked;
    saveState();
    applyOledMode(isChecked);
}

export function applyOledMode(isOled) {
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (isOled) {
        document.body.classList.add('oled-mode');
        if (metaTheme) metaTheme.setAttribute('content', '#000000');
    } else {
        document.body.classList.remove('oled-mode');
        if (metaTheme) metaTheme.setAttribute('content', '#0e1b15');
    }
}

export function toggleSoundMode(isChecked) {
    const soundFailed = window.soundSystemFailed || false; // Safe fallback
    if (isChecked && soundFailed) {
        const toggleEl = document.getElementById('toggle-sound');
        if (toggleEl) toggleEl.checked = false;
        showModal(
            'Audio Tidak Tersedia', 
            'Browser atau perangkat ini memblokir audio. Coba muat ulang halaman atau izinkan audio di pengaturan browser.', 
            null, 
            true
        );
        return;
    }
    state.soundEnabled = isChecked;
    saveState();
    if (isChecked) {
        playTapSound();
        showSoundHint();
    } else {
        const hintEl = document.getElementById('sound-device-hint');
        if (hintEl) hintEl.style.display = 'none';
    }
}

export function toggleVibrationMode(isChecked) {
    if (isChecked && !isVibrationSupported()) {
        const toggleEl = document.getElementById('toggle-vibration');
        if (toggleEl) toggleEl.checked = false;
        showModal('Getaran Tidak Didukung', 'Perangkat atau browser ini tidak mendukung getaran (haptic).', null, true);
        return;
    }
    state.vibrationEnabled = isChecked;
    saveState();
    
    const selectVibrIntervalEl = document.getElementById('select-vibration-interval');
    if (selectVibrIntervalEl) {
        selectVibrIntervalEl.disabled = !isChecked;
    }
    
    if (isChecked) {
        vibrate([30, 50, 30]);
    }
}

export function updateArabicFontSize(size, shouldSave = true) {
    state.arabicFontSize = parseFloat(size);
    document.documentElement.style.setProperty('--arabic-font-size', `${size}rem`);
    
    const label = document.getElementById('arabic-size-label');
    if (label) label.textContent = `${size}rem`;
    
    const slider = document.getElementById('slider-arabic-size');
    if (slider) slider.value = size;

    if (shouldSave) saveState();
}

// --- Micro-Animations ---
export function animateValue(id, value) {
    const obj = document.getElementById(id);
    if (obj) {
        obj.innerText = value;
        obj.classList.remove('count-pop-animation');
        // Force browser reflow to restart keyframe animation
        void obj.offsetWidth;
        obj.classList.add('count-pop-animation');
    }
}

export function triggerCelebration() {
    const playerPage = document.getElementById('page-player');
    if (playerPage) {
        playerPage.classList.add('celebrate-heartbeat');
        setTimeout(() => {
            playerPage.classList.remove('celebrate-heartbeat');
        }, 800);
    }
}

// --- App Mode Routing (Tasbih vs Habits) ---
export function switchAppMode(mode, save = true) {
    state.appMode = mode;
    if (save) saveState();

    const tasbihBtn = document.getElementById('mode-tasbih-btn');
    const habitBtn = document.getElementById('mode-habit-btn');
    if (tasbihBtn && habitBtn) {
        if (mode === 'tasbih') {
            tasbihBtn.classList.add('active');
            habitBtn.classList.remove('active');
        } else {
            habitBtn.classList.add('active');
            tasbihBtn.classList.remove('active');
        }
    }

    const tasbihView = document.getElementById('tasbih-dashboard-view');
    const habitView = document.getElementById('habit-dashboard-view');
    if (tasbihView && habitView) {
        if (mode === 'tasbih') {
            tasbihView.style.display = 'flex';
            habitView.style.display = 'none';
            if (state.keepScreenOn) requestWakeLock();
        } else {
            tasbihView.style.display = 'none';
            habitView.style.display = 'flex';
            releaseWakeLock();
            renderHabits();
        }
    }

    // Update Menu specific content
    const menuTitle = document.getElementById('menu-page-title');
    const menuTasbihSections = document.getElementById('menu-tasbih-sections');
    const menuItemSound = document.getElementById('menu-item-sound');
    const menuItemSoundHint = document.getElementById('sound-device-hint');
    const menuItemArabicSize = document.getElementById('menu-item-arabic-size');
    const menuTasbihReminders = document.getElementById('menu-tasbih-reminders');

    if (mode === 'tasbih') {
        if (menuTitle) menuTitle.innerText = 'Pilih Dzikir';
        if (menuTasbihSections) menuTasbihSections.style.display = 'block';
        if (menuItemSound) menuItemSound.style.display = 'flex';
        if (menuItemArabicSize) menuItemArabicSize.style.display = 'flex';
        if (menuTasbihReminders) menuTasbihReminders.style.display = 'block';
    } else {
        if (menuTitle) menuTitle.innerText = 'Pengaturan';
        if (menuTasbihSections) menuTasbihSections.style.display = 'none';
        if (menuItemSound) menuItemSound.style.display = 'none';
        if (menuItemSoundHint) menuItemSoundHint.style.display = 'none';
        if (menuItemArabicSize) menuItemArabicSize.style.display = 'none';
        if (menuTasbihReminders) menuTasbihReminders.style.display = 'none';
    }
}

export function switchDashboardMode(mode) {
    document.querySelectorAll('.segment-btn').forEach(btn => btn.classList.remove('active'));

    const activeBtn = document.querySelector(`[data-mode="${mode}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    state.dashboardMode = mode;
    saveState();

    const titleEl = document.getElementById('dashboard-mode-title');
    const freeCounterArea = document.getElementById('counting-display-area');
    const stopwatchDisplayArea = document.getElementById('stopwatch-display-area');
    const timerDisplayArea = document.getElementById('timer-display-area');

    if (freeCounterArea) freeCounterArea.style.display = 'none';
    if (stopwatchDisplayArea) stopwatchDisplayArea.style.display = 'none';
    if (timerDisplayArea) timerDisplayArea.style.display = 'none';
    
    stopStopwatch();
    stopTimer();

    if (mode === 'counting') {
        if (freeCounterArea) freeCounterArea.style.display = 'block';
        if (titleEl) titleEl.innerText = 'Hitungan Bebas';
        // Restore TAP button (stopStopwatch/stopTimer override it to START)
        const emojiEl = document.getElementById('dashboard-main-emoji');
        const labelEl = document.getElementById('dashboard-main-label');
        const btnEl = document.getElementById('dashboard-main-btn');
        if (emojiEl) emojiEl.innerHTML = SVG_ICONS.tap;
        if (labelEl) labelEl.innerText = 'TAP';
        if (btnEl) btnEl.style.background = 'linear-gradient(135deg, var(--md-sys-color-primary) 0%, #6bc7a0 100%)';
    } else if (mode === 'stopwatch') {
        if (stopwatchDisplayArea) stopwatchDisplayArea.style.display = 'block';
        if (titleEl) titleEl.innerText = 'Stopwatch';
        updateStopwatchUI();
    } else if (mode === 'timer') {
        if (timerDisplayArea) timerDisplayArea.style.display = 'block';
        if (titleEl) titleEl.innerText = 'Timer';
        updateTimerUI();
    }
}

// --- Backup Export/Import Data Management ---
export function exportData() {
    try {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `tasbihku_backup_${new Date().toISOString().slice(0,10)}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        vibrate([50, 50]);
    } catch (e) {
        showModal('Error', 'Gagal membuat backup data.', null, true);
    }
}

export function triggerImport() {
    const importFileEl = document.getElementById('import-file');
    if (importFileEl) importFileEl.click();
}

export function importDataProcess(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedState = JSON.parse(e.target.result);
            if (typeof importedState.freeCount !== 'undefined') {
                showModal('Pulihkan Data', 'Data saat ini akan ditimpa dengan data backup. Lanjutkan?', () => {
                    updateState(importedState, true);
                    window.location.reload();
                });
            } else {
                showModal('Error', 'Format file tidak valid atau rusak.', null, true);
            }
        } catch (err) {
            showModal('Error', 'Gagal membaca file backup.', null, true);
        }
    };
    reader.readAsText(file);
    const importFileEl = document.getElementById('import-file');
    if (importFileEl) importFileEl.value = '';
}

// --- Quote Collapsible Card ---
export function toggleQuote() {
    state.quoteCollapsed = !state.quoteCollapsed;
    saveState();
    applyQuoteState();
    vibrate(10);
}

export function applyQuoteState() {
    const quoteContent = document.getElementById('quote-content');
    const quoteCollapsedMsg = document.getElementById('quote-collapsed-msg');
    const quoteCard = document.getElementById('quote-card');

    if (!quoteContent || !quoteCollapsedMsg || !quoteCard) return;

    if (state.quoteCollapsed) {
        quoteContent.style.display = 'none';
        quoteCollapsedMsg.style.display = 'flex';
        quoteCard.classList.add('collapsed');
    } else {
        quoteContent.style.display = 'block';
        quoteCollapsedMsg.style.display = 'none';
        quoteCard.classList.remove('collapsed');
    }
}

// Bind to window globally for static HTML event listeners
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
