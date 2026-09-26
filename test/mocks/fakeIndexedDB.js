// indexedDB whose open() succeeds asynchronously and whose transactions can be aborted by the test.
export const opened = []
export let lastTransaction
globalThis.indexedDB = {
  open (name) {
    const req = { readyState: 'pending' }
    setTimeout(() => {
      req.readyState = 'done'
      req.result = {
        name,
        close () { this.closed = true },
        transaction () {
          lastTransaction = { objectStore: () => ({}) }
          return lastTransaction
        }
      }
      opened.push(name)
      if (req.onsuccess) req.onsuccess()
    }, 1)
    return req
  },
  deleteDatabase () {
    const req = {}
    setTimeout(() => req.onsuccess && req.onsuccess(), 1)
    return req
  }
}
