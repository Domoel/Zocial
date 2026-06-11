import { setFavicon } from '../../_utils/setFavicon.js'
import { runMediumPriorityTask } from '../../_utils/runMediumPriorityTask.js'
import { store } from '../store.js'

let currentFaviconHasNotifications = false

// The notification sound and in-page desktop notification are fired event-driven from the
// streaming `notification` event (showDesktopNotification.js / processMessage.js), where the
// full notification payload is available. This observer only keeps the favicon in sync.
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
}
