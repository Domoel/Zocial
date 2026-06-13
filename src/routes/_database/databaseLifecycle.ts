import { DB_VERSION_CURRENT } from './constants.js'
import { addKnownInstance, deleteKnownInstance } from './knownInstances.js'
import { migrations } from './migrations.js'
import { clearAllCaches } from './cache.js'
import { lifecycle } from '../_utils/lifecycle.ts'

const openReqs: Record<string, IDBOpenDBRequest> = {}
// Cache the in-flight open *promise* (not the resolved DB) so that concurrent
// first-time callers — which is the norm on a cold load, where many inserts and
// lookups fire in parallel — share a single open request instead of each
// opening (and leaking) its own connection. A leaked connection would also
// later block deleteDatabase() on logout.
const databaseCache: Record<string, Promise<IDBDatabase>> = {}

function createDatabase(instanceName: string) {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(instanceName, DB_VERSION_CURRENT.version)
    openReqs[instanceName] = req
    req.onerror = reject
    req.onblocked = () => {
      console.error('idb blocked')
    }
    req.onupgradeneeded = (e) => {
      const db = req.result
      const tx = req.transaction

      const migrationsToDo = migrations.filter(
        ({ version }) => e.oldVersion < version,
      )

      function doNextMigration() {
        if (!migrationsToDo.length) {
          return
        }
        const { migration } = migrationsToDo.shift()!
        migration(db, tx, doNextMigration)
      }
      doNextMigration()
    }
    req.onsuccess = () => resolve(req.result)
  })
}

export function getDatabase(instanceName: string): Promise<IDBDatabase> {
  if (!instanceName) {
    return Promise.reject(
      new Error('instanceName is undefined in getDatabase()'),
    )
  }
  if (!databaseCache[instanceName]) {
    databaseCache[instanceName] = createDatabase(instanceName).then(
      async (db) => {
        await addKnownInstance(instanceName)
        return db
      },
    )
    // Don't cache a rejected promise — otherwise a single open failure would
    // make the instance permanently unusable until a full reload.
    databaseCache[instanceName].catch(() => {
      delete databaseCache[instanceName]
    })
  }
  return databaseCache[instanceName]!
}

type IdxOf<T extends any[]> = Exclude<keyof T, keyof any[]>
export async function dbPromise<result, stores extends string | string[]>(
  db: IDBDatabase,
  storeName: stores,
  readOnlyOrReadWrite: IDBTransactionMode,
  cb: (
    store: stores extends string[]
      ? {
          [Index in IdxOf<stores>]: IDBObjectStore
        } & { length: stores['length'] } & Array<IDBObjectStore>
      : IDBObjectStore,
    cb: (_: result) => void,
  ) => any,
): Promise<result> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, readOnlyOrReadWrite)
    const store =
      typeof storeName === 'string'
        ? tx.objectStore(storeName)
        : storeName.map((name) => tx.objectStore(name))
    let res: result
    cb(store as any, (result) => {
      res = result
    })

    tx.oncomplete = () => resolve(res)
    tx.onerror = () => reject(tx.error)
  })
}

export function deleteDatabase(instanceName: string) {
  return new Promise<void>((resolve, reject) => {
    // close any open requests
    const openReq = openReqs[instanceName]
    if (openReq && openReq.result) {
      openReq.result.close()
    }
    delete openReqs[instanceName]
    delete databaseCache[instanceName]
    const req = indexedDB.deleteDatabase(instanceName)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    req.onblocked = () => console.error(`database ${instanceName} blocked`)
  })
    .then(() => deleteKnownInstance(instanceName))
    .then(() => clearAllCaches(instanceName))
}

export function closeDatabase(instanceName: string) {
  // close any open requests
  const openReq = openReqs[instanceName]
  if (openReq && openReq.result) {
    openReq.result.close()
  }
  delete openReqs[instanceName]
  delete databaseCache[instanceName]
  clearAllCaches(instanceName)
}

if (ZOCIAL_IS_BROWSER) {
  lifecycle.addEventListener('statechange', (event) => {
    if (event.newState === 'frozen') {
      // page is frozen, close IDB connections
      Object.keys(openReqs).forEach((instanceName) => {
        closeDatabase(instanceName)
      })
    }
  })
}
