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
          (audio || (audio = new Audio('/boop.mp3'))).play()
        } catch (_) {
          // ignore
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
