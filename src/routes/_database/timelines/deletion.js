import { dbPromise, getDatabase } from '../databaseLifecycle.ts'
import {
  deleteFromCache, notificationsCache,
  statusesCache
} from '../cache.js'
import {
  ACCOUNT_ID,
  NOTIFICATION_TIMELINES_STORE,
  NOTIFICATIONS_STORE, PINNED_STATUSES_STORE,
  STATUS_TIMELINES_STORE,
  STATUSES_STORE,
  THREADS_STORE
} from '../constants.js'
import {
  createThreadKeyRange
} from '../keys.js'
import { deleteAll } from '../utils.js'

export async function deleteStatusesAndNotifications (instanceName, statusIds, notificationIds) {
  for (const statusId of statusIds) {
    deleteFromCache(statusesCache, instanceName, statusId)
  }
  for (const notificationId of notificationIds) {
    deleteFromCache(notificationsCache, instanceName, notificationId)
  }
  const db = await getDatabase(instanceName)
  const storeNames = [
    STATUSES_STORE,
    STATUS_TIMELINES_STORE,
    NOTIFICATIONS_STORE,
    NOTIFICATION_TIMELINES_STORE,
    PINNED_STATUSES_STORE,
    THREADS_STORE
  ]
  await dbPromise(db, storeNames, 'readwrite', (stores) => {
    const [
      statusesStore,
      statusTimelinesStore,
      notificationsStore,
      notificationTimelinesStore,
      pinnedStatusesStore,
      threadsStore
    ] = stores

    function deleteStatus (statusId) {
      statusesStore.delete(statusId)
      deleteAll(
        pinnedStatusesStore,
        pinnedStatusesStore.index('statusId'),
        IDBKeyRange.only(statusId)
      )
      deleteAll(
        statusTimelinesStore,
        statusTimelinesStore.index('statusId'),
        IDBKeyRange.only(statusId)
      )
      deleteAll(
        threadsStore,
        threadsStore.index('statusId'),
        IDBKeyRange.only(statusId)
      )
      deleteAll(
        threadsStore,
        threadsStore,
        createThreadKeyRange(statusId)
      )
    }

    function deleteNotification (notificationId) {
      notificationsStore.delete(notificationId)
      deleteAll(
        notificationTimelinesStore,
        notificationTimelinesStore.index('notificationId'),
        IDBKeyRange.only(notificationId)
      )
    }

    for (const statusId of statusIds) {
      deleteStatus(statusId)
    }
    for (const notificationId of notificationIds) {
      deleteNotification(notificationId)
    }
  })
}

// A status-timeline store key is `<timelineName>\u0000<reverseId>`. These match the timelines where
// *being followed* gates inclusion — the home feed and lists — and exclude local/federated/tag/
// account/thread feeds (which show posts regardless of whether you follow the author).
function isHomeOrListKey (key) {
  return typeof key === 'string' && (key.startsWith('home\u0000') || key.startsWith('list/'))
}

// Remove a given account's entries from the cached status timelines after unfollow/block, so their
// already-cached posts don't linger (the timeline merge is union-only and never unmerges). With
// `{ homeAndListsOnly: true }` only the follow-gated feeds (home + every list, loaded or not) are
// touched (unfollow); otherwise ALL status timelines are purged (block — nothing from them anywhere).
// Only the timeline *pointers* are removed; status bodies stay (they may be referenced by threads/
// notifications and age out via cleanup). For a boost the stored wrapper's ACCOUNT_ID is the booster,
// so this drops the account's own posts + their boosts, and keeps boosts of their content made by
// accounts you still follow (different ACCOUNT_ID).
export async function deleteTimelineItemsForAccount (instanceName, accountId, { homeAndListsOnly = false } = {}) {
  if (!accountId) {
    return
  }
  const db = await getDatabase(instanceName)
  await dbPromise(db, [STATUS_TIMELINES_STORE, STATUSES_STORE], 'readwrite', (stores) => {
    const [statusTimelinesStore, statusesStore] = stores
    statusTimelinesStore.openCursor().onsuccess = e => {
      const cursor = e.target.result
      if (!cursor) {
        return
      }
      const timelineKey = cursor.key
      // Skip out-of-scope feeds cheaply (no status lookup) when limited to home + lists.
      if (homeAndListsOnly && !isHomeOrListKey(timelineKey)) {
        cursor.continue()
        return
      }
      const statusId = cursor.value
      statusesStore.get(statusId).onsuccess = ev => {
        const status = ev.target.result
        if (status && status[ACCOUNT_ID] === accountId) {
          statusTimelinesStore.delete(timelineKey)
        }
      }
      cursor.continue()
    }
  })
}
