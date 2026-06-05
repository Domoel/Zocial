import { getWithHeaders, paramsString, parseNextMaxId, DEFAULT_TIMEOUT } from '../_utils/ajax.js'
import { auth, basename } from './utils.js'

const LIMIT = 80

// Followers/following paginate by an internal id exposed only via the Link header.
// Returns { accounts, nextMaxId } (nextMaxId is null when there are no more pages).
async function getAccountList (url, accessToken, maxId) {
  const params = { limit: LIMIT }
  if (maxId) {
    params.max_id = maxId
  }
  const { json, headers } = await getWithHeaders(`${url}?${paramsString(params)}`, auth(accessToken), { timeout: DEFAULT_TIMEOUT })
  return {
    accounts: Array.isArray(json) ? json : [],
    nextMaxId: parseNextMaxId(headers.get('Link'))
  }
}

export async function getFollows (instanceName, accessToken, accountId, maxId) {
  return getAccountList(`${basename(instanceName)}/api/v1/accounts/${accountId}/following`, accessToken, maxId)
}

export async function getFollowers (instanceName, accessToken, accountId, maxId) {
  return getAccountList(`${basename(instanceName)}/api/v1/accounts/${accountId}/followers`, accessToken, maxId)
}
