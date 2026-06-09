import { search } from '../_api/search.js'

function extractFirstExternalLink (html) {
  if (typeof document === 'undefined' || !html) return null
  const div = document.createElement('div')
  div.innerHTML = html
  const links = div.querySelectorAll('a[href]')
  for (const link of links) {
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

// Cache: url → resolved card (or null)
const cardCache = new Map()

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

export async function resolveCardForUrl (url, instanceName, accessToken) {
  if (cardCache.has(url)) {
    return cardCache.get(url)
  }

  const result = await enqueue(async () => {
    let hostname
    try {
      hostname = new URL(url).hostname
    } catch (e) {
      return null
    }

    try {
      const results = await search(instanceName, accessToken, url, /* resolve */ true, /* limit */ 1)

      if (results.statuses && results.statuses[0]) {
        const status = results.statuses[0]
        const account = status.account
        const image = (status.media_attachments && status.media_attachments[0] && status.media_attachments[0].preview_url) ||
          account.avatar_static || null
        return {
          url: '/statuses/' + status.id,
          title: account.display_name || account.username,
          description: stripHTML(status.content).slice(0, 200) || null,
          image,
          provider_name: hostname
        }
      }

      if (results.accounts && results.accounts[0]) {
        const account = results.accounts[0]
        return {
          url: '/accounts/' + account.id,
          title: account.display_name || account.username,
          description: stripHTML(account.note).slice(0, 150) || ('@' + account.acct),
          image: account.avatar_static || null,
          provider_name: hostname
        }
      }
    } catch (e) { /* resolution failed, use text fallback */ }

    return {
      url,
      title: hostname,
      description: null,
      image: null,
      provider_name: hostname
    }
  })

  cardCache.set(url, result)
  return result
}
