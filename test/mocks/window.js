// A window that records its event listeners, so a test can dispatch e.g. `storage` events.
const listeners = {}
globalThis.window = {
  addEventListener (type, fn) {
    (listeners[type] = listeners[type] || []).push(fn)
  },
  removeEventListener () {},
  location: { reload () { globalThis.window.reloaded = true } }
}
export function dispatch (type, event) {
  for (const fn of listeners[type] || []) {
    fn(event)
  }
}
