function parseVersionParts(raw) {
  const m = String(raw || '').match(/(\d+)\.(\d+)\.(\d+)/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

/**
 * Compare two semantic version strings (e.g. '1.16.2' vs 'tasbihku-v1.16.1').
 * @param {string} a
 * @param {string} b
 * @returns {number} 1 if a > b, -1 if a < b, 0 if equal or invalid.
 */
export function compareVersions(a, b) {
  const pa = parseVersionParts(a);
  const pb = parseVersionParts(b);
  if (!pa || !pb) return 0;
  for (let i = 0; i < 3; i += 1) {
    if (pa[i] !== pb[i]) return pa[i] > pb[i] ? 1 : -1;
  }
  return 0;
}

/**
 * Find the highest cached tasbihku-vX.Y.Z version newer than currentVersion.
 * @param {string} currentVersion
 * @returns {Promise<string>}
 */
export async function findNewerCachedVersion(currentVersion) {
  if (typeof caches === 'undefined' || typeof caches.keys !== 'function') return '';
  try {
    const keys = await caches.keys();
    let best = '';
    for (const key of keys) {
      const m = String(key).match(/^tasbihku-v(\d+\.\d+\.\d+)$/);
      if (m && compareVersions(m[1], currentVersion) > 0 && (!best || compareVersions(m[1], best) > 0)) {
        best = m[1];
      }
    }
    return best;
  } catch (_) {
    return '';
  }
}

/**
 * Query a service worker instance for its CACHE_NAME version via MessageChannel.
 * @param {ServiceWorker|null|undefined} worker
 * @returns {Promise<string>}
 */
export function queryWorkerVersion(worker) {
  if (!worker || typeof worker.postMessage !== 'function' || typeof MessageChannel === 'undefined') {
    return Promise.resolve('');
  }
  return new Promise((resolve) => {
    let settled = false;
    const done = (val) => { if (!settled) { settled = true; resolve(val); } };
    const timer = setTimeout(() => done(''), 350);
    try {
      const ch = new MessageChannel();
      ch.port1.onmessage = (e) => {
        clearTimeout(timer);
        const m = String(e.data?.cacheName || '').match(/(\d+\.\d+\.\d+)/);
        done(m ? m[1] : '');
      };
      worker.postMessage({ type: 'GET_VERSION' }, [ch.port2]);
    } catch (_) {
      clearTimeout(timer);
      done('');
    }
  });
}

/**
 * Wait for an installing service worker to reach installed/activated or fail as redundant.
 * @param {ServiceWorker|null|undefined} worker
 * @returns {Promise<boolean>}
 */
export function waitForWorkerInstall(worker) {
  if (!worker) return Promise.resolve(false);
  if (worker.state === 'installed' || worker.state === 'activated') return Promise.resolve(true);
  if (worker.state === 'redundant') return Promise.resolve(false);
  return new Promise((resolve) => {
    const cleanup = () => { clearTimeout(timer); worker.removeEventListener?.('statechange', onState); };
    const timer = setTimeout(() => { cleanup(); resolve(false); }, 15000);
    const onState = () => {
      if (worker.state === 'installed' || worker.state === 'activated') { cleanup(); resolve(true); }
      else if (worker.state === 'redundant') { cleanup(); resolve(false); }
    };
    worker.addEventListener?.('statechange', onState);
  });
}

/**
 * Resolve the newest detected version from Cache Storage or a ServiceWorker instance.
 * @param {string} currentVersion
 * @param {ServiceWorker|null|undefined} worker
 * @returns {Promise<string>}
 */
export async function resolveUpdateVersion(currentVersion, worker) {
  const cached = await findNewerCachedVersion(currentVersion);
  if (cached) return cached;
  const workerVer = await queryWorkerVersion(worker);
  return workerVer && compareVersions(workerVer, currentVersion) > 0 ? workerVer : '';
}
