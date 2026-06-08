import { get, DEFAULT_TIMEOUT, post, delWithBody, WRITE_TIMEOUT } from '../_utils/ajax.js'
import { auth, basename } from './utils.js'

export function getLists (instanceName, accessToken) {
  const url = `${basename(instanceName)}/api/v1/lists`
  return get(url, auth(accessToken), { timeout: DEFAULT_TIMEOUT })
}

export function createList (instanceName, accessToken, title) {
  const url = `${basename(instanceName)}/api/v1/lists`
  return post(url, { title }, auth(accessToken), { timeout: WRITE_TIMEOUT })
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
