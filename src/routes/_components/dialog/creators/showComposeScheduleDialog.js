import ComposeScheduleDialog from '../components/ComposeScheduleDialog.html'
import { showDialog } from './showDialog.js'

export default function showComposeScheduleDialog (realm) {
  return showDialog(ComposeScheduleDialog, {
    label: 'intl.schedulePost',
    title: 'intl.schedulePost',
    realm
  })
}
