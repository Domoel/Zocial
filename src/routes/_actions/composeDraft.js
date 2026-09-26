import { store } from '../_store/store.js'
import { importShowTextConfirmationDialog } from '../_components/dialog/asyncDialogs/importShowTextConfirmationDialog.js'

// Closing the compose dialog keeps its draft (the sticky button / `c` reopen it). The actions that
// fill the dialog with new content (quote, mention, edit, delete-and-redraft, share target) replace
// that draft, so they ask first when there is something to lose.
function hasDialogDraft () {
  const draft = store.getComposeData('dialog')
  if (!draft) {
    return false
  }
  const poll = draft.poll
  return !!(
    (draft.text && draft.text.trim()) ||
    (draft.media && draft.media.length) ||
    (poll && poll.options && poll.options.some(option => option && option.trim())) ||
    (draft.contentWarning && draft.contentWarning.trim())
  )
}

// Resolves true when the dialog draft may be replaced: there is none, or the user agreed.
export async function confirmReplaceDialogDraft () {
  if (!hasDialogDraft()) {
    return true
  }
  const showTextConfirmationDialog = await importShowTextConfirmationDialog()
  return new Promise(resolve => {
    showTextConfirmationDialog({
      text: 'intl.discardDraftConfirm',
      positiveText: 'intl.discardDraft'
    })
      .on('positive', () => resolve(true))
      .on('negative', () => resolve(false))
  })
}
