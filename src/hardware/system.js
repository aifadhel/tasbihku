/* ========================================================================= */
/* --- TasbihKu System API Module (src/hardware/system.js) --- */
/* ========================================================================= */

import { state, saveState } from '../core/store.js';
import { showModal } from '../ui/router.js';

let wakeLock = null;
let deferredPrompt = null;

// Screen Wake Lock Actions
export async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
        }
    } catch (err) {
        console.error('Wake Lock failed:', err);
    }
}

export function releaseWakeLock() {
    if (wakeLock !== null) {
        wakeLock.release().then(() => {
            wakeLock = null;
        });
    }
}

export function toggleWakeLock(isChecked) {
    state.keepScreenOn = isChecked;
    saveState();
    if (isChecked) {
        requestWakeLock();
    } else {
        releaseWakeLock();
    }
}

// Initialize Visibility change listener for Wakelock recovery
document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'visible') {
        if (state.keepScreenOn) await requestWakeLock();
    }
});

// Initialize Service Worker Registration
export function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').then(reg => {
                console.log('SW registered!', reg);
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            showModal(
                                'Update Tersedia',
                                'Versi baru TasbihKu tersedia. Muat ulang sekarang?',
                                () => window.location.reload()
                            );
                        }
                    });
                });
            }).catch(err => console.log('SW registration failed', err));
        });
    }
}

// Initialize Install Prompt Logic
export function initInstallPrompt() {
    const installBox = document.getElementById('install-prompt');
    const installBtn = document.getElementById('btn-install');
    if (installBox && installBtn) {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            installBox.style.display = 'block';
        });
        installBtn.addEventListener('click', () => {
            installBox.style.display = 'none';
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(() => {
                deferredPrompt = null;
            });
        });
    }
}
