import { dbPromise, getDatabase } from '../databaseLifecycle.ts'
import { getInCache, hasInCache, notificationsCache, setInCache, statusesCache } from '../cache.js'
import {
  ACCOUNTS_STORE,
  NOTIFICATIONS_STORE,
  STATUSES_STORE
} from '../constants.js'
import { fetchStatus } from './fetchStatus.js'
import { fetchNotification } from './fetchNotification.js'
import { cloneDeep } from '../../_utils/lodash-lite.js'

export async function getStatus (instanceName, id) {
  if (hasInCache(statusesCache, instanceName, id)) {
    return cloneDeep(getInCache(statusesCache, instanceName, id))
  }
  const db = await getDatabase(instanceName)
  const storeNames = [STATUSES_STORE, ACCOUNTS_STORE]
  const result = await dbPromise(db, storeNames, 'readonly', (stores, callback) => {
    const [statusesStore, accountsStore] = stores
    fetchStatus(statusesStore, accountsStore, id, callback)
  })
  // Cache hits only, and never over an entry written while the read was in flight (a background
  // insert caches the fresher network copy before its IDB write lands). A cached miss makes
  // hasInCache() true while getInCache() returns undefined — see doUpdateStatus().
  if (result && !hasInCache(statusesCache, instanceName, id)) {
    setInCache(statusesCache, instanceName, id, cloneDeep(result))
  }
  return result
}

export async function getNotification (instanceName, id) {
  if (hasInCache(notificationsCache, instanceName, id)) {
    return cloneDeep(getInCache(notificationsCache, instanceName, id))
  }
  const db = await getDatabase(instanceName)
  const storeNames = [NOTIFICATIONS_STORE, STATUSES_STORE, ACCOUNTS_STORE]
  const result = await dbPromise(db, storeNames, 'readonly', (stores, callback) => {
    const [notificationsStore, statusesStore, accountsStore] = stores
    fetchNotification(notificationsStore, statusesStore, accountsStore, id, callback)
  })
  if (result && !hasInCache(notificationsCache, instanceName, id)) { // see getStatus()
    setInCache(notificationsCache, instanceName, id, cloneDeep(result))
  }
  return result
}
