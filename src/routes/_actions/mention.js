import { importShowComposeDialog } from '../_components/dialog/asyncDialogs/importShowComposeDialog.js'
import { confirmReplaceDialogDraft } from './composeDraft.js'
import { store } from '../_store/store.js'

export async function composeNewStatusMentioning (account) {
  if (!(await confirmReplaceDialogDraft())) {
    return
  }
  store.clearComposeData('dialog')
  store.setComposeData('dialog', { text: `@${account.acct} ` })
  const showComposeDialog = await importShowComposeDialog()
  showComposeDialog()
}
