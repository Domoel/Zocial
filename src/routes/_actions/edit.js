import { statusHtmlToPlainText } from '../_utils/statusHtmlToPlainText.ts'
import { toast } from '../_components/toast/toast.js'
import { formatIntl } from '../_utils/formatIntl.js'
import { logActionError } from '../_utils/isNetworkError.js'
import { confirmReplaceDialogDraft } from './composeDraft.js'
import { importShowComposeDialog } from '../_components/dialog/asyncDialogs/importShowComposeDialog.js'
import { store } from '../_store/store.js'
import { database } from '../_database/database.js'
import { getStatusSource } from '../_api/statuses.js'
import { getQuoteHandle } from '../_utils/quotes.js'

export async function edit (status) {
  if (!(await confirmReplaceDialogDraft())) {
    return
  }
  const { currentInstance, accessToken } = store.get()
  const dialogPromise = importShowComposeDialog()
  let source
  try {
    source = await getStatusSource(currentInstance, accessToken, status.id)
  } catch (e) {
    // offline, timeout, or the post is gone: say so instead of a silent dead click
    logActionError('load post source for editing', e)
    /* no await */ toast.say(formatIntl('intl.unableToEdit', { error: (e.message || '') }))
    return
  }
  let inReplyToHandle = null
  if (status.in_reply_to_id) {
    const replyingTo = await database.getStatus(currentInstance, status.in_reply_to_id)
    if (replyingTo && replyingTo.account) inReplyToHandle = '@' + replyingTo.account.acct
  }
  store.clearComposeData('dialog')
  store.setComposeData('dialog', {
    text: (source.akkoma && source.akkoma.source && source.akkoma.source.content) || source.text || statusHtmlToPlainText(status.content, status.mentions),
    contentType: (source.akkoma && source.akkoma.source && source.akkoma.source.mediaType) || source.content_type || 'text/plain',
    contentWarningShown: !!(source.spoiler_text || status.spoiler_text),
    contentWarning: source.spoiler_text || status.spoiler_text || '',
    postPrivacy: status.visibility,
    media: status.media_attachments && status.media_attachments.map(_ => ({
      description: _.description || '',
      // keep the existing focal point (edits send it back via media_attributes)
      focusX: (_.meta && _.meta.focus && _.meta.focus.x) || 0,
      focusY: (_.meta && _.meta.focus && _.meta.focus.y) || 0,
      data: _
    })),
    inReplyToId: status.in_reply_to_id,
    inReplyToHandle,
    // note that for polls there is no real way to preserve the original expiry
    poll: status.poll && {
      multiple: !!status.poll.multiple,
      options: (status.poll.options || []).map(option => option.title)
    },
    sensitive: !!status.sensitive,
    quoteId: status.quote_id,
    localOnly: status.local_only,
    quoteHandle: getQuoteHandle(status),
    editId: status.id
  })
  const showComposeDialog = await dialogPromise
  showComposeDialog()
}
