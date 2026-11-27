import { dispatch } from '../app/command-bus.js';
import { t } from './i18n.js';
import { state, saveState } from './store.js';

let wakeLock = null;
let deferredPrompt = null;
let manualUpdateCheck = false;

export function setManualUpdateCheck(active) {
  manualUpdateCheck = Boolean(active);
}

export async function requestWakeLock() {
  try {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
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
  if (isChecked) requestWakeLock();
  else releaseWakeLock();
}

export function initWakeLockVisibility() {
  if (typeof document === 'undefined') return;
  document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'visible' && state.keepScreenOn) {
      await requestWakeLock();
    }
  });
}

export function initServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then((reg) => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (!manualUpdateCheck && newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            dispatch('ui:show-modal', {
              title: t('modal_update_avail_title'),
              message: t('modal_update_avail_msg'),
              onYes: () => window.location.reload()
            }).catch(() => {});
          }
        });
      });
    }).catch((err) => console.error('SW registration failed', err));
  });
}

export function initInstallPrompt() {
  if (typeof document === 'undefined') return;
  const installBox = document.getElementById('install-prompt');
  const installBtn = document.getElementById('btn-install');
  if (!installBox || !installBtn) return;

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
