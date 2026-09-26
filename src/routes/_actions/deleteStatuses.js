import { getIdsThatRebloggedThisStatus, getNotificationIdsForStatuses } from './statuses.js'
import { store } from '../_store/store.js'
import { database } from '../_database/database.js'
import { scheduleIdleTask } from '../_utils/scheduleIdleTask.js'

function filterItemIdsFromTimelines (instanceName, timelineFilter, idFilter) {
  const keys = ['timelineItemSummaries', 'timelineItemSummariesToAdd']
  const summaryFilter = _ => idFilter(_.id)

  keys.forEach(key => {
    const timelineData = store.getAllTimelineData(instanceName, key)
    Object.keys(timelineData).forEach(timelineName => {
      const summaries = timelineData[timelineName]
      if (!timelineFilter(timelineName)) {
        return
      }
      const filteredSummaries = summaries.filter(summaryFilter)
      // filter() can only remove, so the length tells whether anything changed — this runs for
      // every visited timeline on every streamed delete, often with thousands of items
      if (filteredSummaries.length !== summaries.length) {
        store.setForTimeline(instanceName, timelineName, {
          [key]: filteredSummaries
        })
      }
    })
  })
}

// 'notifications' and 'notifications/mentions' hold notification ids; every other timeline holds status ids
const isNotificationTimeline = timelineName => timelineName === 'notifications' || timelineName.startsWith('notifications/')
const notNotificationTimeline = timelineName => !isNotificationTimeline(timelineName)

function deleteStatusIdsFromStore (instanceName, idsToDelete) {
  const idsToDeleteSet = new Set(idsToDelete)
  const idWasNotDeleted = id => !idsToDeleteSet.has(id)

  filterItemIdsFromTimelines(instanceName, notNotificationTimeline, idWasNotDeleted)
}

function deleteNotificationIdsFromStore (instanceName, idsToDelete) {
  const idsToDeleteSet = new Set(idsToDelete)
  const idWasNotDeleted = id => !idsToDeleteSet.has(id)

  filterItemIdsFromTimelines(instanceName, isNotificationTimeline, idWasNotDeleted)
}

// A timeline item whose body is no longer in IndexedDB (age cleanup, a delete that reached the DB
// first) can't be rendered: drop it from the in-memory timelines instead.
export function removeUnstoredItemFromStore (instanceName, itemId, isNotification) {
  if (isNotification) {
    deleteNotificationIdsFromStore(instanceName, [itemId])
  } else {
    deleteStatusIdsFromStore(instanceName, [itemId])
  }
}

async function deleteStatusesAndNotifications (instanceName, statusIdsToDelete, notificationIdsToDelete) {
  deleteStatusIdsFromStore(instanceName, statusIdsToDelete)
  deleteNotificationIdsFromStore(instanceName, notificationIdsToDelete)
  await database.deleteStatusesAndNotifications(instanceName, statusIdsToDelete, notificationIdsToDelete)
}

async function doDeleteStatus (instanceName, statusId) {
  const rebloggedIds = await getIdsThatRebloggedThisStatus(instanceName, statusId)
  const statusIdsToDelete = Array.from(new Set([statusId].concat(rebloggedIds).filter(Boolean)))
  const notificationIdsToDelete = Array.from(new Set(await getNotificationIdsForStatuses(instanceName, statusIdsToDelete)))
  await deleteStatusesAndNotifications(instanceName, statusIdsToDelete, notificationIdsToDelete)
}

export function deleteStatus (instanceName, statusId) {
  scheduleIdleTask(() => {
    /* no await */ doDeleteStatus(instanceName, statusId)
  })
}
