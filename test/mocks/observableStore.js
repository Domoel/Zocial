// A store that records compute() functions and observe() callbacks, so a test can drive them.
const state = {}
const observers = {}
export const computed = {}
export const store = {
  get: () => state,
  set (obj) {
    Object.assign(state, obj)
  },
  compute (name, deps, fn) {
    computed[name] = (...args) => fn(...args)
  },
  observe (key, fn) {
    (observers[key] = observers[key] || []).push(fn)
  }
}
export function fireObserver (key, value) {
  for (const fn of observers[key] || []) {
    fn(value)
  }
}
