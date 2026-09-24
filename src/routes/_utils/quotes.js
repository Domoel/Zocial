// Quote posts arrive in two shapes (GoToSocial has no quote field at all):
//  - Akkoma / Pleroma / Fedibird: `status.quote` IS the quoted Status.
//  - Mastodon ≥ 4.4: `status.quote` is a Quote wrapper `{ state, quoted_status }` — or, for a quote
//    nested inside a quote, a ShallowQuote `{ state, quoted_status_id }`. Only `accepted` may be
//    displayed; since 4.5 `muted_account` / `blocked_account` / `blocked_domain` still carry the
//    quoted status but tell the client not to show it.
// See Architecture §17.

const HIDDEN_ACCOUNT_STATES = new Set(['muted_account', 'blocked_account', 'blocked_domain'])

function isQuoteWrapper (quote) {
  return typeof quote.state === 'string' && !quote.account
}

// The quoted Status to render inline, or null when there is nothing displayable (no quote, not yet
// accepted/revoked/deleted, a nested ShallowQuote, a muted/blocked author, or a remote quote whose
// account hasn't been fetched yet).
export function getDisplayableQuote (status) {
  const quote = status && status.quote
  if (!quote) {
    return null
  }
  const quoted = isQuoteWrapper(quote) ? (quote.state === 'accepted' ? quote.quoted_status : null) : quote
  return quoted && quoted.account ? quoted : null
}

// True when the server says the quoted author is muted or blocked (Mastodon ≥ 4.5). Such posts are
// dropped from the home/list/public timelines, like the quoted author's own posts would be —
// otherwise the post shows up without the context it is built around.
export function isQuoteOfHiddenAccount (status) {
  const quote = status && status.quote
  return !!(quote && isQuoteWrapper(quote) && HIDDEN_ACCOUNT_STATES.has(quote.state))
}

// The quoted account's handle for the compose box on edit / delete-and-redraft, or undefined.
export function getQuoteHandle (status) {
  const quote = status && status.quote
  if (!quote) {
    return undefined
  }
  const quoted = isQuoteWrapper(quote) ? quote.quoted_status : quote
  return quoted && quoted.account ? '@' + quoted.account.acct : undefined
}
