import { importShowComposeDialog } from '../_components/dialog/asyncDialogs/importShowComposeDialog.js'
import { store } from '../_store/store.js'

export async function quoteStatus (status) {
  const showComposeDialog = await importShowComposeDialog()
  store.clearComposeData('dialog')
  const url = status.url || status.uri || ''
  store.setComposeData('dialog', {
    text: url ? '\n\n' + url : '',
    initialSelectionStart: 0
  })
  showComposeDialog()
}
