import { get, set, del, keys } from '../_thirdparty/idb-keyval/idb-keyval.js'

// A flat, service-worker-readable lookup mapping a push `access_token` → instance name.
//
// A Web Push payload carries the subscription's `access_token` but NOT which instance it belongs to
// (mastodon#22183). The service worker can't read the app store (localStorage), so we mirror just
// the token→instance mapping into the shared idb-keyval store (the same one it already reads for
// `known-instance-*` / `theme`). The SW resolves the instance from this table to build a rich,
// per-account notification for any number of logged-in accounts, instead of the old
// `getKnownInstances().length === 1` all-or-nothing gate.
//
// Security: the token is used as the key. It is not new exposure — the same tokens already live in
// localStorage (`loggedInInstances`) and the SW already receives `access_token` in every payload.
const PREFIX = 'push-token-'

export function setPushTokenInstance (accessToken, instanceName) {
  return set(PREFIX + accessToken, instanceName)
}

export function getInstanceForPushToken (accessToken) {
  if (!accessToken) {
    return Promise.resolve(undefined)
  }
  return get(PREFIX + accessToken)
}

export function deletePushTokenInstance (accessToken) {
  return del(PREFIX + accessToken)
}

// Reconcile the whole table against the currently-logged-in accounts (`{ token: instanceName }`):
// add/update present accounts and delete stale tokens, so a logged-out account leaves no ghost
// token for the SW to enrich against. Idempotent and cheap (the store is tiny).
export async function reconcilePushTokenInstances (tokenToInstance) {
  const desired = new Set(Object.keys(tokenToInstance))
  const existing = (await keys()).filter(k => typeof k === 'string' && k.startsWith(PREFIX))
  await Promise.all(existing.map(k => {
    const token = k.substring(PREFIX.length)
    return desired.has(token) ? undefined : del(k)
  }))
  await Promise.all(Object.keys(tokenToInstance).map(
    token => set(PREFIX + token, tokenToInstance[token])
  ))
}
