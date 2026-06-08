import ListMembershipDialog from '../components/ListMembershipDialog.html'
import { showDialog } from './showDialog.js'

export default function showListMembershipDialog (account) {
  return showDialog(ListMembershipDialog, {
    label: 'intl.manageInLists',
    account
  })
}
