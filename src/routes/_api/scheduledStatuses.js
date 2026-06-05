import { auth, basename } from './utils.js'
import { getWithHeaders, del, put, paramsString, parseNextMaxId, DEFAULT_TIMEOUT, WRITE_TIMEOUT } from '../_utils/ajax.js'

export const SCHEDULED_STATUSES_LIMIT = 20

// Fetches a page of the current user's scheduled statuses. Pass `maxId` (from a previous
// page's `nextMaxId`) to load the next page. Returns { items, nextMaxId } — nextMaxId is
// null when there are no more pages.
export async function getScheduledStatuses (instanceName, accessToken, maxId) {
  const params = { limit: SCHEDULED_STATUSES_LIMIT }
  if (maxId) {
    params.max_id = maxId
  }
  const url = `${basename(instanceName)}/api/v1/scheduled_statuses?${paramsString(params)}`
  const { json, headers } = await getWithHeaders(url, auth(accessToken), { timeout: DEFAULT_TIMEOUT })
  return {
    items: Array.isArray(json) ? json : [],
    nextMaxId: parseNextMaxId(headers.get('Link'))
  }
}

// Cancels (deletes) a scheduled status before it is published.
export async function cancelScheduledStatus (instanceName, accessToken, id) {
  const url = `${basename(instanceName)}/api/v1/scheduled_statuses/${id}`
  return del(url, auth(accessToken), { timeout: WRITE_TIMEOUT })
}

// Changes the time a scheduled status will be published (scheduledAt = ISO8601 string).
export async function rescheduleStatus (instanceName, accessToken, id, scheduledAt) {
  const url = `${basename(instanceName)}/api/v1/scheduled_statuses/${id}`
  return put(url, { scheduled_at: scheduledAt }, auth(accessToken), { timeout: WRITE_TIMEOUT })
}
