// @mock _store/store.js -> ./mocks/pushEnvironment.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pushManager, browserSubscriptionWithKey, server, store, reloadedKeys, lockLog, sameKey, SERVER_KEY, OTHER_KEY } from './mocks/pushEnvironment.js'
import { updateAlerts, updatePushSubscriptionForInstance } from '../src/routes/_actions/pushSubscription.js'

const ALERTS = { mention: true }
const reset = () => {
  pushManager.current = null
  pushManager.subscribed.length = 0
  server.subscription = null
  server.requests.length = 0
  const state = store.get()
  state.pushSubscriptions = {}
  state.enableDesktopNotifications = {}
}

test('a new subscription is keyed to the server and the dummy is removed', async () => {
  reset()
  await updateAlerts('a.social', ALERTS)
  const [dummy, real] = pushManager.subscribed
  assert.equal(dummy.unsubscribed, true)
  assert.equal(pushManager.current, real)
  assert.ok(sameKey(real.options.applicationServerKey, SERVER_KEY))
  assert.equal(server.subscription.endpoint, real.endpoint)
  assert.equal(store.get().pushSubscriptions['a.social'].endpoint, real.endpoint)
})

test('the dummy subscription is removed even when the server refuses it', async () => {
  reset()
  server.failNextPost = 403
  await assert.rejects(updateAlerts('a.social', ALERTS))
  assert.equal(pushManager.subscribed[0].unsubscribed, true)
  assert.equal(pushManager.current, null)
})

test("an existing subscription with another server's key is re-keyed", async () => {
  reset()
  browserSubscriptionWithKey(OTHER_KEY) // left behind by a logged-out push account
  await updateAlerts('a.social', ALERTS)
  assert.ok(sameKey(pushManager.current.options.applicationServerKey, SERVER_KEY))
  assert.equal(server.subscription.endpoint, pushManager.current.endpoint)
})

test('a server pushing to another endpoint gets the browser one registered', async () => {
  reset()
  const subscription = browserSubscriptionWithKey(SERVER_KEY)
  server.subscription = { id: 1, endpoint: 'https://push.example/dead', server_key: SERVER_KEY, alerts: ALERTS }
  store.get().pushSubscriptions['a.social'] = server.subscription
  await updatePushSubscriptionForInstance('a.social')
  assert.equal(server.subscription.endpoint, subscription.endpoint)
  assert.equal(store.get().pushSubscriptions['a.social'].endpoint, subscription.endpoint)
})

test('an account that lost push to another one does not take it back silently', async () => {
  reset()
  const state = store.get()
  state.enableDesktopNotifications = { 'a.social': true, 'b.social': true } // b holds push now
  await updatePushSubscriptionForInstance('a.social')
  assert.equal(pushManager.subscribed.length, 0)
  assert.equal(state.enableDesktopNotifications['a.social'], false)
  assert.equal(state.enableDesktopNotifications['b.social'], true)
})

test('push operations run one at a time and start from the stored state', async () => {
  reset()
  lockLog.length = 0
  reloadedKeys.length = 0
  await Promise.all([updateAlerts('a.social', ALERTS), updateAlerts('a.social', ALERTS)])
  assert.deepEqual(lockLog, ['enter', 'exit', 'enter', 'exit'])
  assert.ok(reloadedKeys.length === 2 && reloadedKeys[0].includes('pushSubscriptions'))
})
