import { store } from '../_store/store.js'
import { get } from '../_utils/lodash-lite.js'
import {
  NOTIFICATION_REBLOGS,
  NOTIFICATION_FAVORITES,
  NOTIFICATION_FOLLOWS,
  NOTIFICATION_MENTIONS,
  NOTIFICATION_POLLS,
  NOTIFICATION_SUBSCRIPTIONS
} from '../_static/instanceSettings.js'

// In-page SOUND for a live streamed notification. Driven by the streaming `notification` event
// (processMessage.js), so each notification plays exactly once.
//
// NOTE (legacy name): this used to also raise a foreground OS popup ("System A"). OS notifications
// are now push-only (delivered by the service worker / Web Push), so this function only plays the
// in-app sound. The sound respects the in-app notification filter and the "Notification Sounds"
// toggle. See the notification system notes in Architecture.md §18.

// Maps a notification type to its in-app filter key (instanceSettings). Types not listed here
// (follow_request, admin.*, update, reaction) have no in-app toggle and are always allowed —
// matching how the notifications tab itself treats them.
const TYPE_TO_FILTER_KEY = {
  follow: NOTIFICATION_FOLLOWS,
  favourite: NOTIFICATION_FAVORITES,
  reblog: NOTIFICATION_REBLOGS,
  mention: NOTIFICATION_MENTIONS,
  poll: NOTIFICATION_POLLS,
  status: NOTIFICATION_SUBSCRIPTIONS
}

// Whether this notification type is shown in the in-app notifications tab for this instance. If
// the user filtered the type out there, it makes no sound either, so the foreground experience
// matches the notifications tab (and the badge).
function isAllowedByInAppFilter (type, currentInstance, instanceSettings) {
  const key = TYPE_TO_FILTER_KEY[type]
  if (!key) {
    return true
  }
  return get(instanceSettings, [currentInstance, key], true)
}

let audio

export function showDesktopNotification (instanceName, notification) {
  if (!ZOCIAL_IS_BROWSER || !notification || !notification.type) {
    return
  }
  const {
    currentInstance,
    disableNotificationSound,
    instanceSettings
  } = store.get()

  // Streaming only runs for the current instance, but guard anyway so a just-switched-away
  // instance can't make a sound.
  if (instanceName !== currentInstance) {
    return
  }

  // Respect the in-app notification filter: a type the user hid from the notifications tab
  // shouldn't make a sound either.
  if (!isAllowedByInAppFilter(notification.type, currentInstance, instanceSettings)) {
    return
  }

  if (!disableNotificationSound) {
    try {
      const played = (audio || (audio = new Audio('/boop.mp3'))).play()
      if (played && typeof played.catch === 'function') {
        played.catch(() => {})
      }
    } catch (_) {
      // ignore (older browsers where play() throws synchronously)
    }
  }
}
