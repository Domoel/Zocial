import ReportDialog from '../components/ReportDialog.html'
import { showDialog } from './showDialog.js'
import { formatIntl } from '../../../_utils/formatIntl.js'

export default function showReportDialog ({ account, status, draft }) {
  const label = formatIntl('intl.reportAccount', { account: `@${account.acct}` })
  return showDialog(ReportDialog, Object.assign({
    label,
    title: label,
    account,
    status
  }, draft && {
    comment: draft.comment || '',
    forward: !!draft.forward,
    reportMap: Object.assign({}, draft.reportMap)
  }))
}
