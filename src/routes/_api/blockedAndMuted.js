import { DEFAULT_TIMEOUT, getWithHeaders, paramsString, parseNextMaxId } from '../_utils/ajax.js'
import { auth, basename } from './utils.js'

export const ACCOUNTS_LIMIT = 80

// /mutes and /blocks paginate by an internal relationship id exposed only via the Link
// header (NOT the account id), so we read nextMaxId from there. Returns { accounts, nextMaxId }.
async function getAccounts (url, accessToken, maxId) {
  const params = { limit: ACCOUNTS_LIMIT }
  if (maxId) {
    params.max_id = maxId
  }
  const { json, headers } = await getWithHeaders(`${url}?${paramsString(params)}`, auth(accessToken), { timeout: DEFAULT_TIMEOUT })
  return {
    accounts: Array.isArray(json) ? json : [],
    nextMaxId: parseNextMaxId(headers.get('Link'))
  }
}

export async function getBlockedAccounts (instanceName, accessToken, maxId) {
  return getAccounts(`${basename(instanceName)}/api/v1/blocks`, accessToken, maxId)
}

export async function getMutedAccounts (instanceName, accessToken, maxId) {
  return getAccounts(`${basename(instanceName)}/api/v1/mutes`, accessToken, maxId)
}
