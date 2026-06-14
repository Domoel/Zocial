import { TimelineStream } from '../../_api/stream/TimelineStream.js'
import { processMessage } from './processMessage.js'
import { fillStreamingGap } from './fillStreamingGap.js'
import { store } from '../../_store/store.js'

export function createStream (api, instanceName, accessToken, timelineName, firstStatusId, firstNotificationId) {

  const fillGap = (timelineName, timelineItemId) => {
    if (timelineItemId) {
      /* no await */ fillStreamingGap(instanceName, accessToken, timelineName, timelineItemId)
    }
  }

  const onMessage = message => {
    processMessage(instanceName, timelineName, message)
  }

  const onOpen = () => {
    fillGap(timelineName, firstStatusId)
    if (timelineName === 'home') {
      // special case - home timeline stream also handles notifications
      fillGap('notifications', firstNotificationId)
    }
  }

  const onClose = () => {
  }

  const onReconnect = () => {
    // When reconnecting, we recompute the firstStatusId and firstNotificationId because these may have
    // changed since we first started streaming.
    const newFirstStatusId = store.getFirstTimelineItemId(instanceName, timelineName)
    fillGap(timelineName, newFirstStatusId)
    if (timelineName === 'home') {
      // special case - home timeline stream also handles notifications
      const newFirstNotificationId = store.getFirstTimelineItemId(instanceName, 'notifications')
      fillGap('notifications', newFirstNotificationId)
    }
  }

  const stream = new TimelineStream(api, accessToken, timelineName)
  stream.on('message', onMessage)
  stream.on('open', onOpen)
  stream.on('close', onClose)
  stream.on('reconnect', onReconnect)
  return stream
}
