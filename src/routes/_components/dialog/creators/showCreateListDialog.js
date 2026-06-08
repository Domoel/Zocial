import CreateListDialog from '../components/CreateListDialog.html'
import { showDialog } from './showDialog.js'

export default function showCreateListDialog () {
  return showDialog(CreateListDialog, {
    label: 'intl.createList'
  })
}
