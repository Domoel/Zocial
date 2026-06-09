import { importShowComposeDialog } from '../_components/dialog/asyncDialogs/importShowComposeDialog.js'
import { store } from '../_store/store.js'
import { insertHandleForReply } from './compose.js'

// Opens the composer with the post URL pre-filled at the end of the text.
// Works with every backend; the user types their comment above the URL.
export async function quoteByUrl (status) {
  const showComposeDialog = await importShowComposeDialog()
  store.clearComposeData('dialog')
  // status.url can be null on some servers (e.g. GoToSocial on certain posts)
  const url = status.url || status.uri || ''
  store.setComposeData('dialog', {
    text: url ? '\n\n' + url : '',
    initialSelectionStart: 0
  })
  showComposeDialog()
}

// Chooses the best available quoting method:
// FEP-e232 native quote for servers that support it, URL-in-text fallback for everyone else.
export function quoteStatus (status) {
  return ('quote' in status) ? quote(status) : quoteByUrl(status)
}

export async function quote (status) {
  const dialogPromise = importShowComposeDialog()
  store.clearComposeData('dialog')
  store.setComposeData('dialog', {
    contentWarningShown: !!status.spoiler_text,
    contentWarning: status.spoiler_text || '',
    postPrivacy: status.visibility,
    sensitive: !!status.sensitive,
    quoteId: status.id,
    quoteHandle: '@' + status.account.acct
  })

  const [showComposeDialog] = await Promise.all([dialogPromise, insertHandleForReply('dialog', status.id)])
  showComposeDialog()
}
