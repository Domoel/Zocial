import { removeEmoji } from '../_utils/removeEmoji.js'

export function getAccountAccessibleName (account, omitEmojiInDisplayNames) {
  // Defensive: a malformed/partly-built status can hand us an undefined account; reading `.emojis`
  // off it would throw ("Cannot read properties of undefined (reading 'emojis')").
  if (!account) {
    return ''
  }
  const emojis = account.emojis
  let displayName = account.display_name || account.username
  if (omitEmojiInDisplayNames) {
    displayName = removeEmoji(displayName, emojis) || displayName
  }
  return displayName
}
