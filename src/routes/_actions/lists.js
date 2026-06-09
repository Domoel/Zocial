import { store } from '../_store/store.js'
import { getLists, createList } from '../_api/lists.js'
import { cacheFirstUpdateAfter, cacheFirstUpdateOnlyIfNotInCache } from '../_utils/sync.js'
import { database } from '../_database/database.js'

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
        }
      )
      const { instanceListsSupported } = store.get()
      if (!instanceListsSupported[instanceName]) {
        instanceListsSupported[instanceName] = true
        store.set({ instanceListsSupported })
      }
    } catch (e) {
      const { instanceListsSupported } = store.get()
      instanceListsSupported[instanceName] = false
      store.set({ instanceListsSupported })
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

export async function createNewList (title) {
  const { currentInstance, accessToken } = store.get()
  await createList(currentInstance, accessToken, title)
  await updateListsForInstance(currentInstance)
}
