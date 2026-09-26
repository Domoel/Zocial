// The service worker's global scope: event handlers are captured so a test can dispatch events.
export const handlers = {}
export const shown = []
export const windows = []
globalThis.self = {
  origin: 'https://zocial.test',
  location: { origin: 'https://zocial.test' },
  addEventListener (type, fn) {
    handlers[type] = fn
  },
  skipWaiting () {},
  registration: {
    async showNotification (title, options) {
      shown.push({ title, options })
    }
  },
  clients: {
    async matchAll () {
      return windows
    },
    async claim () {},
    async openWindow () {}
  }
}
