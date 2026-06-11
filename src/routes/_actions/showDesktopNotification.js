import { store } from '../_store/store.js'
import { describeNotification } from './notificationContent.js'

// In-page sound + OS popup for a live streamed notification (System A). Driven by the streaming
// `notification` event (processMessage.js), where the full payload is available, rather than by
// a count delta — so each notification fires exactly once with real content.
//
// Sound always plays (when not disabled) regardless of tab visibility or push state.
// OS popup is only shown when the tab is hidden AND there is no push subscription:
//   - Tab visible   → user sees the app directly; sound + in-app indicators are enough
//   - Tab hidden + push active → service worker (System B) delivers the OS notification
//   - Tab hidden + no push   → System A is the only path to an OS notification
// See the notification system notes in Architecture.md §18.

let audio

export function showDesktopNotification (instanceName, notification) {
  if (!ZOCIAL_IS_BROWSER || !notification || !notification.type) {
    return
  }
  const {
    currentInstance,
    enableDesktopNotifications,
    disableNotificationSound,
    currentPushSubscription
  } = store.get()

  // Streaming only runs for the current instance, but guard anyway so a just-switched-away
  // instance can't pop a notification.
  if (instanceName !== currentInstance) {
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

  if (!enableDesktopNotifications) {
    return
  }
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return
  }
  // Tab visible: user sees the app, no popup needed.
  // Push active: service worker handles the OS notification when tab is hidden.
  if (document.visibilityState === 'visible' || currentPushSubscription) {
    return
  }

  const { title, body } = describeNotification(notification)
  try {
    const n = new Notification(title, {
      body,
      icon: (notification.account && notification.account.avatar) || '/icons/favicon.ico',
      tag: 'zocial-' + notification.id,
      renotify: true
    })
    n.onclick = () => {
      window.focus()
      n.close()
    }
  } catch (_) {
    // ignore — Notification constructor can throw on some platforms
  }
}
