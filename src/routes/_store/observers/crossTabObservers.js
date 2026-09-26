import { database } from '../../_database/database.js'

// Reactions to changes another tab/window made (LocalStorageStore takes them over and fires
// `externalChange`).
export function crossTabObservers (store) {
  if (!ZOCIAL_IS_BROWSER) {
    return
  }
  store.on('externalChange', ({ key, previous }) => {
    if (key !== 'loggedInInstances') {
      return
    }
    const { loggedInInstances, currentInstance } = store.get()
    const loggedOut = Object.keys(previous || {}).filter(name => !(loggedInInstances && loggedInInstances[name]))
    for (const name of loggedOut) {
      // the other tab deleted its database; don't let anything here re-create it
      /* no await */ database.markInstanceLoggedOut(name).catch(() => {})
    }
    if (currentInstance && loggedOut.includes(currentInstance)) {
      // This tab shows an account that was logged out elsewhere (its token is revoked): start over
      // with the accounts that are left, as the other tab did.
      window.location.reload()
    }
  })
}
