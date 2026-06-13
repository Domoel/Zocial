import { getAccessTokenFromAuthCode, registerApplication, generateAuthLink } from '../_api/oauth.js'
import { getInstanceInfo } from '../_api/instance.js'
import { goto } from '../../../__sapper__/client.js'
import { DEFAULT_THEME, switchToTheme } from '../_utils/themeEngine.js'
import { store } from '../_store/store.js'
import { updateVerifyCredentialsForInstance } from './instances.js'
import { updateCustomEmojiForInstance } from './emoji.js'
import { database } from '../_database/database.js'

const GENERIC_ERROR = `
  Is this a valid instance? Is a browser extension
  blocking the request? Are you in private browsing mode?
  If you believe this is a problem with your instance, please send
  <a href="https://git.ztfr.eu/Dome/Zocial/src/branch/main/docs/Admin-Guide.md"
    target="_blank" rel="noopener">this link</a> to the administrator of your instance.`

function createKnownError (message) {
  const err = new Error(message)
  err.knownError = true
  return err
}

function getRedirectUri () {
  return `${location.origin}/settings/instances/add`
}

// Random, unguessable OAuth state token (RFC 6749 §10.12) used to tie the authorize redirect
// to its callback, so a forged/replayed callback that we didn't initiate is rejected.
function generateOauthState () {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

async function redirectToOauth () {
  let { instanceNameInSearch, loggedInInstances } = store.get()
  instanceNameInSearch = instanceNameInSearch.replace(/^https?:\/\//, '').replace(/\/+$/, '').toLowerCase()
  if (Object.keys(loggedInInstances).includes(instanceNameInSearch)) {
    throw createKnownError(`You've already logged in to ${instanceNameInSearch}`)
  }
  const redirectUri = getRedirectUri()
  const registrationPromise = registerApplication(instanceNameInSearch, redirectUri)
  try {
    const instanceInfo = await getInstanceInfo(instanceNameInSearch)
    await database.setInstanceInfo(instanceNameInSearch, instanceInfo) // cache for later
  } catch (err) {
    // We get a 401 in limited federation mode, so we can just skip setting the instance info in that case.
    // It will be fetched automatically later.
    if (err.status !== 401) {
      throw err // this is a good way to test for typos in the instance name or some other problem
    }
  }
  const instanceData = await registrationPromise
  const oauthState = generateOauthState()
  store.set({
    currentRegisteredInstanceName: instanceNameInSearch,
    currentRegisteredInstance: instanceData,
    currentRegisteredInstanceState: oauthState
  })
  store.save()
  const oauthUrl = generateAuthLink(
    instanceNameInSearch,
    instanceData.client_id,
    redirectUri,
    oauthState
  )
  // setTimeout to allow the browser to *actually* save the localStorage data (fixes Safari bug apparently)
  setTimeout(() => {
    document.location.href = oauthUrl
  }, 200)
}

export async function logInToInstance () {
  store.set({
    logInToInstanceLoading: true,
    logInToInstanceError: null
  })
  try {
    await redirectToOauth()
  } catch (err) {
    console.error(err)
    const error = `${(err.message || err.name).replace(/\.$/, '')}. ` +
      (err.knownError ? '' : (navigator.onLine ? GENERIC_ERROR : 'Are you offline?'))
    const { instanceNameInSearch } = store.get()
    store.set({
      logInToInstanceError: error,
      logInToInstanceErrorForText: instanceNameInSearch
    })
  } finally {
    store.set({ logInToInstanceLoading: false })
  }
}

async function registerNewInstance (code) {
  const { currentRegisteredInstanceName, currentRegisteredInstance } = store.get()
  const redirectUri = getRedirectUri()
  const instanceData = await getAccessTokenFromAuthCode(
    currentRegisteredInstanceName,
    currentRegisteredInstance.client_id,
    currentRegisteredInstance.client_secret,
    code,
    redirectUri
  )
  const { loggedInInstances, loggedInInstancesInOrder, instanceThemes } = store.get()
  instanceThemes[currentRegisteredInstanceName] = DEFAULT_THEME
  loggedInInstances[currentRegisteredInstanceName] = instanceData
  if (!loggedInInstancesInOrder.includes(currentRegisteredInstanceName)) {
    loggedInInstancesInOrder.push(currentRegisteredInstanceName)
  }
  store.set({
    instanceNameInSearch: '',
    currentRegisteredInstanceName: null,
    currentRegisteredInstance: null,
    currentRegisteredInstanceState: null,
    loggedInInstances,
    currentInstance: currentRegisteredInstanceName,
    loggedInInstancesInOrder,
    instanceThemes
  })
  store.save()
  const { enableGrayscale } = store.get()
  switchToTheme(DEFAULT_THEME, enableGrayscale)
  // fire off these requests so they're cached
  /* no await */ updateVerifyCredentialsForInstance(currentRegisteredInstanceName)
  /* no await */ updateCustomEmojiForInstance(currentRegisteredInstanceName)
  goto('/')
}

export async function handleOauthCode (code, state) {
  try {
    store.set({ logInToInstanceLoading: true })
    // CSRF protection: the state returned by the instance must match the one we generated and
    // saved before redirecting. A missing/mismatched state means this callback wasn't started by
    // our own login flow (or was replayed/forged) — refuse it before exchanging the code.
    const { currentRegisteredInstanceState } = store.get()
    if (!currentRegisteredInstanceState || state !== currentRegisteredInstanceState) {
      throw createKnownError('Invalid OAuth state — please start the login again')
    }
    await registerNewInstance(code)
  } catch (err) {
    store.set({ logInToInstanceError: `${err.message || err.name}. Failed to connect to instance.` })
  } finally {
    store.set({ logInToInstanceLoading: false })
  }
}
