import { statusHtmlToPlainText } from '../_utils/statusHtmlToPlainText.ts'
import { confirmReplaceDialogDraft } from './composeDraft.js'
import { importShowComposeDialog } from '../_components/dialog/asyncDialogs/importShowComposeDialog.js'
import { doDeleteStatus } from './delete.js'
import { store } from '../_store/store.js'
import { database } from '../_database/database.js'
import { getQuoteHandle, getQuotedStatusUrl } from '../_utils/quotes.js'

export async function deleteAndRedraft (status) {
  // asked before anything destructive happens: declining keeps both the post and the draft
  if (!(await confirmReplaceDialogDraft())) {
    return
  }
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
  let text = (deletedStatus.akkoma && deletedStatus.akkoma.source && deletedStatus.akkoma.source.content) || deletedStatus.text || statusHtmlToPlainText(status.content, status.mentions)
  // A native Mastodon quote has no quote_id and its source text doesn't contain the quoted URL (the
  // "RE:" link only exists in the rendered HTML) — without this the redraft would drop the quote.
  const quotedUrl = !status.quote_id && getQuotedStatusUrl(status)
  if (quotedUrl && !(text || '').includes(quotedUrl)) {
    text = (text || '') + '\n\n' + quotedUrl // same URL-in-text form as quoteStatus()
  }
  store.clearComposeData('dialog')
  store.setComposeData('dialog', {
    text,
    contentType: (deletedStatus.akkoma && deletedStatus.akkoma.source && deletedStatus.akkoma.source.mediaType) || deletedStatus.content_type || 'text/plain',
    contentWarningShown: !!status.spoiler_text,
    contentWarning: status.spoiler_text || '',
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
    quoteHandle: getQuoteHandle(status)
  })
  showComposeDialog()
}
