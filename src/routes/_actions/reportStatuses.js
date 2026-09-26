import { store } from '../_store/store.js'
import { toast } from '../_components/toast/toast.js'
import { report } from '../_api/report.js'
import { formatIntl } from '../_utils/formatIntl.js'
import { logActionError } from '../_utils/isNetworkError.js'

// Resolves true when the report was submitted.
export async function reportStatuses (account, statusIds, comment, forward) {
  const { currentInstance, accessToken } = store.get()
  try {
    await report(currentInstance, accessToken, account.id, statusIds, comment, forward)
    /* no await */ toast.say('intl.submittedReport')
    return true
  } catch (e) {
    logActionError('report', e)
    /* no await */ toast.say(formatIntl('intl.failedToReport', { error: (e.message || '') }))
    return false
  }
}
