import { getAccount } from '../_api/user.js'
import { getRelationship } from '../_api/relationships.js'
import { database } from '../_database/database.js'
import { store } from '../_store/store.js'
import { logActionError } from '../_utils/isNetworkError.js'

// currentAccountProfile / currentAccountRelationship belong to the profile page being shown. A late
// result for another account (a slow request after navigating on, or an action on some other account
// from a post's options menu) must not replace that page's header or follow button.
let profilePageAccountId = null

function isShownProfile (accountId) {
  return accountId === profilePageAccountId
}

async function _updateAccount (accountId, instanceName, accessToken) {
  const localPromise = database.getAccount(instanceName, accountId)
  const remotePromise = getAccount(instanceName, accessToken, accountId).then(account => {
    /* no await */ database.setAccount(instanceName, account).catch(() => {}) // cache only
    return account
  })

  try {
    const account = await localPromise
    if (isShownProfile(accountId)) {
      store.set({ currentAccountProfile: account })
    }
  } catch (e) {
    console.error(e)
  }
  try {
    const account = await remotePromise
    if (isShownProfile(accountId)) {
      store.set({ currentAccountProfile: account })
    }
  } catch (e) {
    logActionError('load account profile', e)
  }
}

async function _updateRelationship (accountId, instanceName, accessToken) {
  const localPromise = database.getRelationship(instanceName, accountId)
  const remotePromise = getRelationship(instanceName, accessToken, accountId).then(relationship => {
    if (relationship) {
      /* no await */ database.setRelationship(instanceName, relationship).catch(() => {}) // cache only
      return relationship
    }
  })
  try {
    const relationship = await localPromise
    if (isShownProfile(accountId)) {
      store.set({ currentAccountRelationship: relationship })
    }
  } catch (e) {
    console.error(e)
  }
  try {
    const relationship = await remotePromise
    if (isShownProfile(accountId)) {
      store.set({ currentAccountRelationship: relationship })
    }
  } catch (e) {
    logActionError('load relationship', e)
  }
}

export async function updateLocalRelationship (instanceName, accountId, relationship) {
  if (isShownProfile(accountId)) {
    try {
      store.set({ currentAccountRelationship: relationship })
    } catch (e) {
      console.error(e)
    }
  }
  // The server has already applied the change: a failed local write (quota, aborted transaction)
  // must not turn the follow/block into an error toast or skip the caller's purge.
  try {
    await database.setRelationship(instanceName, relationship)
  } catch (e) {
    console.warn('failed to store relationship:', (e && e.message) || e)
  }
}

export async function clearProfileAndRelationship () {
  store.set({
    currentAccountProfile: null,
    currentAccountRelationship: null
  })
}

export async function updateProfileAndRelationship (accountId) {
  const { currentInstance, accessToken } = store.get()

  profilePageAccountId = accountId
  await clearProfileAndRelationship()
  await Promise.all([
    _updateAccount(accountId, currentInstance, accessToken),
    _updateRelationship(accountId, currentInstance, accessToken)
  ])
}

// Refresh the relationship after e.g. a domain block. The profile itself stays (clearing it made the
// whole header disappear until the next navigation).
export async function updateRelationship (accountId) {
  const { currentInstance, accessToken } = store.get()

  await _updateRelationship(accountId, currentInstance, accessToken)
}

// The relationship with a post's author for its options menu — local copy first, then the server —
// without touching the profile page's state.
export async function loadRelationship (accountId, onRelationship) {
  const { currentInstance, accessToken } = store.get()
  try {
    const local = await database.getRelationship(currentInstance, accountId)
    if (local) {
      onRelationship(local)
    }
  } catch (e) {
    console.warn('failed to read cached relationship:', (e && e.message) || e)
  }
  try {
    const remote = await getRelationship(currentInstance, accessToken, accountId)
    if (remote) {
      onRelationship(remote)
      /* no await */ database.setRelationship(currentInstance, remote).catch(() => {})
    }
  } catch (e) {
    logActionError('load relationship', e)
  }
}
