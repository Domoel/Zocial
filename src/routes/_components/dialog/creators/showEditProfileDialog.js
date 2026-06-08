import EditProfileDialog from '../components/EditProfileDialog.html'
import { showDialog } from './showDialog.js'

export default function showEditProfileDialog () {
  return showDialog(EditProfileDialog, {
    label: 'intl.editProfile',
    title: 'intl.editProfile'
  })
}
