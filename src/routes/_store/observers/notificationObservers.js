import { setFavicon } from '../../_utils/setFavicon.js'
import { runMediumPriorityTask } from '../../_utils/runMediumPriorityTask.js'
import { store } from '../store.js'

let currentFaviconHasNotifications = false

export function notificationObservers () {
  store.observe('hasNotifications', hasNotifications => {
    if (!ZOCIAL_IS_BROWSER) {
      return
    }
    runMediumPriorityTask(() => {
      if (currentFaviconHasNotifications === hasNotifications) {
        return
      }
      setFavicon(`/icons/favicon${hasNotifications ? '-alert' : ''}.ico`)
      currentFaviconHasNotifications = !currentFaviconHasNotifications
    })
  })
  let previousNumberOfNotifications = 0
  let audio
  store.observe('numberOfNotifications', (numberOfNotifications) => {
    const { disableNotificationSound, enableDesktopNotifications } = store.get()

    if (numberOfNotifications > previousNumberOfNotifications) {
      if (!disableNotificationSound) {
        try {
          const played = (audio || (audio = new Audio('/boop.mp3'))).play()
          // play() returns a promise that rejects when the browser blocks autoplay
          // (no user gesture yet). That rejection is asynchronous, so the surrounding
          // try/catch can't catch it — swallow it explicitly to avoid an
          // unhandled-rejection log for an entirely expected condition.
          if (played && typeof played.catch === 'function') {
            played.catch(() => {})
          }
        } catch (_) {
          // ignore (older browsers where play() throws synchronously)
        }
      }

      if (enableDesktopNotifications && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        const count = numberOfNotifications - previousNumberOfNotifications
        try {
          const n = new Notification('Zocial', {
            body: count === 1 ? '1 new notification' : `${count} new notifications`,
            icon: '/icons/favicon.ico',
            tag: 'zocial-notifications',
            renotify: count > previousNumberOfNotifications
          })
          n.onclick = () => {
            window.focus()
            n.close()
          }
        } catch (_) {
          // ignore
        }
      }
    }

    previousNumberOfNotifications = numberOfNotifications
  })
}
