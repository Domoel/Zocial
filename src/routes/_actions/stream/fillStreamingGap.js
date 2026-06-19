import { addStatusesOrNotifications } from '../addStatusOrNotification.js'
import { getTimeline } from '../../_api/timelines.js'
import { isNetworkNoiseError } from '../../_utils/isNetworkError.js'
import { TIMELINE_BATCH_SIZE, LIST_BATCH_SIZE } from '../../_static/timelines.js'

const MAX_NUM_REQUESTS = 15 // to avoid getting caught in an infinite loop somehow
// Slow, server-assembled timelines (per-list / per-tag) are expensive to query and frequently time
// out or drop the connection mid-response. A long multi-request gap-fill on them runs many slow
// queries back-to-back, each able to fail — so cap them tightly; ongoing streaming, the 60s poll,
// and infinite scroll backfill anything beyond this.
const MAX_NUM_REQUESTS_SLOW = 2

// fill in the "streaming gap" – i.e. fetch the most recent items so that there isn't
// a big gap in the timeline if you haven't looked at it in awhile
export async function fillStreamingGap (instanceName, accessToken, timelineName, firstTimelineItemId) {
  const isSlowTimeline = timelineName.startsWith('list/') || timelineName.startsWith('tag/')
  // Lists use the smaller list batch (cheaper per-list server query); other timelines keep the
  // standard batch. The slow-read timeout is applied inside getTimeline by timeline name.
  const batchSize = timelineName.startsWith('list/') ? LIST_BATCH_SIZE : TIMELINE_BATCH_SIZE
  const maxRequests = isSlowTimeline ? MAX_NUM_REQUESTS_SLOW : MAX_NUM_REQUESTS
  let maxId = null
  let numRequests = 0
  let newTimelineItems

  try {
    do {
      numRequests++
      newTimelineItems = (await getTimeline(instanceName, accessToken,
        timelineName, maxId, firstTimelineItemId, batchSize)).items
      if (newTimelineItems.length) {
        addStatusesOrNotifications(instanceName, timelineName, newTimelineItems)
        maxId = newTimelineItems[newTimelineItems.length - 1].id
      }
    } while (numRequests < maxRequests && newTimelineItems.length === batchSize)
  } catch (e) {
    // This runs fire-and-forget (see streaming.js), so an unhandled throw becomes an uncaught
    // promise rejection. The gap-fill is best-effort catch-up: a failure is recovered by ongoing
    // streaming + the 60s poll, so degrade gracefully. Slow list/tag endpoints time out or drop the
    // connection here most often; classify like the main fetch path — transient noise → warn,
    // genuine bug → error.
    if (isNetworkNoiseError(e)) {
      console.warn('streaming gap fill failed:', timelineName, '·', e.message || e)
    } else {
      console.error('streaming gap fill failed:', timelineName, e)
    }
  }
}
