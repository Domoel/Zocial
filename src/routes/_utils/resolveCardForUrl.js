import { search } from '../_api/search.js'

// `skipQuoteFallback`: ignore a quote post's "RE: <link>" fallback (`.quote-inline`) — set when the
// server withholds the quote (not accepted, or a muted/blocked author), so the post can't come back
// as a preview card (§17). Otherwise that link is fair game: on servers without a quote field
// (GoToSocial) its card is the only context.
function extractFirstExternalLink (html, skipQuoteFallback = false) {
  if (typeof document === 'undefined' || !html) return null
  const div = document.createElement('div')
  div.innerHTML = html
  const links = div.querySelectorAll('a[href]')
  for (const link of links) {
    if (skipQuoteFallback && link.closest('.quote-inline, .reference-link-inline')) {
      continue
    }
    try {
      const url = new URL(link.href)
      if (url.protocol.startsWith('http') && url.origin !== window.location.origin) {
        return link.href
      }
    } catch (e) { /* skip invalid hrefs */ }
  }
  return null
}

function stripHTML (html) {
  if (!html) return ''
  const div = document.createElement('div')
  div.innerHTML = html
  return (div.textContent || div.innerText || '').trim()
}

export { extractFirstExternalLink }

// `${instanceName} ${url}` → Promise<card>. Keyed per instance: the card links to an instance-local
// /statuses/<id> or /accounts/<id>. Holding the promise also shares a lookup that is still running.
const cardCache = new Map()
const MAX_CACHED_CARDS = 500

// Concurrency queue: max 2 parallel resolve requests
const MAX_CONCURRENT = 2
let activeCount = 0
const queue = []

function runNext () {
  if (queue.length === 0 || activeCount >= MAX_CONCURRENT) return
  const { fn, resolve, reject } = queue.shift()
  activeCount++
  fn().then(resolve, reject).finally(() => {
    activeCount--
    runNext()
  })
}

function enqueue (fn) {
  return new Promise((resolve, reject) => {
    queue.push({ fn, resolve, reject })
    runNext()
  })
}

// → { card, cacheable }. A failed lookup (timeout, network) isn't cacheable, so a later render
// retries; "nothing found" is a real answer (an ordinary web link) and is cached.
async function lookUpCard (url, instanceName, accessToken) {
  let hostname
  try {
    hostname = new URL(url).hostname
  } catch (e) {
    return { card: null, cacheable: true }
  }
  const textCard = { url, title: hostname, description: null, image: null, provider_name: hostname }

  let results
  try {
    results = await search(instanceName, accessToken, url, /* resolve */ true, /* limit */ 1)
  } catch (e) {
    return { card: textCard, cacheable: false }
  }

  if (results && results.statuses && results.statuses[0]) {
    const status = results.statuses[0]
    const account = status.account || {}
    const image = (status.media_attachments && status.media_attachments[0] && status.media_attachments[0].preview_url) ||
      account.avatar_static || null
    return {
      card: {
        url: '/statuses/' + status.id,
        title: account.display_name || account.username,
        description: stripHTML(status.content).slice(0, 200) || null,
        image,
        provider_name: hostname
      },
      cacheable: true
    }
  }

  if (results && results.accounts && results.accounts[0]) {
    const account = results.accounts[0]
    return {
      card: {
        url: '/accounts/' + account.id,
        title: account.display_name || account.username,
        description: stripHTML(account.note).slice(0, 150) || ('@' + account.acct),
        image: account.avatar_static || null,
        provider_name: hostname
      },
      cacheable: true
    }
  }

  return { card: textCard, cacheable: true }
}

export function resolveCardForUrl (url, instanceName, accessToken) {
  const key = instanceName + ' ' + url
  let promise = cardCache.get(key)
  if (!promise) {
    promise = enqueue(() => lookUpCard(url, instanceName, accessToken)).then(({ card, cacheable }) => {
      if (!cacheable) {
        cardCache.delete(key)
      }
      return card
    }, e => {
      cardCache.delete(key)
      throw e
    })
    cardCache.set(key, promise)
    if (cardCache.size > MAX_CACHED_CARDS) {
      cardCache.delete(cardCache.keys().next().value) // oldest first (Map keeps insertion order)
    }
  }
  return promise
}
