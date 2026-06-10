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
      setupTimeline()
    }
  }, 60000, false)

  store.observe('currentTimeline', async (currentTimeline) => {
    if (!ZOCIAL_IS_BROWSER) {
      return
    }

    shutdownPreviousStream()

    if (!shouldObserveTimeline(currentTimeline)) {
      return
    }

    const { currentInstance } = store.get()
    const { accessToken } = store.get()
    await updateInstanceInfo(currentInstance)

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
  })
}
