import { store } from '../_store/store.js'
import { describeNotification } from './notificationContent.js'

// In-page desktop notification + sound for a live streamed notification (System A). Driven by
// the streaming `notification` event (processMessage.js), where the full payload is available,
// rather than by a count delta — so each notification fires exactly once with real content,
// and catch-up gap-fills after the tab unfreezes don't produce a burst of stale popups.
//
// When Web Push (System B) is subscribed for this notification's type, that path already
// delivers a richer system notification (even with the tab closed), so System A defers to it
// to avoid double-notifying. See the notification system notes in Architecture.md §18.

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

  // When a Web Push subscription exists, System B owns device notifications entirely (it
  // delivers richer notifications, even with the tab closed). The per-type granularity lives
  // in the push alerts, so System A stays fully silent here to avoid double-notifying. System A
  // only acts as the foreground fallback when there is no push subscription (e.g. a server
  // without Web Push support).
  const isHidden = document.visibilityState === 'hidden'
  if (isHidden && currentPushSubscription) {
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
