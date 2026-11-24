/**
 * Lightweight command and event bus for decoupled cross-feature communication.
 */
const commandHandlers = new Map();
const eventListeners = new Map();
const interceptors = new Set();
let lazyCommandLoader = null;

/**
 * Register a lazy loader callback invoked when dispatching an unregistered command.
 * @param {(cmdId: string) => Promise<boolean>} loaderFn
 */
export function setLazyCommandLoader(loaderFn) {
  lazyCommandLoader = loaderFn;
}

/**
 * Register a command handler by ID.
 * @param {string} id
 * @param {(payload?: any) => any} handler
 * @returns {() => void}
 */
export function registerCommand(id, handler) {
  commandHandlers.set(id, handler);
  return () => {
    if (commandHandlers.get(id) === handler) {
      commandHandlers.delete(id);
    }
  };
}

/**
 * Check if a command handler is currently registered.
 * @param {string} id
 * @returns {boolean}
 */
export function hasCommand(id) {
  return commandHandlers.has(id);
}

/**
 * Register a command interceptor invoked before handler execution.
 * Returning false cancels dispatch.
 * @param {(id: string, payload?: any) => boolean|void} fn
 * @returns {() => void}
 */
export function interceptCommand(fn) {
  interceptors.add(fn);
  return () => interceptors.delete(fn);
}

/**
 * Dispatch a command to its registered handler (loading lazy feature if needed).
 * @param {string} id
 * @param {any} [payload]
 * @returns {Promise<any>}
 */
export async function dispatch(id, payload) {
  for (const fn of interceptors) {
    if (fn(id, payload) === false) return undefined;
  }
  if (!commandHandlers.has(id) && typeof lazyCommandLoader === 'function') {
    await lazyCommandLoader(id);
  }
  const handler = commandHandlers.get(id);
  if (!handler) {
    throw new Error(`Unknown command: ${id}`);
  }
  return handler(payload);
}

/**
 * Subscribe to a domain event topic.
 * @param {string} topic
 * @param {(detail?: any) => void} listener
 * @returns {() => void}
 */
export function onEvent(topic, listener) {
  if (!eventListeners.has(topic)) {
    eventListeners.set(topic, new Set());
  }
  eventListeners.get(topic).add(listener);
  return () => eventListeners.get(topic)?.delete(listener);
}

/**
 * Emit a domain event to all subscribed listeners.
 * @param {string} topic
 * @param {any} [detail]
 */
export function emitEvent(topic, detail) {
  const set = eventListeners.get(topic);
  if (!set) return;
  for (const listener of set) {
    listener(detail);
  }
}
