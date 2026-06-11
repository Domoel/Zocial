import { store } from '../_store/store.js'
import { importShowTextConfirmationDialog } from '../_components/dialog/asyncDialogs/importShowTextConfirmationDialog.js'
import { enableOSNotificationsForInstance } from './pushSubscription.js'
import { handlePushError } from './handlePushError.js'

function markPrompted (instanceName) {
  const { osNotificationPrompted } = store.get()
  store.set({ osNotificationPrompted: { ...osNotificationPrompted, [instanceName]: true } })
  store.save()
}

async function enableOSNotifications (instanceName) {
  try {
    const { pushError } = await enableOSNotificationsForInstance(instanceName)
    await handlePushError(instanceName, pushError)
  } catch (e) {
    await handlePushError(instanceName, e)
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
    // Mark as soon as the dialog is shown: prevents a concurrent call from opening a second
    // dialog, and means dismissing it (Escape / overlay) won't re-prompt on the next load.
    markPrompted(instanceName)
    dialog.on('positive', () => {
      /* no await */ enableOSNotifications(instanceName)
    })
  } catch (e) {
    // Anything goes wrong before the dialog is shown → leave OS notifications OFF (the default)
    // and don't mark as prompted, so it can be retried on a future login.
    console.warn('OS notification prompt failed', e)
  }
}
