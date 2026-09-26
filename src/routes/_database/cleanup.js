import { dbPromise, getDatabase } from './databaseLifecycle.ts'
import {
  ACCOUNTS_STORE,
  NOTIFICATION_TIMELINES_STORE,
  NOTIFICATIONS_STORE,
  PINNED_STATUSES_STORE,
  RELATIONSHIPS_STORE,
  STATUS_TIMELINES_STORE,
  STATUSES_STORE,
  THREADS_STORE,
  TIMESTAMP
} from './constants.js'
import { debounce } from '../_thirdparty/lodash/timers.js'
import { mark, stop } from '../_utils/marks.js'
import { deleteAll } from './utils.js'
import { createPinnedStatusKeyRange, createThreadKeyRange } from './keys.js'
import { getKnownInstances } from './knownInstances.js'
import { noop } from '../_utils/lodash-lite.js'
import { CLEANUP_DELAY, CLEANUP_MAX_WAIT, CLEANUP_TIME_AGO } from '../_static/database.js'
import { scheduleIdleTask } from '../_utils/scheduleIdleTask.js'

const BATCH_SIZE = 20

function batchedGetAll (callGetAll, callback) {
  function nextBatch () {
    callGetAll().onsuccess = function (e) {
      const results = e.target.result
      callback(results)
      if (results.length) {
        nextBatch()
      }
    }
  }
  nextBatch()
}

function cleanupStatuses (statusesStore, statusTimelinesStore, threadsStore, cutoff) {
  batchedGetAll(
    () => statusesStore.index(TIMESTAMP).getAllKeys(IDBKeyRange.upperBound(cutoff), BATCH_SIZE),
    results => {
      results.forEach(statusId => {
        statusesStore.delete(statusId)
        deleteAll(
          statusTimelinesStore,
          statusTimelinesStore.index('statusId'),
          IDBKeyRange.only(statusId)
        )
        deleteAll(
          threadsStore,
          threadsStore,
          createThreadKeyRange(statusId)
        )
      })
    }
  )
}

function cleanupNotifications (notificationsStore, notificationTimelinesStore, cutoff) {
  batchedGetAll(
    () => notificationsStore.index(TIMESTAMP).getAllKeys(IDBKeyRange.upperBound(cutoff), BATCH_SIZE),
    results => {
      results.forEach(notificationId => {
        notificationsStore.delete(notificationId)
        deleteAll(
          notificationTimelinesStore,
          notificationTimelinesStore.index('notificationId'),
          IDBKeyRange.only(notificationId)
        )
      })
    }
  )
}

function cleanupAccounts (accountsStore, pinnedStatusesStore, cutoff) {
  batchedGetAll(
    () => accountsStore.index(TIMESTAMP).getAllKeys(IDBKeyRange.upperBound(cutoff), BATCH_SIZE),
    results => {
      results.forEach(accountId => {
        accountsStore.delete(accountId)
        deleteAll(
          pinnedStatusesStore,
          pinnedStatusesStore,
          createPinnedStatusKeyRange(accountId)
        )
      })
    }
  )
}

function cleanupRelationships (relationshipsStore, cutoff) {
  batchedGetAll(
    () => relationshipsStore.index(TIMESTAMP).getAllKeys(IDBKeyRange.upperBound(cutoff), BATCH_SIZE),
    results => {
      results.forEach(relationshipId => {
        relationshipsStore.delete(relationshipId)
      })
    }
  )
}

export async function cleanup (instanceName) {
  mark(`cleanup:${instanceName}`)
  const db = await getDatabase(instanceName)
  const storeNames = [
    STATUSES_STORE,
    STATUS_TIMELINES_STORE,
    NOTIFICATIONS_STORE,
    NOTIFICATION_TIMELINES_STORE,
    ACCOUNTS_STORE,
    RELATIONSHIPS_STORE,
    THREADS_STORE,
    PINNED_STATUSES_STORE
  ]
  await dbPromise(db, storeNames, 'readwrite', (stores) => {
    const [
      statusesStore,
      statusTimelinesStore,
      notificationsStore,
      notificationTimelinesStore,
      accountsStore,
      relationshipsStore,
      threadsStore,
      pinnedStatusesStore
    ] = stores

    const cutoff = Date.now() - CLEANUP_TIME_AGO

    cleanupStatuses(statusesStore, statusTimelinesStore, threadsStore, cutoff)
    cleanupNotifications(notificationsStore, notificationTimelinesStore, cutoff)
    cleanupAccounts(accountsStore, pinnedStatusesStore, cutoff)
    cleanupRelationships(relationshipsStore, cutoff)
  })
  stop(`cleanup:${instanceName}`)
}

function doCleanup (instanceName) {
  scheduleIdleTask(() => {
    // best-effort housekeeping (e.g. an instance logged out in the meantime)
    cleanup(instanceName).catch(e => console.warn('database cleanup failed:', instanceName, (e && e.message) || e))
  })
}

async function scheduledCleanup () {
  const knownInstances = await getKnownInstances()
  for (const instance of knownInstances) {
    doCleanup(instance)
  }
}

// we have unit tests that test indexedDB; we don't want this thing to run forever
// maxWait: a busy home stream inserts more often than every CLEANUP_DELAY, and a plain trailing
// debounce would then never fire, so IndexedDB would grow without bound.
export const scheduleCleanup = ZOCIAL_IS_BROWSER
  ? debounce(scheduledCleanup, CLEANUP_DELAY, { maxWait: CLEANUP_MAX_WAIT })
  : noop
