import { hasCommand, setLazyCommandLoader } from './command-bus.js';

const manifests = new Map();
const loadedFeatures = new Set();
const inFlightLoads = new Map();
const commandToFeature = new Map();

/**
 * Register a feature manifest and index its commands for lazy loading.
 * @param {object} manifest
 */
export function registerFeature(manifest) {
  if (!manifest || !manifest.id) {
    throw new Error('Feature manifest requires an id');
  }
  manifests.set(manifest.id, manifest);
  if (Array.isArray(manifest.cmds)) {
    for (const cmd of manifest.cmds) {
      commandToFeature.set(cmd, manifest.id);
    }
  }
}

/**
 * Load a registered feature chunk with 1x retry on transient module load errors.
 * @param {string} featureId
 * @returns {Promise<object>}
 */
export async function loadFeature(featureId) {
  if (loadedFeatures.has(featureId)) {
    return { ok: true, id: featureId };
  }
  if (inFlightLoads.has(featureId)) {
    return inFlightLoads.get(featureId);
  }
  const manifest = manifests.get(featureId);
  if (!manifest || typeof manifest.load !== 'function') {
    return { ok: false, id: featureId, error: new Error(`Missing manifest or loader for ${featureId}`) };
  }

  const runLoad = async () => {
    try {
      const mod = await manifest.load();
      if (mod && typeof mod.initFeature === 'function') {
        await mod.initFeature();
      }
      loadedFeatures.add(featureId);
      return { ok: true, id: featureId };
    } catch (firstErr) {
      try {
        const modRetry = await manifest.load();
        if (modRetry && typeof modRetry.initFeature === 'function') {
          await modRetry.initFeature();
        }
        loadedFeatures.add(featureId);
        return { ok: true, id: featureId };
      } catch (retryErr) {
        console.error(`Feature load failed (${featureId}):`, retryErr || firstErr);
        return { ok: false, id: featureId, error: retryErr || firstErr };
      }
    } finally {
      inFlightLoads.delete(featureId);
    }
  };

  const promise = runLoad();
  inFlightLoads.set(featureId, promise);
  return promise;
}

/**
 * Ensure the feature owning cmdId is loaded before command dispatch.
 * @param {string} cmdId
 * @returns {Promise<boolean>}
 */
export async function ensureCommandLoaded(cmdId) {
  if (hasCommand(cmdId)) return true;
  const featureId = commandToFeature.get(cmdId);
  if (!featureId) return false;
  const result = await loadFeature(featureId);
  return result.ok;
}

/**
 * Return registered feature manifests.
 * @returns {object[]}
 */
export function getRegisteredFeatures() {
  return Array.from(manifests.values());
}

/**
 * Initialize lazy loader hook and handle Vite chunk preload errors gracefully.
 */
export function initFeatureRegistry() {
  setLazyCommandLoader(ensureCommandLoaded);
  if (typeof window !== 'undefined') {
    window.addEventListener('vite:preloadError', (event) => {
      event.preventDefault();
      console.warn('Chunk preload error recovered; reload if offline cache updated.');
    });
  }
}
