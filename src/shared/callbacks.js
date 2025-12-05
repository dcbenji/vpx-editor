const callbacks = new Map();

export function registerCallback(name, defaultValue = null) {
  callbacks.set(name, defaultValue);
}

export function setCallback(name, fn) {
  callbacks.set(name, fn);
}

export function invokeCallback(name, ...args) {
  const callback = callbacks.get(name);
  if (callback && typeof callback === 'function') {
    return callback(...args);
  }
}

export function hasCallback(name) {
  return callbacks.has(name) && callbacks.get(name) !== null;
}

export function clearCallback(name) {
  callbacks.set(name, null);
}
