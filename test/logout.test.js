// @mock _store/store.js -> ./mocks/appStore.js
// @mock toast/toast.js -> ./mocks/appMisc.js
// @mock _database/database.js -> ./mocks/appMisc.js
// @mock __sapper__/client.js -> ./mocks/appMisc.js
// @mock importVirtualListStore.js -> ./mocks/appMisc.js
// @mock themeEngine.js -> ./mocks/appMisc.js
// @mock console/hook.ts -> ./mocks/appMisc.js
// @mock formatIntl.js -> ./mocks/appMisc.js
// @mock getSingleInstance.js -> ./mocks/appMisc.js
// @mock ./pushSubscription.js -> ./mocks/appMisc.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { store } from './mocks/appStore.js'
import { logOutOfInstance } from '../src/routes/_actions/instances.js'

const state = store.get()
Object.assign(state, {
  loggedInInstances: {},
  loggedInInstancesInOrder: [],
  pushSubscriptions: {},
  customEmoji: {},
  instanceInfos: {},
  instanceLists: {},
  instanceFilters: {},
  instanceThemes: {},
  verifyCredentials: {},
  pinnedPages: {},
  statusModifications: {},
  lastPushAlerts: {},
  pushFailureCount: {},
  osNotificationPrompted: {},
  instanceDataReady: {},
  lastContentTypes: {},
  instanceFollowedHashtags: {},
  enableGrayscale: false
})
function login (name, withClient, withPush) {
  state.loggedInInstances[name] = Object.assign({ access_token: 'tok-' + name },
    withClient ? { oauthClient: { client_id: 'cid-' + name, client_secret: 'sec-' + name } } : {})
  state.loggedInInstancesInOrder.push(name)
  if (withPush) state.pushSubscriptions[name] = { id: 1 }
}
const calls = []
globalThis.fetch = async (url, opts) => {
  calls.push({ url, method: opts.method, body: opts.body && String(opts.body) })
  return { status: 200, headers: new Map(), json: async () => ({}) }
}
const settle = () => new Promise(resolve => setTimeout(resolve, 20))

test('logout deletes the push subscription first, then revokes the token (v1.12.4)', async () => {
  login('a.social', true, true)
  login('b.social', false, false)
  login('c.social', true, false)
  state.currentInstance = 'a.social'
  await logOutOfInstance('a.social')
  await settle()
  assert.equal(calls.length, 2)
  assert.equal(calls[0].method, 'DELETE')
  assert.match(calls[0].url, /\/api\/v1\/push\/subscription$/)
  assert.equal(calls[1].url, 'https://a.social/oauth/revoke')
  assert.equal(calls[1].body, 'client_id=cid-a.social&client_secret=sec-a.social&token=tok-a.social')
})

test('sessions from before v1.12.4 have no app credentials: nothing to revoke', async () => {
  calls.length = 0
  await logOutOfInstance('b.social')
  await settle()
  assert.equal(calls.length, 0)
})

test('a second logout of the same account is a no-op and keeps the others', async () => {
  calls.length = 0
  await logOutOfInstance('b.social')
  await settle()
  assert.equal(calls.length, 0)
  assert.deepEqual(state.loggedInInstancesInOrder, ['c.social'])
})
