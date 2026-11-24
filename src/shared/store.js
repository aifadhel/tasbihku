import { dispatch } from '../app/command-bus.js';
import {
  clearLegacyOnLoadError,
  initCrossTabSync,
  loadPersistedState,
  savePersistedState
} from './storage.js';
import { migrateLoadedState } from './store-migrate.js';

export const DEFAULT_STATE = {
  freeCount: 0,
  targetLimit: 0,
  customList: [],
  customAzkar: [],
  guidedData: {},
  guidedDataVersion: 3,
  keepScreenOn: false,
  oledMode: false,
  userName: 'SaudaraKu',
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
  pagiReminderTime: '06:00',
  petangReminderEnabled: false,
  petangReminderTime: '16:00',
  istiqamahGrace: true,
  language: 'id'
};

const rawState = { ...DEFAULT_STATE };
const subscribers = new Set();
let saveStateTimeout = null;

function notifySubscribers(changedKeys) {
  for (const sub of subscribers) {
    if (typeof sub.spec === 'function') {
      sub.spec(state, changedKeys);
    } else if (typeof sub.callback === 'function') {
      const keysToWatch = Array.isArray(sub.spec) ? sub.spec : [sub.spec];
      if (keysToWatch.some((k) => changedKeys.includes(k))) {
        sub.callback(state);
      }
    }
  }
}

async function performSave() {
  try {
    await savePersistedState(rawState);
  } catch (e) {
    console.error('Failed to save state:', e);
    if (e.name === 'QuotaExceededError' || e.code === 22 || e.name === 'DataCloneError') {
      dispatch('ui:show-modal', {
        title: 'Penyimpanan Penuh',
        message: 'Memori perangkat penuh. Silakan export backup dan bersihkan data browser untuk melanjutkan.',
        isAlert: true
      }).catch(() => {});
      if (rawState.activityLog && rawState.activityLog.length > 50) {
        rawState.activityLog = rawState.activityLog.slice(-50);
        try {
          await savePersistedState(rawState);
        } catch (e2) {
          console.error('Emergency prune failed:', e2);
        }
      }
    }
  }
}

export function saveState() {
  if (saveStateTimeout !== null) clearTimeout(saveStateTimeout);
  saveStateTimeout = setTimeout(() => {
    saveStateTimeout = null;
    performSave();
  }, 300);
}

export function saveStateImmediate() {
  if (saveStateTimeout !== null) {
    clearTimeout(saveStateTimeout);
    saveStateTimeout = null;
  }
  performSave();
}

export const state = new Proxy(rawState, {
  get(target, prop) {
    const val = target[prop];
    if (val !== null && typeof val === 'object') {
      return new Proxy(val, {
        get(nestedTarget, nestedProp) { return nestedTarget[nestedProp]; },
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

export async function loadState() {
  try {
    const loaded = await loadPersistedState();
    if (loaded) {
      Object.assign(rawState, DEFAULT_STATE, loaded);
      migrateLoadedState(rawState);
    }
  } catch (e) {
    console.error('Failed to load state, resetting to defaults:', e);
    clearLegacyOnLoadError();
    Object.assign(rawState, DEFAULT_STATE);
  }
  initCrossTabSync(() => {
    loadPersistedState().then((fresh) => {
      if (!fresh) return;
      Object.assign(rawState, DEFAULT_STATE, fresh);
      migrateLoadedState(rawState);
      notifySubscribers(Object.keys(rawState));
    }).catch(() => {});
  });
  notifySubscribers(Object.keys(rawState));
}

export function getState() {
  return JSON.parse(JSON.stringify(rawState));
}

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
    if (immediateSave) saveStateImmediate();
    else saveState();
  }
}

export function subscribe(listenerSpec, callback) {
  const subscriber = { spec: listenerSpec, callback };
  subscribers.add(subscriber);
  return () => subscribers.delete(subscriber);
}
