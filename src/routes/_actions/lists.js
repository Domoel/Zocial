import { store } from '../_store/store.js'
import { getLists, createList, updateList, deleteList, getListAccounts, addAccountToList, removeAccountFromList } from '../_api/lists.js'
import { cacheFirstUpdateAfter, cacheFirstUpdateOnlyIfNotInCache } from '../_utils/sync.js'
import { database } from '../_database/database.js'
import { removeAccountFromHomeTimeline } from './timeline.js'

// A list is exclusive when the server echoes exclusive:true on its List entity. Looked up from the
// cached lists so callers don't need to pass it around.
function isListExclusive (instanceName, listId) {
  const { instanceLists } = store.get()
  const lists = (instanceLists && instanceLists[instanceName]) || []
  const list = lists.find(l => l.id === listId)
  return !!(list && list.exclusive)
}

// Mark the home feed stale so the next setupTimeline (poll/navigate) re-fetches it. Used when an
// account should re-appear in home (a list became non-exclusive, a member was removed, or an
// exclusive list was deleted): the server filters home correctly, but our union-only cache won't
// pull them back on its own — a refetch does (§20 [v1.9.2] model).
function markHomeStale (instanceName) {
  store.setForTimeline(instanceName, 'home', { timelineItemSummariesAreStale: true })
}

// Exclusive-list support (Mastodon 3.3+, GoToSocial) is detected without a software allowlist: a
// backend that supports it returns an `exclusive` key on every List entity. So if we have at least
// one list and any of them carries the key, the feature is supported; if none do, it isn't. With
// zero lists we can't tell, so leave the flag unchanged (null/unknown → treated optimistically).
function listHasExclusiveField (list) {
  return list && typeof list.exclusive !== 'undefined'
}

function updateExclusiveSupportFromLists (instanceName, lists) {
  if (!lists || !lists.length) {
    return // can't tell from zero lists
  }
  const supported = lists.some(listHasExclusiveField)
  const { instanceListsExclusiveSupported } = store.get()
  if (instanceListsExclusiveSupported[instanceName] !== supported) {
    instanceListsExclusiveSupported[instanceName] = supported
    store.set({ instanceListsExclusiveSupported })
  }
}

async function syncLists (instanceName, syncMethod) {
  return store.runIfLoggedIn(instanceName, async ({ loggedInInstances }) => {
    const accessToken = loggedInInstances[instanceName].access_token
    try {
      await syncMethod(
        () => getLists(instanceName, accessToken),
        () => database.getLists(instanceName),
        lists => database.setLists(instanceName, lists),
        lists => {
          store.runIfLoggedIn(instanceName, ({ instanceLists }) => {
            instanceLists[instanceName] = lists
            store.set({ instanceLists })
          })
          updateExclusiveSupportFromLists(instanceName, lists)
        }
      )
      const { instanceListsSupported } = store.get()
      if (!instanceListsSupported[instanceName]) {
        instanceListsSupported[instanceName] = true
        store.set({ instanceListsSupported })
      }
    } catch (e) {
      // Only mark lists as unsupported for HTTP responses that genuinely indicate the
      // backend doesn't implement them. Transient errors (429, 5xx, network failures)
      // must not hide the lists UI for the entire session.
      if (e.status === 403 || e.status === 404 || e.status === 501) {
        const { instanceListsSupported } = store.get()
        instanceListsSupported[instanceName] = false
        store.set({ instanceListsSupported })
      }
      throw e
    }
  })
}

export async function updateListsForInstance (instanceName) {
  await syncLists(instanceName, cacheFirstUpdateAfter)
}

export async function setupListsForInstance (instanceName) {
  await syncLists(instanceName, cacheFirstUpdateOnlyIfNotInCache)
}

// Returns the created List entity so the caller can verify whether `exclusive` was honoured
// (a backend without support silently ignores the field — we surface that as a toast).
export async function createNewList (title, exclusive) {
  const { currentInstance, accessToken } = store.get()
  const created = await createList(currentInstance, accessToken, title, exclusive)
  // A single fresh entity is enough to learn support (it carries `exclusive` iff supported).
  updateExclusiveSupportFromLists(currentInstance, [created])
  await updateListsForInstance(currentInstance)
  return created
}

export async function renameList (listId, title) {
  const { currentInstance, accessToken } = store.get()
  await updateList(currentInstance, accessToken, listId, { title })
  await updateListsForInstance(currentInstance)
}

export async function setListExclusive (listId, exclusive) {
  const { currentInstance, accessToken } = store.get()
  const updated = await updateList(currentInstance, accessToken, listId, { exclusive: !!exclusive })
  updateExclusiveSupportFromLists(currentInstance, [updated])
  // Honour the exclusive promise for already-cached posts (mark-stale alone can't — the home merge
  // is union-only). Turning ON: purge every current member from home. Turning OFF: mark home stale
  // so they re-appear. Only act if the server actually applied exclusive (updated.exclusive).
  if (updated && updated.exclusive) {
    try {
      const accounts = await getListAccounts(currentInstance, accessToken, listId)
      for (const account of (accounts || [])) {
        await removeAccountFromHomeTimeline(currentInstance, account.id)
      }
    } catch (e) {
      console.warn('failed to purge exclusive-list members from home', (e && e.message) || e)
    }
  } else {
    markHomeStale(currentInstance)
  }
  await updateListsForInstance(currentInstance)
  return updated
}

export async function deleteListById (listId, wasExclusive) {
  const { currentInstance, accessToken } = store.get()
  await deleteList(currentInstance, accessToken, listId)
  // Deleting an exclusive list ends the server-side home exclusion for its members → bring them back.
  if (wasExclusive) {
    markHomeStale(currentInstance)
  }
  await updateListsForInstance(currentInstance)
}

// Membership changes that must respect exclusivity. Adding an account to an exclusive list hides it
// from home → purge it now; removing it from an exclusive list un-hides it → mark home stale so it
// re-appears. On a non-exclusive list neither applies (the API call is all that's needed).
export async function addAccountToListAndPurge (listId, accountId) {
  const { currentInstance, accessToken } = store.get()
  await addAccountToList(currentInstance, accessToken, listId, accountId)
  if (isListExclusive(currentInstance, listId)) {
    await removeAccountFromHomeTimeline(currentInstance, accountId)
  }
}

export async function removeAccountFromListAndRestore (listId, accountId) {
  const { currentInstance, accessToken } = store.get()
  await removeAccountFromList(currentInstance, accessToken, listId, accountId)
  if (isListExclusive(currentInstance, listId)) {
    markHomeStale(currentInstance)
  }
}
