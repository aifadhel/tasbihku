import { get as idbGet, set as idbSet } from 'idb-keyval';

export const BOOT_PREFS_KEY = 'tasbihKuBootPrefs';
export const IDB_STATE_KEY = 'tasbihKuState';
export const LEGACY_STORAGE_KEY = 'tasbihKuState';
export const MAX_LOCAL_BYTES = 1024;
export const SYNC_CHANNEL_NAME = 'tasbihku_state_sync';

export const BOOT_PREF_KEYS = [
  'language',
  'oledMode',
  'appMode',
  'dashboardMode',
  'arabicFontSize',
  'soundEnabled',
  'vibrationEnabled',
  'vibrationInterval',
  'keepScreenOn',
  'userName'
];

let syncChannel = null;
const tabInstanceId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function extractBootPrefs(rawState) {
  const prefs = {};
  for (const key of BOOT_PREF_KEYS) {
    if (rawState[key] !== undefined) {
      prefs[key] = rawState[key];
    }
  }
  return prefs;
}

export function readBootPrefs() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(BOOT_PREFS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

export function writeBootPrefs(rawState) {
  if (typeof localStorage === 'undefined') return false;
  try {
    const payload = JSON.stringify(extractBootPrefs(rawState));
    if (payload.length > MAX_LOCAL_BYTES) {
      console.warn(`Boot prefs exceeded ${MAX_LOCAL_BYTES}B (${payload.length}B); skipped localStorage write.`);
      return false;
    }
    localStorage.setItem(BOOT_PREFS_KEY, payload);
    return true;
  } catch (_) {
    return false;
  }
}

export async function loadPersistedState() {
  let loaded = null;
  try {
    loaded = await idbGet(IDB_STATE_KEY);
  } catch (_) {
    loaded = null;
  }

  if (typeof localStorage !== 'undefined') {
    try {
      const legacyStr = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!loaded && legacyStr) {
        loaded = JSON.parse(legacyStr);
        if (loaded && typeof loaded === 'object') {
          await idbSet(IDB_STATE_KEY, loaded).catch(() => {});
          writeBootPrefs(loaded);
        }
      }
      if (legacyStr !== null) {
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
      localStorage.removeItem('tasbihku_last_broadcast_id');
    } catch (_) {
      // Ignore malformed legacy localStorage entries
    }
  }

  if (!loaded) {
    loaded = readBootPrefs();
  }
  return loaded;
}

export async function savePersistedState(rawState) {
  const dataStr = JSON.stringify(rawState);
  writeBootPrefs(rawState);
  await idbSet(IDB_STATE_KEY, JSON.parse(dataStr));
  if (syncChannel) {
    try {
      syncChannel.postMessage({ type: 'state-updated', sender: tabInstanceId });
    } catch (_) {}
  }
}

export function clearLegacyOnLoadError() {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.removeItem(BOOT_PREFS_KEY);
  } catch (_) {}
}

export function initCrossTabSync(onExternalUpdate) {
  if (typeof BroadcastChannel === 'undefined' || syncChannel) return;
  syncChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
  syncChannel.addEventListener('message', (event) => {
    if (!event.data || event.data.sender === tabInstanceId) return;
    if (event.data.type === 'state-updated' && typeof onExternalUpdate === 'function') {
      onExternalUpdate();
    }
  });
}

export function getRoutineCollapsed(section) {
  if (typeof localStorage === 'undefined') return false;
  try {
    return localStorage.getItem(`collapsed_routine_${section}`) === 'true';
  } catch (_) {
    return false;
  }
}

export function setRoutineCollapsed(section, collapsed) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(`collapsed_routine_${section}`, collapsed ? 'true' : 'false');
  } catch (_) {}
}
