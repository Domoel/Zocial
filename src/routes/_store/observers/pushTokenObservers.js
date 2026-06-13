import { reconcilePushTokenInstances } from '../../_database/pushTokenInstance.js'

// Keep the flat, service-worker-readable token→instance lookup in sync with the logged-in accounts
// (C+ push routing — see _database/pushTokenInstance.js). Reconciling on every `loggedInInstances`
// change covers login, logout, and existing sessions on first load (the observe fires immediately
// with the current value), and removes ghost tokens for logged-out accounts.
export function pushTokenObservers (store) {
  if (!ZOCIAL_IS_BROWSER) {
    return
  }
  store.observe('loggedInInstances', loggedInInstances => {
    const tokenToInstance = {}
    if (loggedInInstances) {
      for (const name of Object.keys(loggedInInstances)) {
        const data = loggedInInstances[name]
        if (data && data.access_token) {
          tokenToInstance[data.access_token] = name
        }
      }
    }
    /* no await */ reconcilePushTokenInstances(tokenToInstance).catch(e => {
      console.warn('failed to sync push-token lookup', (e && e.message) || e)
    })
  })
}
