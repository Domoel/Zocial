import { get, getWithHeaders, paramsString, parseNextMaxId, DEFAULT_TIMEOUT, post, put, del, delWithBody, WRITE_TIMEOUT } from '../_utils/ajax.js'
import { auth, basename } from './utils.js'

export function getLists (instanceName, accessToken) {
  const url = `${basename(instanceName)}/api/v1/lists`
  return get(url, auth(accessToken), { timeout: DEFAULT_TIMEOUT })
}

// `exclusive` (Mastodon 3.3+, GoToSocial): when true, the server hides this list's members from the
// home timeline. Sent unconditionally — a backend that doesn't support it ignores the field, and we
// detect actual support by reading `exclusive` back off the returned List entity (see _actions/lists).
export function createList (instanceName, accessToken, title, exclusive) {
  const url = `${basename(instanceName)}/api/v1/lists`
  return post(url, { title, exclusive: !!exclusive }, auth(accessToken), { timeout: WRITE_TIMEOUT })
}

export function updateList (instanceName, accessToken, listId, params) {
  const url = `${basename(instanceName)}/api/v1/lists/${listId}`
  return put(url, params, auth(accessToken), { timeout: WRITE_TIMEOUT })
}

export function deleteList (instanceName, accessToken, listId) {
  const url = `${basename(instanceName)}/api/v1/lists/${listId}`
  return del(url, auth(accessToken), { timeout: WRITE_TIMEOUT })
}

// All accounts in a list. `limit=0` is a Mastodon/GtS peculiarity that returns every member
// without pagination headers — exactly what we need to purge an exclusive list's members from home.
export function getListAccounts (instanceName, accessToken, listId) {
  const url = `${basename(instanceName)}/api/v1/lists/${listId}/accounts?limit=0`
  return get(url, auth(accessToken), { timeout: DEFAULT_TIMEOUT })
}

// Paginated members of a list — for the "Members" overview page (mirrors getFollows: returns
// `{ accounts, nextMaxId }`, paging by the Link header). Distinct from getListAccounts (limit=0,
// all-at-once, used to purge an exclusive list's members from home).
export async function getListAccountsPaged (instanceName, accessToken, listId, maxId) {
  const params = { limit: 80 }
  if (maxId) {
    params.max_id = maxId
  }
  const url = `${basename(instanceName)}/api/v1/lists/${listId}/accounts?${paramsString(params)}`
  const { json, headers } = await getWithHeaders(url, auth(accessToken), { timeout: DEFAULT_TIMEOUT })
  return {
    accounts: Array.isArray(json) ? json : [],
    nextMaxId: parseNextMaxId(headers.get('Link'))
  }
}

export function getListsForAccount (instanceName, accessToken, accountId) {
  const url = `${basename(instanceName)}/api/v1/accounts/${accountId}/lists`
  return get(url, auth(accessToken), { timeout: DEFAULT_TIMEOUT })
}

export function addAccountToList (instanceName, accessToken, listId, accountId) {
  const url = `${basename(instanceName)}/api/v1/lists/${listId}/accounts`
  return post(url, { account_ids: [accountId] }, auth(accessToken), { timeout: WRITE_TIMEOUT })
}

export function removeAccountFromList (instanceName, accessToken, listId, accountId) {
  const url = `${basename(instanceName)}/api/v1/lists/${listId}/accounts`
  return delWithBody(url, { account_ids: [accountId] }, auth(accessToken), { timeout: WRITE_TIMEOUT })
}
