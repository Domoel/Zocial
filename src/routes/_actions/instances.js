import { getVerifyCredentials } from '../_api/user.js'
import { store } from '../_store/store.js'
import { switchToTheme } from '../_utils/themeEngine.js'
import { toast } from '../_components/toast/toast.js'
import { goto } from '../../../__sapper__/client.js'
import { cacheFirstUpdateAfter } from '../_utils/sync.js'
import { getInstanceInfo, fetchNodeInfo } from '../_api/instance.js'
import { auth } from '../_api/utils.js'
import { database } from '../_database/database.js'
import { importVirtualListStore } from '../_utils/asyncModules/importVirtualListStore.js'
import { formatIntl } from '../_utils/formatIntl.js'
import { getSingleInstance } from '../_utils/getSingleInstance.js'
import { clearLogs } from '../_utils/console/hook.ts'

export function changeTheme (instanceName, newTheme) {
  const { instanceThemes } = store.get()
  instanceThemes[instanceName] = newTheme
  store.set({ instanceThemes })
  store.save()
  const { currentInstance } = store.get()
  if (instanceName === currentInstance) {
    const { enableGrayscale } = store.get()
    switchToTheme(newTheme, enableGrayscale)
  }
}

export function switchToInstance (instanceName) {
  const { instanceThemes } = store.get()
  store.set({
    currentInstance: instanceName,
    searchResults: null,
    queryInSearch: ''
  })
  store.save()
  const { enableGrayscale } = store.get()
  switchToTheme(instanceThemes[instanceName], enableGrayscale)
}

export async function logOutOfInstance (instanceName, message) {
  message = message || formatIntl('intl.loggedOutOfInstance', { instance: instanceName })
  const {
    composeData,
    currentInstance,
    customEmoji,
    instanceInfos,
    instanceLists,
    instanceFilters,
    instanceThemes,
    loggedInInstances,
    loggedInInstancesInOrder,
    verifyCredentials,
    pinnedPages,
    statusModifications,
    pushSubscriptions,
    lastPushAlerts,
    osNotificationPrompted,
    instanceDataReady,
    lastContentTypes,
    instanceFollowedHashtags
  } = store.get()
  loggedInInstancesInOrder.splice(loggedInInstancesInOrder.indexOf(instanceName), 1)
  const newInstance = instanceName === currentInstance ? loggedInInstancesInOrder[0] : currentInstance
  const objectsToClear = [
    composeData,
    customEmoji,
    instanceInfos,
    instanceLists,
    instanceFilters,
    instanceThemes,
    loggedInInstances,
    verifyCredentials,
    pinnedPages,
    statusModifications,
    pushSubscriptions,
    lastPushAlerts,
    osNotificationPrompted,
    instanceDataReady,
    lastContentTypes,
    instanceFollowedHashtags
  ]
  for (const obj of objectsToClear) {
    delete obj[instanceName]
  }
  store.set({
    composeData,
    currentInstance: newInstance,
    customEmoji,
    instanceInfos,
    instanceLists,
    instanceFilters,
    instanceThemes,
    pinnedPages,
    loggedInInstances,
    loggedInInstancesInOrder,
    queryInSearch: '',
    searchResults: null,
    timelineInitialized: false,
    timelinePreinitialized: false,
    verifyCredentials,
    statusModifications,
    pushSubscriptions,
    lastPushAlerts,
    osNotificationPrompted,
    instanceDataReady,
    lastContentTypes,
    instanceFollowedHashtags
  })
  store.clearTimelineDataForInstance(instanceName)
  store.clearAutosuggestDataForInstance(instanceName)
  store.save()
  const { virtualListStore } = await importVirtualListStore()
  virtualListStore.clearRealmByPrefix(currentInstance + '/') // TODO: this is a hacky way to clear the vlist cache
  toast.say(message)
  // wipe captured logs (incl. the persisted copy) so nothing is left behind on logout
  clearLogs()
  const { enableGrayscale } = store.get()
  switchToTheme(instanceThemes[newInstance], enableGrayscale)
  /* no await */ database.clearDatabaseForInstance(instanceName)
  goto(getSingleInstance() ? '/' : '/settings/instances')
}

function setStoreVerifyCredentials (instanceName, thisVerifyCredentials) {
  store.runIfLoggedIn(instanceName, ({ verifyCredentials }) => {
    verifyCredentials[instanceName] = thisVerifyCredentials
    store.set({ verifyCredentials })
  })
}

export async function updateVerifyCredentialsForInstance (instanceName) {
  return store.runIfLoggedIn(instanceName, async ({ loggedInInstances }) => {
    const accessToken = loggedInInstances[instanceName].access_token
    await cacheFirstUpdateAfter(
      () => getVerifyCredentials(instanceName, accessToken).catch(logOutOnUnauthorized(instanceName)),
      () => database.getInstanceVerifyCredentials(instanceName),
      verifyCredentials => database.setInstanceVerifyCredentials(instanceName, verifyCredentials),
      verifyCredentials => setStoreVerifyCredentials(instanceName, verifyCredentials)
    )
  })
}

export async function updateVerifyCredentialsForCurrentInstance () {
  const { currentInstance } = store.get()
  await updateVerifyCredentialsForInstance(currentInstance)
}

export async function updateInstanceInfo (instanceName) {
  await cacheFirstUpdateAfter(
    () => store.runIfLoggedIn(instanceName, ({ loggedInInstances }) => {
      const accessToken = loggedInInstances[instanceName].access_token
      return getInstanceInfo(instanceName, accessToken)
    }) || Promise.reject(new Error('Instance no longer logged in')),
    () => database.getInstanceInfo(instanceName),
    info => {
      // preserve nodeInfo fetched separately by updateNodeInfoForInstance
      const { instanceInfos } = store.get()
      const existingNodeInfo = instanceInfos[instanceName] && instanceInfos[instanceName].nodeInfo
      if (existingNodeInfo) info.nodeInfo = existingNodeInfo
      return database.setInstanceInfo(instanceName, info)
    },
    info => {
      store.runIfLoggedIn(instanceName, ({ instanceInfos }) => {
        instanceInfos[instanceName] = info
        store.set({ instanceInfos })
      })
    }
  )
}

export function logOutOnUnauthorized (instanceName) {
  return async error => {
    // ajax.js throws `Error('Request failed: <status>')` with `err.status` set; older code threw
    // `'401: …'`. Match the status code (keeping the legacy message check as a fallback) so a
    // revoked token is actually detected and we log out cleanly, instead of the 401 slipping
    // through and re-throwing as an uncaught promise rejection on every credentials refresh.
    if (error.status === 401 || (error.message && error.message.startsWith('401:'))) {
      await logOutOfInstance(instanceName, formatIntl('intl.accessTokenRevoked', { instance: instanceName }))
      return // Exit early to avoid re-throwing if we handled the 401
    }

    throw error
  }
}

export async function updateNodeInfoForInstance (instanceName) {
  return store.runIfLoggedIn(instanceName, async ({ loggedInInstances }) => {
    const accessToken = loggedInInstances[instanceName].access_token
    const headers = accessToken ? auth(accessToken) : null
    let nodeInfo
    try {
      nodeInfo = await fetchNodeInfo(instanceName, headers)
    } catch (e) {
      const cachedInfo = await database.getInstanceInfo(instanceName)
      if (cachedInfo && cachedInfo.pleroma) {
        console.warn('failed to get nodeInfo', e)
      }
      return
    }
    const cachedInfo = await database.getInstanceInfo(instanceName)
    if (!cachedInfo) return
    cachedInfo.nodeInfo = nodeInfo
    await database.setInstanceInfo(instanceName, cachedInfo)
    store.runIfLoggedIn(instanceName, ({ instanceInfos }) => {
      instanceInfos[instanceName] = Object.assign({}, instanceInfos[instanceName], { nodeInfo })
      store.set({ instanceInfos })
    })
  })
}
