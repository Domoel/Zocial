import { basename, auth } from './utils.js'
import { get, paramsString, DEFAULT_TIMEOUT } from '../_utils/ajax.js'

export async function getRelationship (instanceName, accessToken, accountId) {
  const url = `${basename(instanceName)}/api/v1/accounts/relationships?${paramsString({ id: accountId })}`
  const res = await get(url, auth(accessToken), { timeout: DEFAULT_TIMEOUT })
  return res[0]
}

// Batch variant: resolve relationships for several accounts in one request (Mastodon accepts
// repeated `id[]` params). Returns an array of relationship objects (order not guaranteed).
export async function getRelationships (instanceName, accessToken, accountIds) {
  if (!accountIds || !accountIds.length) {
    return []
  }
  const url = `${basename(instanceName)}/api/v1/accounts/relationships?${paramsString({ id: accountIds })}`
  return get(url, auth(accessToken), { timeout: DEFAULT_TIMEOUT })
}
