import { dispatch } from '../../app/command-bus.js';
import { t } from '../../shared/i18n.js';
import { vibrate } from '../../shared/media.js';
import { savePersistedState } from '../../shared/storage.js';
import { getState, state, updateState } from '../../shared/store.js';
import { showModal, showPage } from './router-nav.js';
import { switchAppMode, switchDashboardMode } from './shell-modes.js';

export function exportData() {
  try {
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(state))}`;
    const anchor = document.createElement('a');
    anchor.setAttribute('href', dataStr);
    anchor.setAttribute('download', `tasbihku_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    vibrate([50, 50]);
  } catch (_) {
    showModal(t('modal_backup_error_title'), t('modal_backup_error_msg'), null, true);
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
      if (typeof importedState.freeCount === 'undefined') {
        showModal(t('modal_backup_error_title'), t('modal_restore_invalid_msg'), null, true);
        return;
      }
      showModal(t('modal_restore_title'), t('modal_restore_msg'), async () => {
        updateState(importedState, false);
        await savePersistedState(getState()).catch(() => {});
        window.location.reload();
      });
    } catch (_) {
      showModal(t('modal_backup_error_title'), t('modal_restore_failed_msg'), null, true);
    }
  };
  reader.readAsText(file);
  const importFileEl = document.getElementById('import-file');
  if (importFileEl) importFileEl.value = '';
}

export function handleHashRouting() {
  if (typeof window === 'undefined') return;
  let startPage = 'page-dashboard';
  const pathname = window.location.pathname.replace(/\/$/, '') || '/';
  const hash = window.location.hash;

  const routeDeepLink = (token) => {
    switchAppMode('tasbih', false);
    if (typeof history !== 'undefined') history.replaceState({ pageId: 'page-menu' }, '', '#page-menu');
    showPage('page-menu', false);
    setTimeout(() => dispatch('dzikir:handle-deeplink', { token }).catch(() => {}), 150);
  };

  if (hash && hash.startsWith('#dzikir=')) return routeDeepLink(hash.replace('#dzikir=', ''));
  const searchParams = window.location.search ? new URLSearchParams(window.location.search) : null;
  const dzikirQuery = searchParams ? searchParams.get('dzikir') : null;
  if (dzikirQuery) return routeDeepLink(dzikirQuery);

  if (pathname === '/about' || hash === '#page-about') startPage = 'page-about';
  else if (hash === '#page-player-pagi' || hash === '#page-player-petang') {
    const kind = hash === '#page-player-pagi' ? 'pagi' : 'petang';
    startPage = 'page-player';
    setTimeout(() => {
      switchAppMode('tasbih', false);
      dispatch('dzikir:start-player', { type: kind }).catch(() => {});
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
  } else if (typeof history !== 'undefined' && history.state && history.state.pageId) {
    startPage = history.state.pageId;
  }

  const targetUrl = startPage === 'page-about' ? '/about' : (startPage === 'page-dashboard' && !hash ? '/' : `#${startPage}`);
  if (typeof history !== 'undefined') history.replaceState({ pageId: startPage }, '', targetUrl);
  showPage(startPage, false);
}
