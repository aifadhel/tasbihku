import { APP_VERSION } from '../../app/version.js';
import { registerTranslations, t } from '../../shared/i18n.js';
import { setManualUpdateCheck } from '../../shared/system.js';
import { showToast } from '../../shared/toast.js';
import { showModal } from './router-nav.js';
import {
  compareVersions,
  findNewerCachedVersion,
  queryWorkerVersion,
  resolveUpdateVersion,
  waitForWorkerInstall
} from './sw-probe.js';

export { compareVersions };

registerTranslations({
  id: {
    update_hint_idle: 'Ketuk untuk periksa pembaruan',
    update_aria_label: 'Versi {version}. Periksa pembaruan aplikasi',
    update_status_checking: 'Memeriksa pembaruan...',
    update_status_latest: 'Sudah versi terbaru (v{version})',
    update_status_ready: 'Pembaruan siap{ver}. Ketuk untuk perbarui',
    update_modal_msg: 'Versi terbaru TasbihKu tersedia{ver}. Muat ulang sekarang untuk memperbarui?',
    update_status_offline: 'Anda sedang offline. Sambungkan internet untuk memeriksa pembaruan.',
    update_status_unsupported: 'Pemeriksaan pembaruan otomatis tidak tersedia di mode ini.',
    update_status_error: 'Gagal memeriksa pembaruan. Coba lagi nanti.',
    update_applying: 'Memasang pembaruan...'
  },
  en: {
    update_hint_idle: 'Tap to check for updates',
    update_aria_label: 'Version {version}. Check for app updates',
    update_status_checking: 'Checking for updates...',
    update_status_latest: 'Already up to date (v{version})',
    update_status_ready: 'Update ready{ver}. Tap to update',
    update_modal_msg: 'A new version of TasbihKu is available{ver}. Reload now to update?',
    update_status_offline: 'You are offline. Connect to check for updates.',
    update_status_unsupported: 'Automatic update check is unavailable in this mode.',
    update_status_error: 'Could not check for updates. Please try again.',
    update_applying: 'Applying update...'
  }
});

let isChecking = false;
let pendingUpdate = null;

function setFooterStatus(text, tone = 'idle') {
  if (typeof document === 'undefined') return;
  const statusEl = document.getElementById('app-version-status');
  const btnEl = document.getElementById('app-version');
  if (statusEl) {
    statusEl.textContent = text;
    statusEl.classList.toggle('is-error', tone === 'error');
    statusEl.classList.toggle('has-update', tone === 'ready');
  }
  if (btnEl) btnEl.classList.toggle('has-update', tone === 'ready');
}

function setCheckingUI(checking) {
  if (typeof document === 'undefined') return;
  const btnEl = document.getElementById('app-version');
  if (btnEl) {
    btnEl.disabled = checking;
    btnEl.setAttribute('aria-busy', checking ? 'true' : 'false');
    btnEl.classList.toggle('is-checking', checking);
  }
  if (checking) setFooterStatus(t('update_status_checking'), 'idle');
}

function reportErrorStatus(status, key) {
  const msg = t(key);
  setFooterStatus(msg, 'error');
  showToast(msg);
  return { status };
}

export function syncVersionUI() {
  if (typeof document === 'undefined') return;
  const btnEl = document.getElementById('app-version');
  const textEl = document.getElementById('app-version-text');
  if (textEl) textEl.textContent = `tasbihku-v${APP_VERSION}`;
  else if (btnEl) btnEl.textContent = `tasbihku-v${APP_VERSION}`;
  if (btnEl) btnEl.setAttribute('aria-label', t('update_aria_label', { version: APP_VERSION }));
  if (isChecking) return;

  if (pendingUpdate) {
    const ver = pendingUpdate.version ? ` (v${pendingUpdate.version})` : '';
    setFooterStatus(t('update_status_ready', { ver }), 'ready');
  } else {
    setFooterStatus(t('update_hint_idle'), 'idle');
  }
}

export function resetUpdaterState() {
  isChecking = false;
  pendingUpdate = null;
}

async function applyPendingUpdate(reg, reloadFn) {
  setFooterStatus(t('update_applying'), 'ready');
  if (reg?.waiting && typeof reg.waiting.postMessage === 'function') {
    await new Promise((resolve) => {
      const sw = typeof navigator !== 'undefined' ? navigator.serviceWorker : null;
      const done = () => { clearTimeout(timer); sw?.removeEventListener?.('controllerchange', done); resolve(); };
      const timer = setTimeout(done, 400);
      sw?.addEventListener?.('controllerchange', done);
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    });
  }
  if (typeof reloadFn === 'function') reloadFn();
  else if (typeof window !== 'undefined' && window.location) window.location.reload();
}

function promptApplyUpdate(version, reg, reloadFn) {
  pendingUpdate = { version: version || '', registration: reg || null };
  const ver = version ? ` (v${version})` : '';
  setFooterStatus(t('update_status_ready', { ver }), 'ready');
  showModal(
    t('modal_update_avail_title'),
    t('update_modal_msg', { ver }),
    () => applyPendingUpdate(reg, reloadFn),
    false,
    () => syncVersionUI()
  );
  return version ? { status: 'update-available', version } : { status: 'update-available' };
}

export async function checkForAppUpdate({ reloadFn } = {}) {
  if (isChecking) return { status: 'busy' };
  if (pendingUpdate) return promptApplyUpdate(pendingUpdate.version, pendingUpdate.registration, reloadFn);
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return reportErrorStatus('unsupported', 'update_status_unsupported');
  if (navigator.onLine === false) return reportErrorStatus('offline', 'update_status_offline');

  isChecking = true;
  setManualUpdateCheck(true);
  setCheckingUI(true);

  const sw = navigator.serviceWorker;
  const hadController = Boolean(sw.controller);
  let controllerChanged = false;
  let updateFound = false;
  let foundWorker = null;
  let reg = null;
  const onControllerChange = () => { controllerChanged = true; };
  const onUpdateFound = () => { updateFound = true; if (reg?.installing) foundWorker = reg.installing; };

  try {
    const preCached = await findNewerCachedVersion(APP_VERSION);
    reg = await sw.getRegistration();
    if (preCached) return promptApplyUpdate(preCached, reg, reloadFn);
    if (!reg && typeof sw.register === 'function') reg = await sw.register('./sw.js', { updateViaCache: 'none' });
    if (!reg) throw new Error('Missing service worker registration');
    if (reg.waiting && hadController) return promptApplyUpdate(await resolveUpdateVersion(APP_VERSION, reg.waiting), reg, reloadFn);

    const prevActive = reg.active;
    sw.addEventListener?.('controllerchange', onControllerChange);
    reg.addEventListener?.('updatefound', onUpdateFound);
    await reg.update();

    const candidate = reg.installing || reg.waiting || foundWorker;
    const installed = candidate ? await waitForWorkerInstall(candidate) : false;
    const activeAfter = reg.waiting || reg.active || candidate;
    const newerVer = await resolveUpdateVersion(APP_VERSION, activeAfter);
    const reportedVer = await queryWorkerVersion(activeAfter);
    const sameOrOlder = Boolean(reportedVer && compareVersions(reportedVer, APP_VERSION) <= 0);
    const hasNewWorker = Boolean(hadController && (reg.waiting || updateFound || (installed && candidate !== prevActive) || controllerChanged));

    if (newerVer || (hasNewWorker && !sameOrOlder)) {
      return promptApplyUpdate(newerVer, reg, reloadFn);
    }

    const latestMsg = t('update_status_latest', { version: APP_VERSION });
    setFooterStatus(latestMsg, 'idle');
    showToast(latestMsg);
    return { status: 'up-to-date', version: APP_VERSION };
  } catch (_) {
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    return reportErrorStatus(offline ? 'offline' : 'error', offline ? 'update_status_offline' : 'update_status_error');
  } finally {
    sw.removeEventListener?.('controllerchange', onControllerChange);
    reg?.removeEventListener?.('updatefound', onUpdateFound);
    isChecking = false;
    setManualUpdateCheck(false);
    setCheckingUI(false);
  }
}
