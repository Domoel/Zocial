import { statusHtmlToPlainText } from '../_utils/statusHtmlToPlainText.ts'
import { importShowComposeDialog } from '../_components/dialog/asyncDialogs/importShowComposeDialog.js'
import { doDeleteStatus } from './delete.js'
import { store } from '../_store/store.js'
import { database } from '../_database/database.js'

export async function deleteAndRedraft (status) {
  // Do everything that can fail BEFORE the destructive delete: load the compose dialog component
  // and resolve the reply handle. Otherwise, if redraft setup threw after the delete, the post
  // would be gone with no dialog to recover it. After the delete below, only synchronous store
  // writes + opening the already-loaded dialog remain.
  const dialogPromise = importShowComposeDialog()
  let inReplyToHandle = null
  if (status.in_reply_to_id) {
    try {
      const { currentInstance } = store.get()
      const replyingTo = await database.getStatus(currentInstance, status.in_reply_to_id)
      if (replyingTo) inReplyToHandle = '@' + replyingTo.account.acct
    } catch (e) {
      // Enrichment only — never block (or, post-delete, lose) the redraft over a reply-handle lookup.
      console.warn('redraft: failed to resolve reply handle', (e && e.message) || e)
    }
  }
  const showComposeDialog = await dialogPromise

  const deletedStatus = await doDeleteStatus(status.id)
  store.clearComposeData('dialog')
  store.setComposeData('dialog', {
    text: (deletedStatus.akkoma && deletedStatus.akkoma.source && deletedStatus.akkoma.source.content) || deletedStatus.text || statusHtmlToPlainText(status.content, status.mentions),
    contentType: (deletedStatus.akkoma && deletedStatus.akkoma.source && deletedStatus.akkoma.source.mediaType) || deletedStatus.content_type || 'text/plain',
    contentWarningShown: !!status.spoiler_text,
    contentWarning: status.spoiler_text || '',
    postPrivacy: status.visibility,
    media: status.media_attachments && status.media_attachments.map(_ => ({
      description: _.description || '',
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
    quoteHandle: status.quote && '@' + status.quote.account.acct
  })
  showComposeDialog()
}
