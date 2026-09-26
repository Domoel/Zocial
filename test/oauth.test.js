// @mock _store/store.js -> ./mocks/oauthEnvironment.js
// @mock __sapper__/client.js -> ./mocks/oauthEnvironment.js
// @mock themeEngine.js -> ./mocks/oauthEnvironment.js
// @mock ./instances.js -> ./mocks/oauthEnvironment.js
// @mock ./emoji.js -> ./mocks/oauthEnvironment.js
// @mock _database/database.js -> ./mocks/oauthEnvironment.js
// @mock formatIntl.js -> ./mocks/oauthEnvironment.js
// @mock getSingleInstance.js -> ./mocks/oauthEnvironment.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { store, requests } from './mocks/oauthEnvironment.js'
import { logInToInstance, handleOauthCode } from '../src/routes/_actions/addInstance.js'

test('login registers the app and redirects with a random, stored state', async () => {
  await logInToInstance()
  const state = store.get()
  assert.equal(state.currentRegisteredInstanceName, 'social.example')
  assert.match(state.currentRegisteredInstanceState, /^[0-9a-f]{32}$/)
  await new Promise(resolve => setTimeout(resolve, 250))
  const url = new URL(document.location.href)
  assert.equal(url.origin + url.pathname, 'https://social.example/oauth/authorize')
  assert.equal(url.searchParams.get('state'), state.currentRegisteredInstanceState)
  assert.equal(url.searchParams.get('redirect_uri'), 'https://zocial.test/settings/instances/add')
})

test('a callback without our state is refused before the code is exchanged, and says so', async () => {
  requests.length = 0
  await handleOauthCode('code', 'forged')
  assert.ok(!requests.some(r => r.url.endsWith('/oauth/token')))
  assert.match(store.get().logInToInstanceError, /invalidOauthState/)
  assert.equal(store.get().logInToInstanceErrorForText, 'Social.Example/') // the form shows it
  assert.equal(store.get().loggedInInstances['social.example'], undefined)
})

test('the matching callback logs in and keeps the app credentials for revocation (v1.12.4)', async () => {
  requests.length = 0
  await handleOauthCode('code', store.get().currentRegisteredInstanceState)
  const token = requests.find(r => r.url.endsWith('/oauth/token'))
  assert.equal(token.body.client_secret, 'secret')
  assert.equal(token.body.code, 'code')
  const state = store.get()
  assert.deepEqual(state.loggedInInstances['social.example'].oauthClient, { client_id: 'cid', client_secret: 'secret' })
  assert.equal(state.loggedInInstances['social.example'].access_token, 'tok')
  assert.equal(state.currentInstance, 'social.example')
  assert.equal(state.currentRegisteredInstance, null)
  assert.equal(state.currentRegisteredInstanceState, null)
})

test('error text from the server is escaped before it reaches {@html}', async () => {
  globalThis.fetch = async () => ({ status: 400, headers: new Map(), json: async () => ({ error: '<img src=x onerror=alert(1)>' }) })
  store.set({ currentRegisteredInstanceState: 's', currentRegisteredInstanceName: 'social.example', currentRegisteredInstance: { client_id: 'cid', client_secret: 'secret' } })
  await handleOauthCode('code', 's')
  assert.doesNotMatch(store.get().logInToInstanceError, /<img/)
  assert.match(store.get().logInToInstanceError, /&lt;img/)
})
