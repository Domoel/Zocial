import { store } from '../_store/store.js'
import { getTimeline } from '../_api/timelines.js'
import { toast } from '../_components/toast/toast.js'
import { mark, stop } from '../_utils/marks.js'
import { concat, mergeArrays } from '../_utils/arrays.js'
import { compareTimelineItemSummaries } from '../_utils/statusIdSorting.js'
import { isEqual, uniqById } from '../_utils/lodash-lite.js'
import { database } from '../_database/database.js'
import { getStatus, getStatusContext } from '../_api/statuses.js'
import { emit } from '../_utils/eventBus.ts'
import { TIMELINE_BATCH_SIZE, LIST_BATCH_SIZE } from '../_static/timelines.js'
import { timelineItemToSummary } from '../_utils/timelineItemToSummary.ts'
import { addStatusesOrNotifications, insertUpdatesIntoTimeline } from './addStatusOrNotification.js'
import { scheduleIdleTask } from '../_utils/scheduleIdleTask.js'
import { isNetworkNoiseError } from '../_utils/isNetworkError.js'
import { sortItemSummariesForThread, sortItemSummariesForNotificationBatch } from '../_utils/sortItemSummaries.ts'
import { rehydrateStatusOrNotification } from './rehydrateStatusOrNotification.js'
import li from 'li'

async function storeFreshTimelineItemsInDatabase (instanceName, timelineName, items) {
  console.log('storeFreshTimelineItemsInDatabase start', timelineName)
  await database.insertTimelineItems(instanceName, timelineName, items)
  console.log('storeFreshTimelineItemsInDatabase inserted', timelineName)
}

async function updateStatus_ (instanceName, accessToken, statusId) {
  const status = await getStatus(instanceName, accessToken, statusId)
  await database.insertStatus(instanceName, status)
  return status
}

export async function updateStatus (instanceName, accessToken, statusId) {
  const status = await updateStatus_(instanceName, accessToken, statusId)
  await rehydrateStatusOrNotification({ status })
  emit('statusUpdated', status)
  return status
}

async function updateStatusAndThread (instanceName, accessToken, timelineName, statusId) {
  const [status, context] = await Promise.all([
    updateStatus_(instanceName, accessToken, statusId),
    getStatusContext(instanceName, accessToken, statusId).catch((e) => {
      console.warn('failed to load thread context:', e.message || e)
      return { ancestors: [], descendants: [] }
    })
  ])
  const newStatuses = concat(context.ancestors, status, context.descendants)
  await database.insertTimelineItems(
    instanceName,
    timelineName,
    newStatuses
  )
  addStatusesOrNotifications(instanceName, timelineName, newStatuses)
}

async function fetchFreshThreadFromNetwork (instanceName, accessToken, statusId) {
  const [status, context] = await Promise.all([
    getStatus(instanceName, accessToken, statusId),
    getStatusContext(instanceName, accessToken, statusId)
  ])
  return concat(context.ancestors, status, context.descendants)
}

async function fetchThreadFromNetwork (instanceName, accessToken, timelineName) {
  const statusId = timelineName.split('/').slice(-1)[0]

  // For threads, we do several optimizations to make it a bit faster to load.
  // The vast majority of statuses have no replies and aren't in reply to anything,
  // so we want that to be as fast as possible.
  const status = await database.getStatus(instanceName, statusId)
  if (!status) {
    // If for whatever reason the status is not cached, fetch everything from the network
    // and wait for the result. This happens in very unlikely cases (e.g. loading /statuses/<id>
    // where <id> is not cached locally) but is worth covering.
    return fetchFreshThreadFromNetwork(instanceName, accessToken, statusId)
  }

  if (!status.in_reply_to_id) {
    // status is not a reply to another status (fast path)
    // Update the status and thread asynchronously, but return just the status for now
    // Any replies to the status will load asynchronously
    /* no await */ updateStatusAndThread(instanceName, accessToken, timelineName, statusId)
    return [status]
  }
  // status is a reply to some other status, meaning we don't want some
  // jerky behavior where it suddenly scrolls into place. Update the status asynchronously
  // but grab the thread now
  scheduleIdleTask(() => updateStatus(instanceName, accessToken, statusId))
  const context = await getStatusContext(instanceName, accessToken, statusId)
  return concat(context.ancestors, status, context.descendants)
}

async function fetchTimelineItemsFromNetwork (instanceName, accessToken, timelineName, lastTimelineItemId) {
  if (timelineName.startsWith('status/')) { // special case - this is a list of descendents and ancestors
    return fetchThreadFromNetwork(instanceName, accessToken, timelineName)
  } else { // normal timeline
    // List timelines use a smaller batch so the per-list server query is cheaper/faster.
    const limit = timelineName.startsWith('list/') ? LIST_BATCH_SIZE : TIMELINE_BATCH_SIZE
    const { items } = await getTimeline(instanceName, accessToken, timelineName, lastTimelineItemId, null, limit)
    return items
  }
}
async function addPagedTimelineItems (instanceName, timelineName, items) {
  console.log('addPagedTimelineItems, length:', items.length)
  mark('addPagedTimelineItemSummaries')
  const newSummaries = items.map(item => timelineItemToSummary(item, instanceName))
  await addPagedTimelineItemSummaries(instanceName, timelineName, newSummaries)
  stop('addPagedTimelineItemSummaries')
}

export async function addPagedTimelineItemSummaries (instanceName, timelineName, newSummaries) {
  const [type, statusId] = timelineName.split('/')
  const oldSummaries = store.getForTimeline(instanceName, timelineName, 'timelineItemSummaries')

  if (type === 'notifications') {
    newSummaries = sortItemSummariesForNotificationBatch(newSummaries)
  }

  let mergedSummaries = uniqById(concat(oldSummaries || [], newSummaries))

  if (type === 'status') {
    mergedSummaries = sortItemSummariesForThread(mergedSummaries, statusId)
  }

  if (!isEqual(oldSummaries, mergedSummaries)) {
    store.setForTimeline(instanceName, timelineName, { timelineItemSummaries: mergedSummaries })
  }
}

async function fetchPagedItems (instanceName, accessToken, timelineName) {
  const { timelineNextPageId } = store.get()
  console.log('saved timelineNextPageId', timelineNextPageId)
  const { items, headers } = await getTimeline(instanceName, accessToken, timelineName, timelineNextPageId, null, TIMELINE_BATCH_SIZE)
  const linkHeader = headers.get('Link')
  const parsedLinkHeader = li.parse(linkHeader)
  const nextUrl = parsedLinkHeader && parsedLinkHeader.next
  const nextId = nextUrl && (new URL(nextUrl)).searchParams.get('max_id')
  console.log('new timelineNextPageId', nextId)
  store.setForTimeline(instanceName, timelineName, { timelineNextPageId: nextId })
  await storeFreshTimelineItemsInDatabase(instanceName, timelineName, items)
  await addPagedTimelineItems(instanceName, timelineName, items)
}

async function fetchTimelineItems (instanceName, accessToken, timelineName, online, maxId) {
  mark('fetchTimelineItems')
  // maxId=undefined → use store (pagination); maxId=null → no max_id (fresh fetch)
  const itemId = maxId !== undefined ? maxId : store.get().lastTimelineItemId
  let items
  let stale = false
  if (!online) {
    items = await database.getTimeline(instanceName, timelineName, itemId, TIMELINE_BATCH_SIZE)
    stale = true
  } else {
    try {
      console.log('fetchTimelineItemsFromNetwork')
      items = await fetchTimelineItemsFromNetwork(instanceName, accessToken, timelineName, itemId)
      // DB write is for offline caching only — render immediately without waiting for it.
      /* no await */ storeFreshTimelineItemsInDatabase(instanceName, timelineName, items)
    } catch (e) {
      // Every branch below handles the failure gracefully (cached content / empty list /
      // offline toast). Transient network noise (timeout, dropped connection, expected HTTP
      // errors) is therefore not a code bug — log it as warn so genuine exceptions stay
      // visually distinct as errors.
      if (isNetworkNoiseError(e)) {
        // Log the readable message (e.g. "Timed out after 20 seconds") rather than the bare Error,
        // whose minified .stack is unreadable in the in-app log viewer.
        console.warn('timeline fetch failed:', e.message || e)
      } else {
        console.error(e)
      }
      if (e.status && timelineName.startsWith('list/')) {
        // Server returned an HTTP error for a list timeline (e.g. GoToSocial returns
        // an error for empty lists). Not a network/offline issue — show empty timeline.
        items = []
      } else if (timelineName.startsWith('list/')) {
        // Non-HTTP failure (timeout, transient network blip) on a list timeline: fall
        // back to cached content without a toast. List timelines re-fetch every ~60 s
        // so transient errors here produce noisy "offline" toasts even when the user's
        // connection is fine. Genuine offline state is visible via other timelines.
        items = await database.getTimeline(instanceName, timelineName, itemId, TIMELINE_BATCH_SIZE)
        stale = true
      } else {
        /* no await */ toast.say('intl.showingOfflineContent')
        items = await database.getTimeline(instanceName, timelineName, itemId, TIMELINE_BATCH_SIZE)
        stale = true
      }
    }
  }
  stop('fetchTimelineItems')
  return { items, stale }
}

async function addTimelineItems (instanceName, timelineName, items, stale) {
  console.log('addTimelineItems, length:', items.length)
  mark('addTimelineItemSummaries')
  const newSummaries = items.map(item => timelineItemToSummary(item, instanceName))
  addTimelineItemSummaries(instanceName, timelineName, newSummaries, stale)
  stop('addTimelineItemSummaries')
}

export async function addTimelineItemSummaries (instanceName, timelineName, newSummaries, newStale) {
  const [type, statusId] = timelineName.split('/')
  const oldSummaries = store.getForTimeline(instanceName, timelineName, 'timelineItemSummaries')
  const oldStale = store.getForTimeline(instanceName, timelineName, 'timelineItemSummariesAreStale')

  if (type === 'notifications') {
    newSummaries = sortItemSummariesForNotificationBatch(newSummaries)
  }

  let mergedSummaries = uniqById(mergeArrays(oldSummaries || [], newSummaries, compareTimelineItemSummaries))

  if (type === 'status') {
    mergedSummaries = sortItemSummariesForThread(mergedSummaries, statusId)
  }

  if (!isEqual(oldSummaries, mergedSummaries)) {
    store.setForTimeline(instanceName, timelineName, { timelineItemSummaries: mergedSummaries })
  }
  if (oldStale !== newStale) {
    store.setForTimeline(instanceName, timelineName, { timelineItemSummariesAreStale: newStale })
  }
}

async function fetchTimelineItemsAndPossiblyFallBack (fresh, isInitialLoad) {
  console.log('fetchTimelineItemsAndPossiblyFallBack')
  mark('fetchTimelineItemsAndPossiblyFallBack')
  const {
    currentTimeline,
    currentInstance,
    accessToken,
    online
  } = store.get()

  if (currentTimeline === 'favorites' || currentTimeline === 'bookmarks') {
    // Always fetch favorites from the network, we currently don't have a good way of storing
    // these in IndexedDB because of "internal ID" system Mastodon uses to paginate these
    await fetchPagedItems(currentInstance, accessToken, currentTimeline)
  } else {
    // fresh=true (navigate/poll refresh): pass null so no max_id is sent → fetches newest posts.
    // fresh=false/undefined (pagination): pass undefined to fall back to lastTimelineItemId from
    // the store → fetches posts older than the bottom of the current list.
    const maxId = fresh ? null : undefined
    const { items, stale } = await fetchTimelineItems(currentInstance, accessToken, currentTimeline, online, maxId)
    // When refreshing a timeline that already has content and we got fresh (non-stale) data,
    // route new items through the streaming buffer so Timeline.html can decide whether to
    // insert immediately (user at top) or show a "Show X more" button (user scrolled down).
    // This prevents scroll-position jumps when the 60s poll or a re-navigate brings in new posts.
    // For initial loads (incl. a cache-first prefill, where existingSummaries holds placeholder
    // cache the user hasn't scrolled into yet) or offline fallback, merge directly instead — there
    // is no scroll position to protect, and buffering would surface a spurious "Show X more".
    const existingSummaries = store.getForTimeline(currentInstance, currentTimeline, 'timelineItemSummaries')
    if (fresh && !stale && !isInitialLoad && existingSummaries && existingSummaries.length > 0) {
      await insertUpdatesIntoTimeline(currentInstance, currentTimeline, items)
      // We just refreshed with fresh network data; clear any stale marker (e.g. left by a cache
      // prefill or a previous offline fallback). Otherwise hasFreshCache stays false and the
      // timeline keeps bypassing the 30s fetch throttle, re-fetching on every setupTimeline call.
      if (store.getForTimeline(currentInstance, currentTimeline, 'timelineItemSummariesAreStale')) {
        store.setForTimeline(currentInstance, currentTimeline, { timelineItemSummariesAreStale: false })
      }
    } else {
      await addTimelineItems(currentInstance, currentTimeline, items, stale)
    }
  }
  stop('fetchTimelineItemsAndPossiblyFallBack')
}

// Cache-first applies to the normal IndexedDB-backed scrollable timelines: on a cold load, render
// the last-seen items from IndexedDB immediately, then refresh from the network — so the user never
// stares at a blank spinner while a fetch is in flight (most valuable on slow/mobile connections).
// It degrades safely: if a timeline has no cache, the prefill simply no-ops.
//
// Excluded — these don't go through the normal getTimeline/IDB-timeline path:
//   - status/* (threads): fetched and merged via fetchThreadFromNetwork with thread-specific sorting
//   - favorites / bookmarks: paged via Link headers (fetchPagedItems), not in the IDB timeline cache
function isCacheFirstTimeline (timelineName) {
  return !timelineName.startsWith('status/') &&
    timelineName !== 'favorites' &&
    timelineName !== 'bookmarks'
}

// Render cached items from IndexedDB immediately (marked stale) so the network fetch doesn't leave
// the user staring at a blank screen on a cold load. The caller still runs the network fetch
// afterwards, which refreshes the content (or silently keeps the cache on failure).
async function prefillCurrentTimelineFromCache (instanceName, timelineName) {
  try {
    const items = await database.getTimeline(instanceName, timelineName, null, TIMELINE_BATCH_SIZE)
    if (items && items.length) {
      await addTimelineItems(instanceName, timelineName, items, /* stale */ true)
    }
  } catch (e) {
    console.warn('timeline cache prefill failed:', e.message || e)
  }
}

export async function setupTimeline () {
  console.log('setupTimeline')
  mark('setupTimeline')
  // If we don't have any item summaries, or if the current item summaries are stale
  // (i.e. via offline mode), then we need to re-fetch
  // Also do this if it's a thread, because threads change pretty frequently and
  // we don't have a good way to update them.
  const {
    timelineItemSummaries,
    timelineItemSummariesAreStale,
    currentTimeline,
    currentInstance
  } = store.get()
  console.log('setupTimeline state', { currentTimeline, timelineItemSummariesAreStale })
  // True when the store had no summaries for this timeline yet, i.e. this is a cold initial load
  // (not a refresh of already-displayed content). Captured before the cache-first prefill below
  // populates the store, so the fetch knows to merge directly instead of buffering.
  const isInitialLoad = !timelineItemSummaries
  // Cache-first: on a cold store, show cached items right away from IndexedDB so the user isn't
  // blocked on the network fetch. We then fall through to the normal fetch below — which still runs
  // and refreshes the content (the prefilled summaries are marked stale, so the fetch is never
  // skipped, and isInitialLoad makes that fetch merge directly rather than buffer). See
  // isCacheFirstTimeline for which timelines this covers.
  if (!timelineItemSummaries && isCacheFirstTimeline(currentTimeline)) {
    await prefillCurrentTimelineFromCache(currentInstance, currentTimeline)
  }
  // home and notifications maintain a continuous background stream and never
  // go stale between visits — skip the fetch if they have a warm cache.
  // Every other timeline only streams while the page is open, so fetch on
  // navigate, but throttle to once per 30 s to avoid redundant requests
  // when the user switches between timelines rapidly.
  const hasFreshCache = timelineItemSummaries && !timelineItemSummariesAreStale
  const alwaysStreaming = currentTimeline === 'home' || (!!currentTimeline && currentTimeline.startsWith('notifications'))
  const lastFetchedAt = store.getForTimeline(currentInstance, currentTimeline, 'lastFetchedAt')
  const fetchedRecently = lastFetchedAt && (Date.now() - lastFetchedAt < 30_000)
  if (!hasFreshCache || (!alwaysStreaming && !fetchedRecently)) {
    // Clear stale buffered items before fetching so the "new posts" button
    // doesn't show items that the fresh fetch is about to include directly.
    store.setForCurrentTimeline({ timelineItemSummariesToAdd: [] })
    await fetchTimelineItemsAndPossiblyFallBack(true, isInitialLoad)
    store.setForCurrentTimeline({ lastFetchedAt: Date.now() })
  }
  stop('setupTimeline')
}

export async function fetchMoreItemsAtBottomOfTimeline (instanceName, timelineName) {
  console.log('setting runningUpdate: true')
  store.setForTimeline(instanceName, timelineName, { runningUpdate: true })
  await fetchTimelineItemsAndPossiblyFallBack()
  console.log('setting runningUpdate: false')
  store.setForTimeline(instanceName, timelineName, { runningUpdate: false })
}

export async function showMoreItemsForTimeline (instanceName, timelineName) {
  mark('showMoreItemsForTimeline')
  let itemSummariesToAdd = store.getForTimeline(instanceName, timelineName, 'timelineItemSummariesToAdd') || []
  itemSummariesToAdd = itemSummariesToAdd.sort(compareTimelineItemSummaries).reverse()
  addTimelineItemSummaries(instanceName, timelineName, itemSummariesToAdd, false)
  store.setForTimeline(instanceName, timelineName, {
    timelineItemSummariesToAdd: [],
    shouldShowHeader: false,
    showHeader: false
  })
  stop('showMoreItemsForTimeline')
}

export function showMoreItemsForCurrentTimeline () {
  const { currentInstance, currentTimeline } = store.get()
  return showMoreItemsForTimeline(
    currentInstance,
    currentTimeline
  )
}

export async function showMoreItemsForThread (instanceName, timelineName) {
  mark('showMoreItemsForThread')
  const itemSummariesToAdd = store.getForTimeline(instanceName, timelineName, 'timelineItemSummariesToAdd')
  const timelineItemSummaries = store.getForTimeline(instanceName, timelineName, 'timelineItemSummaries')
  const timelineItemIds = new Set(timelineItemSummaries.map(_ => _.id))
  // TODO: update database and do the thread merge correctly
  for (const itemSummaryToAdd of itemSummariesToAdd) {
    if (!timelineItemIds.has(itemSummaryToAdd.id)) {
      timelineItemSummaries.push(itemSummaryToAdd)
    }
  }
  const statusId = timelineName.split('/').slice(-1)[0]
  const sortedTimelineItemSummaries = sortItemSummariesForThread(timelineItemSummaries, statusId)
  store.setForTimeline(instanceName, timelineName, {
    timelineItemSummariesToAdd: [],
    timelineItemSummaries: sortedTimelineItemSummaries
  })
  stop('showMoreItemsForThread')
}
