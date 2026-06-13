import { reconcilePushTokenInstances } from '../../_database/pushTokenInstance.js'

// Serialise reconciles so a burst of login/logout changes can't race on the shared idb-keyval store
// (concurrent keys()/set()/del()), and so the final run always reflects the latest state.
let reconcileChain = Promise.resolve()

function buildTokenMap (loggedInInstances) {
  const tokenToInstance = {}
  if (loggedInInstances) {
    for (const name of Object.keys(loggedInInstances)) {
      const data = loggedInInstances[name]
      if (data && data.access_token) {
        tokenToInstance[data.access_token] = name
      }
    }
  }
  return tokenToInstance
}

// Keep the flat, service-worker-readable token→instance lookup in sync with the logged-in accounts
// (C+ push routing — see _database/pushTokenInstance.js). Reconciling on every `loggedInInstances`
// change covers login, logout, and existing sessions on first load (the observe fires immediately
// with the current value), and removes ghost tokens for logged-out accounts.
export function pushTokenObservers (store) {
  if (!ZOCIAL_IS_BROWSER) {
    return
  }
  store.observe('loggedInInstances', () => {
    // Read fresh inside the serialized step (not the snapshot the observer was fired with), so the
    // last queued reconcile writes the final truth even under rapid successive changes.
    reconcileChain = reconcileChain
      .then(() => reconcilePushTokenInstances(buildTokenMap(store.get().loggedInInstances)))
      .catch(e => console.warn('failed to sync push-token lookup', (e && e.message) || e))
  })
}
