import { store } from '../_store/store.js'
import { importShowTextConfirmationDialog } from '../_components/dialog/asyncDialogs/importShowTextConfirmationDialog.js'
import { updateAlerts } from './pushSubscription.js'
import { formatIntl } from '../_utils/formatIntl.js'
import { toast } from '../_components/toast/toast.js'

const ALL_ALERTS = {
  follow: true,
  favourite: true,
  reblog: true,
  mention: true,
  poll: true,
  status: true
}

function markPrompted (instanceName) {
  const { osNotificationPrompted } = store.get()
  store.set({ osNotificationPrompted: { ...osNotificationPrompted, [instanceName]: true } })
  store.save()
}

async function enableOSNotifications (instanceName) {
  // Record that we've asked, regardless of the outcome, so we don't prompt again.
  markPrompted(instanceName)
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      // User declined at the OS level — default stays off.
      return
    }
    // Foreground fallback (System A); stays dormant whenever a push subscription exists.
    store.set({ enableDesktopNotifications: true })
    store.save()
    // Register Web Push (System B) if the server supports it.
    const { pushNotificationsSupport } = store.get()
    if (pushNotificationsSupport) {
      await updateAlerts(instanceName, ALL_ALERTS)
    }
  } catch (e) {
    toast.say(formatIntl('intl.failedToUpdatePush', { error: e.message || '' }))
  }
}

// One-time, per-account login prompt asking whether to enable OS-level (desktop / PWA) notifications.
//
// In-app notifications (the notifications tab) are always on by default and are NOT affected by this
// prompt. OS notifications default to OFF: if the user declines, dismisses, or anything fails, no OS
// notifications are enabled. The prompt is shown at most once per account (persisted flag).
export async function maybePromptForOSNotifications (instanceName) {
  if (!ZOCIAL_IS_BROWSER || !instanceName) {
    return
  }
  try {
    const { osNotificationPrompted, loggedInInstances } = store.get()
    if (!loggedInInstances || !loggedInInstances[instanceName]) {
      return // not logged in to this instance
    }
    if (osNotificationPrompted && osNotificationPrompted[instanceName]) {
      return // already asked for this account
    }
    if (typeof Notification === 'undefined') {
      markPrompted(instanceName) // platform can't do OS notifications — don't keep asking
      return
    }
    if (Notification.permission !== 'default') {
      // The OS-level decision was already made (granted or denied) — respect it, don't ask.
      markPrompted(instanceName)
      return
    }

    const showTextConfirmationDialog = await importShowTextConfirmationDialog()
    const dialog = showTextConfirmationDialog({
      title: 'intl.osNotificationsPromptTitle',
      text: 'intl.osNotificationsPromptText',
      positiveText: 'intl.enableNotifications',
      negativeText: 'intl.notNow'
    })
    dialog.on('positive', () => {
      /* no await */ enableOSNotifications(instanceName)
    })
    dialog.on('negative', () => {
      markPrompted(instanceName)
    })
  } catch (e) {
    // Anything goes wrong → leave OS notifications OFF (the default). Don't mark as prompted, so
    // it can be retried on a future login.
    console.warn('OS notification prompt failed', e)
  }
}
