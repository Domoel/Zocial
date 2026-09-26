// Minimal browser globals for modules that touch them at import time or in the code under test.
export const sockets = []

globalThis.WebSocket = class {
  constructor (url) {
    this.url = url
    this.readyState = 0
    sockets.push(this)
  }

  close () {
    this.readyState = 3
    this.closed = true
  }
}
Object.assign(globalThis.WebSocket, { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 })

globalThis.document = {
  createElement () {
    return {
      get innerHTML () {
        return this.textContent || ''
      },
      set innerHTML (html) {
        this.textContent = String(html).replace(/<[^>]*>/g, '')
      }
    }
  }
}
