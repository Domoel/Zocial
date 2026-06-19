import { get, DEFAULT_TIMEOUT, post, put, del, delWithBody, WRITE_TIMEOUT } from '../_utils/ajax.js'
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
