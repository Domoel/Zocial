import { auth, basename } from './utils.js'
import { get, del, put, DEFAULT_TIMEOUT, WRITE_TIMEOUT } from '../_utils/ajax.js'

// Fetches the current user's scheduled statuses (first page).
export async function getScheduledStatuses (instanceName, accessToken) {
  const url = `${basename(instanceName)}/api/v1/scheduled_statuses`
  const statuses = await get(url, auth(accessToken), { timeout: DEFAULT_TIMEOUT })
  // work around backends that may return a non-array when there are none
  return Array.isArray(statuses) ? statuses : []
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
