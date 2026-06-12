import { importShowTextConfirmationDialog } from '../_components/dialog/asyncDialogs/importShowTextConfirmationDialog.js'
import { logOutOfInstance } from './instances.js'
import { formatIntl } from '../_utils/formatIntl.js'
import { toast } from '../_components/toast/toast.js'
import { describeDOMException } from './pushSubscription.js'

// Surface a push-subscription failure consistently across every enable path (per-type toggle,
// the "Notify me on this device" master toggle, and the post-login prompt).
//
// A 403 means the access token lacks the `push` OAuth scope — typically an older login from
// before the scope was added. Re-authenticating is the only real fix, so offer it. Anything else
// is infrastructure noise and shown as a soft toast.
export async function handlePushError (instanceName, err) {
  if (!err) {
    return
  }
  // ajax.js throws `Error('Request failed: <status>')` with `err.status` set; keep the legacy
  // "403:"-prefixed message as a fallback.
  if (err.status === 403 || (err.message && err.message.startsWith('403:'))) {
    const showTextConfirmationDialog = await importShowTextConfirmationDialog()
    showTextConfirmationDialog({
      text: formatIntl('intl.needToReauthenticate', { instance: instanceName })
    }).on('positive', () => {
      /* no await */ logOutOfInstance(instanceName)
    })
  } else {
    const errorText = err instanceof DOMException ? describeDOMException(err) : (err.message || String(err))
    toast.say(formatIntl('intl.failedToUpdatePush', { error: errorText }))
  }
}
