import { importShowReportDialog } from '../_components/dialog/asyncDialogs/importShowReportDialog.js'

// `draft` ({ comment, forward, reportMap }) reopens the dialog with what the user had entered
export async function reportStatusOrAccount ({ status, account, draft }) {
  const showReportDialog = await importShowReportDialog()
  showReportDialog({ status, account, draft })
}
