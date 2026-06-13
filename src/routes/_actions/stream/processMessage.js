import { mark, stop } from '../../_utils/marks.js'
import { deleteStatus } from '../deleteStatuses.js'
import { addStatusOrNotification } from '../addStatusOrNotification.js'
import { emit } from '../../_utils/eventBus.ts'
import { updateStatus } from '../updateStatus.js'
import { showDesktopNotification } from '../showDesktopNotification.js'

const KNOWN_EVENTS = ['update', 'delete', 'notification', 'conversation', 'filters_changed', 'status.update']

export function processMessage (instanceName, timelineName, message) {
  let { event, payload } = (message || {})
  if (!KNOWN_EVENTS.includes(event)) {
    console.warn('ignoring message from server', message)
    return
  }
  mark('processMessage')
  if (['update', 'notification', 'conversation', 'status.update'].includes(event)) {
    // These payloads are double-JSON-encoded by Mastodon. Guard the parse so a single malformed
    // frame can't throw out of the websocket onmessage handler (safeParse on the outer message
    // does NOT cover this — it still throws on invalid JSON).
    try {
      payload = JSON.parse(payload)
    } catch (e) {
      console.warn('ignoring message with unparseable payload', event, (e && e.message) || e)
      stop('processMessage')
      return
    }
  }

  switch (event) {
    case 'delete':
      deleteStatus(instanceName, payload)
      break
    case 'update':
      addStatusOrNotification(instanceName, timelineName, payload)
      break
    case 'notification':
      addStatusOrNotification(instanceName, 'notifications', payload)
      if (payload.type === 'mention') {
        addStatusOrNotification(instanceName, 'notifications/mentions', payload)
      }
      showDesktopNotification(instanceName, payload)
      break
    case 'conversation':
      // This is a hack in order to mostly fit the conversation model into
      // a timeline of statuses. To have a clean implementation we would need to
      // reproduce what is done for statuses for the conversation.
      //
      // It will add new DMs as new conversations instead of updating existing threads
      if (payload.last_status) {
        // If the last_status doesn't exist, just ignore it. There's not much we can do in that case
        addStatusOrNotification(instanceName, timelineName, payload.last_status)
      }
      break
    case 'filters_changed':
      emit('wordFiltersChanged', instanceName)
      break
    case 'status.update':
      updateStatus(instanceName, payload)
      break
  }
  stop('processMessage')
}
