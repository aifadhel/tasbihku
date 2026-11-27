import { registerTranslations, t } from '../../shared/i18n.js';
import {
  clearDeferredInstallPrompt,
  dismissInstallBanner,
  getDeferredInstallPrompt,
  isAppInstalled
} from '../../shared/system.js';
import { showToast } from '../../shared/toast.js';
import { showModal } from './router-nav.js';

registerTranslations({
  id: {
    install_modal_title: 'Install TasbihKu',
    install_guide_ios: 'Buka tombol Bagikan (Share) di Safari, lalu pilih "Tambah ke Layar Utama" (Add to Home Screen).',
    install_guide_browser: 'Browser belum menampilkan prompt otomatis. Buka menu browser lalu pilih "Install aplikasi" atau "Tambahkan ke layar utama" (ikon install di bilah alamat).',
    install_already_installed: 'TasbihKu sudah terpasang sebagai aplikasi.',
    install_started: 'Memasang TasbihKu...',
    install_cancelled: 'Pemasangan dibatalkan. Anda dapat memasang kapan saja dari menu Pengaturan.'
  },
  en: {
    install_modal_title: 'Install TasbihKu',
    install_guide_ios: 'Tap the Share button in Safari, then choose "Add to Home Screen".',
    install_guide_browser: 'Your browser has not triggered the automatic prompt yet. Open the browser menu and select "Install app" or "Add to Home Screen" (or use the install icon in the address bar).',
    install_already_installed: 'TasbihKu is already installed as an app.',
    install_started: 'Installing TasbihKu...',
    install_cancelled: 'Installation cancelled. You can install anytime from Settings.'
  }
});

function isIosPlatform() {
  if (typeof navigator === 'undefined') return false;
  const ua = String(navigator.userAgent || '');
  return /iPad|iPhone|iPod/i.test(ua) || (/Macintosh/i.test(ua) && Number(navigator.maxTouchPoints || 0) > 1);
}

export function syncInstallUI() {
  if (typeof document === 'undefined') return;
  const installed = isAppInstalled();
  const row = document.getElementById('install-app-row');
  if (row) row.style.display = installed ? 'none' : 'flex';
  const box = document.getElementById('install-prompt');
  if (box && installed) box.style.display = 'none';
}

export function dismissInstallPrompt() {
  dismissInstallBanner();
}

export async function promptAppInstall() {
  if (isAppInstalled()) {
    syncInstallUI();
    showToast(t('install_already_installed'));
    return { status: 'already-installed' };
  }

  const promptEvent = getDeferredInstallPrompt();
  if (promptEvent && typeof promptEvent.prompt === 'function') {
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      clearDeferredInstallPrompt();
      if (choice && choice.outcome === 'accepted') {
        dismissInstallBanner();
        syncInstallUI();
        showToast(t('install_started'));
        return { status: 'accepted' };
      }
      showToast(t('install_cancelled'));
      return { status: 'dismissed' };
    } catch (_) {
      clearDeferredInstallPrompt();
    }
  }

  const platform = isIosPlatform() ? 'ios' : 'browser';
  showModal(
    t('install_modal_title'),
    t(platform === 'ios' ? 'install_guide_ios' : 'install_guide_browser'),
    null,
    true
  );
  return { status: 'fallback-modal', platform };
}
