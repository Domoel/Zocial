import { getAccountAccessibleName } from './getAccountAccessibleName.js'
import { POST_PRIVACY_OPTIONS } from '../_static/statuses.js'
import { formatIntl } from '../_utils/formatIntl.js'

function getPrivacyText (visibility) {
  for (const option of POST_PRIVACY_OPTIONS) {
    if (option.key === visibility) {
      return option.label
    }
  }
}

function getReblogText (reblog, account, omitEmojiInDisplayNames, originalAccountDisplayName) {
  if (!reblog) {
    return originalAccountDisplayName
  }
  const accountDisplayName = getAccountAccessibleName(account, omitEmojiInDisplayNames)
  return formatIntl('intl.rebloggedByAccount', { account: accountDisplayName, original: originalAccountDisplayName })
}

function cleanupText (text) {
  return text.replace(/\s+/g, ' ').trim()
}

export function getAccessibleLabelForStatus (originalAccount, account, plainTextContent,
  shortInlineFormattedDate, spoilerText, showContent,
  reblog, notificationInfo, visibility, omitEmojiInDisplayNames,
  disableLongAriaLabels, showMedia, sensitive, sensitiveShown, mediaAttachments, showPoll,
  cardTitle, cardDescription) {
  const originalAccountDisplayName = getAccountAccessibleName(originalAccount, omitEmojiInDisplayNames)
  const contentTextToShow = (showContent || !spoilerText)
    ? cleanupText(plainTextContent)
    : formatIntl('intl.contentWarningContent', { spoiler: cleanupText(spoilerText) })
  const mediaTextToShow = showMedia && 'intl.hasMedia'
  const mediaDescText = (showMedia && (!sensitive || sensitiveShown))
    ? mediaAttachments.map(media => media.description)
    : []
  const pollTextToShow = showPoll && 'intl.hasPoll'
  const privacyText = getPrivacyText(visibility)

  if (disableLongAriaLabels) {
    // Long text can crash NVDA; allow users to shorten it like we had it before.
    return formatIntl('intl.shortStatusLabel', { privacy: privacyText, account: originalAccountDisplayName })
  }

  const values = [
    notificationInfo && notificationInfo.ariaLabel,
    getReblogText(reblog, account, omitEmojiInDisplayNames, originalAccountDisplayName),
    contentTextToShow,
    mediaTextToShow,
    ...mediaDescText,
    pollTextToShow,
    cardTitle || undefined,
    cardDescription || undefined,
    shortInlineFormattedDate,
    `@${originalAccount.acct}`,
    privacyText
  ].filter(Boolean)

  return values.join(', ')
}
