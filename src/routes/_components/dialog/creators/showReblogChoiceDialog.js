import ReblogChoiceDialog from '../components/ReblogChoiceDialog.html'
import { showDialog } from './showDialog.js'

export default function showReblogChoiceDialog (status) {
  return showDialog(ReblogChoiceDialog, {
    label: 'intl.boostOrQuote',
    status
  })
}
