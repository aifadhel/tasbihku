import { dispatch } from '../app/command-bus.js';
import { t } from './i18n.js';
import { state, saveState } from './store.js';

let wakeLock = null;
let deferredPrompt = null;
let manualUpdateCheck = false;
let installBound = false;
let installDismissed = false;

export function setManualUpdateCheck(active) {
  manualUpdateCheck = Boolean(active);
}

const setInstallBox = (show) => {
  const b = typeof document !== 'undefined' && document.getElementById('install-prompt');
  if (b) b.style.display = show ? 'block' : 'none';
};
const notifyInstall = () => typeof CustomEvent !== 'undefined' && window.dispatchEvent(new CustomEvent('installPromptChanged'));

export function isAppInstalled() {
  return Boolean(
    (typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)')?.matches) ||
    (typeof navigator !== 'undefined' && navigator.standalone === true)
  );
}

export function getDeferredInstallPrompt() { return deferredPrompt; }
export function clearDeferredInstallPrompt() { deferredPrompt = null; }
export function dismissInstallBanner() { installDismissed = true; setInstallBox(false); }

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
  const registerSw = () => {
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
  };
  if (typeof document !== 'undefined' && document.readyState === 'complete') registerSw();
  else if (typeof window !== 'undefined') window.addEventListener('load', registerSw, { once: true });
}

export function captureInstallPrompt() {
  if (installBound || typeof window === 'undefined') return;
  installBound = true;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (!installDismissed && !isAppInstalled()) setInstallBox(true);
    notifyInstall();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    setInstallBox(false);
    notifyInstall();
  });
}

export function initInstallPrompt() {
  captureInstallPrompt();
  if (deferredPrompt && !installDismissed && !isAppInstalled()) setInstallBox(true);
}
