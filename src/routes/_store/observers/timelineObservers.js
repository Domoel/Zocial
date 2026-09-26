import { updateInstanceInfo } from '../../_actions/instances.js'
import { createStream } from '../../_actions/stream/streaming.js'
import { setupTimeline } from '../../_actions/timeline.js'
import { scheduleInterval } from '../../_utils/scheduleInterval.js'
import { getStreamingApi } from '../../_api/utils.js'
import { store } from '../store.js'

export function timelineObservers () {
  // stream to watch for local/federated/etc. updates. home and notification
  // updates are handled in instanceObservers.js
  let currentTimelineStream

  function shutdownPreviousStream () {
    if (currentTimelineStream) {
      currentTimelineStream.close()
      currentTimelineStream = null
      if (process.env.NODE_ENV !== 'production') {
        window.currentTimelineStream = null
      }
    }
  }

  function shouldObserveTimeline (timeline) {
    return timeline &&
      !(
        timeline !== 'local' &&
        timeline !== 'federated' &&
        timeline !== 'direct' &&
        !timeline.startsWith('list/') &&
        !timeline.startsWith('tag/')
      )
  }

  // Poll every 60s as a fallback for backends without streaming support.
  // setupTimeline has a 30s throttle, so if a fetch already happened recently this is a no-op.
  // Only poll while a Timeline component is mounted (mountedTimelines > 0) so we don't keep
  // fetching the last-viewed timeline on non-timeline pages. currentTimeline is also checked
  // for null-safety (setupTimeline calls currentTimeline.startsWith).
  // runOnActive:false because Timeline.html already calls setupTimeline on tab re-activation.
  scheduleInterval(function () {
    const { mountedTimelines, currentTimeline } = store.get()
    if (mountedTimelines > 0 && currentTimeline) {
      setupTimeline().catch(e => console.error('timeline poll failed', e))
    }
  }, 60000, false)

  // Keyed on the instance too: logging out (or switching accounts) changes only currentInstance —
  // the settings pages don't reset currentTimeline — and the old stream would otherwise keep running
  // with the old token, writing the logged-out account's posts back into IndexedDB.
  async function onTimelineOrInstanceChange () {
    if (!ZOCIAL_IS_BROWSER) {
      return
    }

    shutdownPreviousStream()

    const { currentTimeline, currentInstance, accessToken } = store.get()
    if (!shouldObserveTimeline(currentTimeline) || !currentInstance || !accessToken) {
      return
    }

    try {
      await updateInstanceInfo(currentInstance)
    } catch (e) {
      // no cached info and the fetch failed: the 60 s poll still covers this timeline
      console.warn('timeline stream: failed to load instance info:', (e && e.message) || e)
      return
    }

    const currentTimelineIsUnchanged = () => {
      const {
        currentInstance: newCurrentInstance,
        currentTimeline: newCurrentTimeline
      } = store.get()
      return newCurrentInstance === currentInstance &&
        newCurrentTimeline === currentTimeline
    }

    if (!currentTimelineIsUnchanged()) {
      return
    }

    const firstStatusId = store.getFirstTimelineItemId(currentInstance, currentTimeline)
    const { currentInstanceInfo } = store.get()
    const streamingApi = getStreamingApi(currentInstanceInfo)

    currentTimelineStream = createStream(streamingApi, currentInstance, accessToken,
      currentTimeline, firstStatusId)

    if (process.env.NODE_ENV !== 'production') {
      window.currentTimelineStream = currentTimelineStream
    }
  }

  store.observe('currentTimeline', onTimelineOrInstanceChange)
  store.observe('currentInstance', onTimelineOrInstanceChange, { init: false })
}
