import { database } from '../_database/database.js'
import { mark, stop } from '../_utils/marks.js'
import { rehydrateStatusOrNotification } from './rehydrateStatusOrNotification.js'
import { store } from '../_store/store.js'
import { removeUnstoredItemFromStore } from './deleteStatuses.js'

async function getNotification (instanceName, timelineType, timelineValue, itemId) {
  return {
    timelineType,
    timelineValue,
    notification: await database.getNotification(instanceName, itemId)
  }
}

async function getStatus (instanceName, timelineType, timelineValue, itemId) {
  return {
    timelineType,
    timelineValue,
    status: await database.getStatus(instanceName, itemId)
  }
}

// The body (or its author record) can be missing from IndexedDB after the age cleanup: statuses and
// accounts are cleaned up by their own timestamps, and an update restamps only the status.
function isRenderableStatus (status) {
  return !!(status && status.account && (!status.reblog || status.reblog.account))
}

function isRenderableNotification (notification) {
  return !!(notification && notification.account && (!notification.status || isRenderableStatus(notification.status)))
}

export function createMakeProps (instanceName, timelineType, timelineValue) {
  let promiseChain = Promise.resolve()
  async function fetchFromIndexedDB (itemId) {
    mark(`fetchFromIndexedDB-${itemId}`)
    try {
      const isNotification = timelineType === 'notifications'
      const res = await (isNotification
        ? getNotification(instanceName, timelineType, timelineValue, itemId)
        : getStatus(instanceName, timelineType, timelineValue, itemId))
      if (!(isNotification ? isRenderableNotification(res.notification) : isRenderableStatus(res.status))) {
        // Rendering undefined would throw in a computed and blank the item; the next fetch of the
        // timeline brings the post back if it still exists.
        console.warn('timeline item is no longer stored, dropping it:', itemId)
        removeUnstoredItemFromStore(instanceName, itemId, isNotification)
        return null
      }
      const instanceDataReady = store.getInstanceData(instanceName, 'instanceDataReady')
      await instanceDataReady
      await rehydrateStatusOrNotification(res)
      return res
    } finally {
      stop(`fetchFromIndexedDB-${itemId}`)
    }
  }

  async function getStatusOrNotification (itemId) {
    const statusOrNotification = await fetchFromIndexedDB(itemId)
    return statusOrNotification
  }

  // The results from IndexedDB or the worker thread can return in random order,
  // so we ensure consistent ordering based on the order this function is called in.
  return itemSummary => {
    const getStatusOrNotificationPromise = getStatusOrNotification(itemSummary.id) // start the promise ASAP
    return new Promise((resolve, reject) => {
      promiseChain = promiseChain
        .then(() => getStatusOrNotificationPromise)
        .then(resolve, reject)
    })
  }
}
