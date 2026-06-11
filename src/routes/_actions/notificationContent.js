// Builds a human-readable { title, body } for a Mastodon notification payload, used for the
// in-page desktop notification (System A — see the notification system notes in Architecture.md
// §18). The service-worker Web Push handler (System B) builds its own rich text independently.
//
// NOTE: the intl string literals below (intl dot key, in quotes) are resolved to the localised
// plain text at build time by svelte-intl-loader (it runs over .js/.ts too, not just .html).
// Only parameter-less intl keys may be used here — a key with {params} would compile to an AST,
// not a string. (Quoted intl keys even inside comments get substituted by the loader, so this
// note deliberately avoids writing one.)
const ACTION_TEXT = {
  reblog: 'intl.rebloggedYou', // "boosted your post"
  favourite: 'intl.favoritedYou', // "favorited your post"
  follow: 'intl.followedYou', // "followed you"
  follow_request: 'intl.requestedFollow', // "requested to follow you"
  'admin.sign_up': 'intl.signedUp', // "signed up"
  reaction: 'intl.reacted', // "reacted with an emoji"
  emoji_reaction: 'intl.reacted',
  'pleroma:emoji_reaction': 'intl.reacted',
  update: 'intl.edited' // "edited their post"
}

// Strip custom-emoji shortcodes (`:smile:`) and collapse whitespace from a display name.
function plainName (account) {
  if (!account) {
    return ''
  }
  const raw = account.display_name || account.username || account.acct || ''
  const cleaned = raw.replace(/:[a-zA-Z0-9_]+:/g, '').replace(/\s+/g, ' ').trim()
  return cleaned || account.acct || account.username || ''
}

const NAMED_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

// Decode the handful of HTML entities Mastodon actually emits (notably `&amp;`). Anything we
// don't recognise is left as-is rather than dropped, so text isn't silently mangled.
function decodeEntities (text) {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, body) => {
    if (body[0] === '#') {
      const code = (body[1] === 'x' || body[1] === 'X')
        ? parseInt(body.slice(2), 16)
        : parseInt(body.slice(1), 10)
      return (code > 0 && code <= 0x10FFFF) ? String.fromCodePoint(code) : match
    }
    const named = NAMED_ENTITIES[body.toLowerCase()]
    return named === undefined ? match : named
  })
}

// Turn status HTML into a short plain-text snippet for the notification body. Tags become spaces
// (so words across block elements stay separated), then entities are decoded.
function snippet (html, max = 120) {
  const text = decodeEntities(String(html || '').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= max) {
    return text
  }
  return text.slice(0, max - 1).trimEnd() + '…'
}

export function describeNotification (notification) {
  const name = plainName(notification.account)
  const type = notification.type

  // Mentions and new posts: the content itself is the interesting part.
  if (type === 'mention' || type === 'status') {
    const body = snippet(notification.status && notification.status.content)
    return { title: name || 'Zocial', body: body || name }
  }

  const action = ACTION_TEXT[type]
  if (action) {
    // `action` is already the localised plain text (resolved at build time).
    return { title: name || 'Zocial', body: action }
  }

  // Unknown/unhandled type — still name the actor so it's not a blank "new notification".
  return { title: 'Zocial', body: name || 'New notification' }
}
