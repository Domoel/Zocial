import { mark, stop } from '../_utils/marks.js'
import { store } from '../_store/store.js'
import { database } from '../_database/database.js'
import { concat } from '../_utils/arrays.js'
import { arraysEqual, isEqual, uniqById } from '../_utils/lodash-lite.js'
import { scheduleIdleTask } from '../_utils/scheduleIdleTask.js'
import { timelineItemToSummary } from '../_utils/timelineItemToSummary.ts'
import { compareTimelineItemSummaries } from '../_utils/statusIdSorting.js'
import { MAX_TIMELINE_ITEMS } from '../_static/timelines.js'

function getExistingItemIdsSet (instanceName, timelineName) {
  const timelineItemSummaries = store.getForTimeline(instanceName, timelineName, 'timelineItemSummaries') || []
  return new Set(timelineItemSummaries.map(_ => _.id))
}

function removeDuplicates (instanceName, timelineName, updates) {
  // remove duplicates, including duplicates due to reblogs
  const existingItemIds = getExistingItemIdsSet(instanceName, timelineName)
  return updates.filter(update => !existingItemIds.has(update.id))
}

// The merge keeps the existing summary for an id that is already listed, so flags derived from the
// server's current view would never update in a session: a quote of an account muted (or unmuted)
// since, or an edit that now (no longer) matches a filter. Take them from the fresh copy; the other
// fields (thread structure) stay.
export function refreshServerDerivedFlags (mergedSummaries, freshSummaries) {
  const freshById = new Map(freshSummaries.map(summary => [summary.id, summary]))
  return mergedSummaries.map(summary => {
    const fresh = freshById.get(summary.id)
    if (!fresh || fresh === summary ||
        (fresh.quoteHidden === summary.quoteHidden && isEqual(fresh.filterContexts, summary.filterContexts))) {
      return summary
    }
    return Object.assign({}, summary, { quoteHidden: fresh.quoteHidden, filterContexts: fresh.filterContexts })
  })
}

// A refresh (poll, revisit) mostly returns posts that are already listed; they are dropped below,
// but their fresh flags still apply to the listed copies.
function refreshListedSummaries (instanceName, timelineName, updates) {
  const summaries = store.getForTimeline(instanceName, timelineName, 'timelineItemSummaries')
  if (!summaries || !summaries.length) {
    return
  }
  const listedIds = new Set(summaries.map(_ => _.id))
  const listedUpdates = updates.filter(update => listedIds.has(update.id))
  if (!listedUpdates.length) {
    return
  }
  const refreshed = refreshServerDerivedFlags(summaries, listedUpdates.map(item => timelineItemToSummary(item, instanceName)))
  if (!arraysEqual(summaries, refreshed)) {
    store.setForTimeline(instanceName, timelineName, { timelineItemSummaries: refreshed })
  }
}

export async function insertUpdatesIntoTimeline (instanceName, timelineName, updates) {
  refreshListedSummaries(instanceName, timelineName, updates)
  updates = removeDuplicates(instanceName, timelineName, updates)

  if (!updates.length) {
    return
  }

  // insertTimelineItems fills the in-memory cache before its IndexedDB write, so the items still
  // render if the write fails (quota, aborted transaction) — don't let that swallow the update.
  try {
    await database.insertTimelineItems(instanceName, timelineName, updates)
  } catch (e) {
    console.warn('failed to store timeline updates:', (e && e.message) || e)
  }

  const itemSummariesToAdd = store.getForTimeline(instanceName, timelineName, 'timelineItemSummariesToAdd') || []
  let newItemSummariesToAdd = uniqById(
    concat(itemSummariesToAdd, updates.map(item => timelineItemToSummary(item, instanceName)))
  )
  if (newItemSummariesToAdd.length > MAX_TIMELINE_ITEMS) {
    // Nobody has looked at this timeline for a long while (scrolled down, or another page is open):
    // keep only the newest posts. Mark it, so showing them replaces the list instead of merging
    // across the gap left by the dropped ones.
    newItemSummariesToAdd = newItemSummariesToAdd.slice().sort(compareTimelineItemSummaries).slice(-MAX_TIMELINE_ITEMS)
    store.setForTimeline(instanceName, timelineName, { timelineItemSummariesToAddTruncated: true })
  }
  if (!arraysEqual(itemSummariesToAdd, newItemSummariesToAdd)) {
    store.setForTimeline(instanceName, timelineName, { timelineItemSummariesToAdd: newItemSummariesToAdd })
  }
}

function isValidStatusForThread (thread, timelineName, itemSummariesToAdd) {
  const itemSummariesToAddIdSet = new Set(itemSummariesToAdd.map(_ => _.id))
  const threadIdSet = new Set(thread.map(_ => _.id))
  const focusedStatusId = timelineName.split('/')[1] // e.g. "status/123456"
  const focusedStatusIdx = thread.findIndex(_ => _.id === focusedStatusId)
  if (focusedStatusIdx === -1) {
    // the thread failed to load (404) or its status was deleted: an unknown parent would compare
    // -1 >= -1 below and every streamed reply would be collected into this thread
    return () => false
  }
  return status => {
    const repliedToStatusIdx = thread.findIndex(_ => _.id === status.in_reply_to_id)
    return (
      // A reply to an ancestor status is not valid for this thread, but for the focused status
      // itself or any of its descendents, it is valid.
      repliedToStatusIdx >= focusedStatusIdx &&
      // Not a duplicate
      !threadIdSet.has(status.id) &&
      // Not already about to be added
      !itemSummariesToAddIdSet.has(status.id)
    )
  }
}

async function insertUpdatesIntoThreads (instanceName, updates) {
  if (!updates.length) {
    return
  }

  const threads = store.getThreads(instanceName)
  const timelineNames = Object.keys(threads)
  for (const timelineName of timelineNames) {
    const thread = threads[timelineName]

    const itemSummariesToAdd = store.getForTimeline(instanceName, timelineName, 'timelineItemSummariesToAdd') || []
    const validUpdates = updates.filter(isValidStatusForThread(thread, timelineName, itemSummariesToAdd))
    if (!validUpdates.length) {
      continue
    }
    const newItemSummariesToAdd = uniqById(concat(itemSummariesToAdd, validUpdates.map(item => timelineItemToSummary(item, instanceName))))
    if (!arraysEqual(itemSummariesToAdd, newItemSummariesToAdd)) {
      store.setForTimeline(instanceName, timelineName, { timelineItemSummariesToAdd: newItemSummariesToAdd })
    }
  }
}

async function processFreshUpdates (instanceName, timelineName) {
  mark('processFreshUpdates')
  const freshUpdates = store.getForTimeline(instanceName, timelineName, 'freshUpdates')
  if (freshUpdates && freshUpdates.length) {
    const updates = freshUpdates.slice()
    store.setForTimeline(instanceName, timelineName, { freshUpdates: [] })

    await Promise.all([
      insertUpdatesIntoTimeline(instanceName, timelineName, updates),
      insertUpdatesIntoThreads(instanceName, updates.filter(status => status.in_reply_to_id))
    ])
  }
  stop('processFreshUpdates')
}

function lazilyProcessFreshUpdates (instanceName, timelineName) {
  scheduleIdleTask(() => {
    processFreshUpdates(instanceName, timelineName).catch(err => {
      console.error('processFreshUpdates failed', instanceName, timelineName, err)
    })
  })
}

export function addStatusOrNotification (instanceName, timelineName, newStatusOrNotification) {
  addStatusesOrNotifications(instanceName, timelineName, [newStatusOrNotification])
}

export async function addStatusesOrNotifications (instanceName, timelineName, newStatusesOrNotifications) {
  let freshUpdates = store.getForTimeline(instanceName, timelineName, 'freshUpdates') || []
  freshUpdates = concat(newStatusesOrNotifications, freshUpdates)
  freshUpdates = uniqById(freshUpdates)
  store.setForTimeline(instanceName, timelineName, { freshUpdates })
  lazilyProcessFreshUpdates(instanceName, timelineName)
}
