// databaseLifecycle.ts stand-in: one Map per object store, request callbacks fire asynchronously.
const statuses = new Map()
export const stores = { 'statuses-v4': statuses, 'accounts-v4': new Map(), 'notifications-v4': new Map(), statuses }
let readDelay = 0
export function setReadDelay (ms) {
  readDelay = ms
}
export async function getDatabase () {
  return {}
}
function makeStore (name) {
  const map = stores[name] || (stores[name] = new Map())
  return {
    get (id) {
      const req = {}
      setTimeout(() => req.onsuccess && req.onsuccess({ target: { result: map.has(id) ? structuredClone(map.get(id)) : undefined } }), readDelay)
      return req
    },
    put (value) {
      map.set(value.id, structuredClone(value))
    }
  }
}
export function dbPromise (db, storeName, mode, cb) {
  return new Promise((resolve, reject) => {
    let res
    const store = Array.isArray(storeName) ? storeName.map(makeStore) : makeStore(storeName)
    try {
      cb(store, r => { res = r })
    } catch (e) {
      reject(e)
    }
    setTimeout(() => resolve(res), readDelay + 5)
  })
}
