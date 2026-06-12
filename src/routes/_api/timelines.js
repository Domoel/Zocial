import { getWithHeaders, paramsString, DEFAULT_TIMEOUT, SLOW_READ_TIMEOUT } from '../_utils/ajax.js'
import { auth, basename } from './utils.js'
import { notMentions } from '../_static/notifications.ts'

function getTimelineUrlPath (timeline) {
  switch (timeline) {
    case 'local':
    case 'federated':
      return 'timelines/public'
    case 'bubble':
      return 'timelines/bubble'
    case 'home':
      return 'timelines/home'
    case 'notifications':
    case 'notifications/mentions':
      return 'notifications'
    case 'favorites':
      return 'favourites'
    case 'direct':
      return 'conversations'
    case 'bookmarks':
      return 'bookmarks'
  }
  if (timeline.startsWith('tag/')) {
    return 'timelines/tag'
  } else if (timeline.startsWith('account/')) {
    return 'accounts'
  } else if (timeline.startsWith('list/')) {
    return 'timelines/list'
  }
  throw new Error(`Invalid timeline type: ${timeline}`)
}

export async function getTimeline (instanceName, accessToken, timeline, maxId, since, limit) {
  const timelineUrlName = getTimelineUrlPath(timeline)
  let url = `${basename(instanceName)}/api/v1/${timelineUrlName}`

  if (timeline.startsWith('tag/')) {
    url += '/' + timeline.split('/')[1]
  } else if (timeline.startsWith('account/')) {
    url += '/' + timeline.split('/')[1] + '/statuses'
  } else if (timeline.startsWith('list/')) {
    url += '/' + timeline.split('/')[1]
  }

  const params = {}
  if (since) {
    params.since_id = since
  }

  if (maxId) {
    params.max_id = maxId
  }

  if (limit) {
    params.limit = limit
  }

  if (timeline === 'local') {
    params.local = true
  }

  if (timeline.startsWith('account/')) {
    if (timeline.endsWith('media')) {
      params.only_media = true
    } else {
      params.exclude_replies = !timeline.endsWith('/with_replies')
    }
  }

  if (timeline === 'notifications/mentions') {
    params.exclude_types = notMentions
  }

  url += '?' + paramsString(params)

  // List and tag timelines are assembled per-list/-tag server-side and are often much slower than
  // the cheap public/home reads, so give them more headroom before timing out.
  const isSlowTimeline = timeline.startsWith('list/') || timeline.startsWith('tag/')
  const timeout = isSlowTimeline ? SLOW_READ_TIMEOUT : DEFAULT_TIMEOUT

  let { json: items, headers } = await getWithHeaders(url, auth(accessToken), { timeout })

  if (timeline === 'direct') {
    items = items.map(item => item.last_status).filter(Boolean) // ignore falsy last_status'es
  }
  return { items, headers }
}
