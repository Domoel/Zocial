// @mock __sapper__/service-worker.js -> ./mocks/sapperServiceWorker.js
// @mock _database/pushTokenInstance.js -> ./mocks/pushTokens.js
// @mock _database/webShare.js -> ./mocks/pushTokens.js
// @mock _database/theme.js -> ./mocks/pushTokens.js
// @define ZOCIAL_IS_SERVICE_WORKER=true
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { handlers, shown, windows } from './mocks/serviceWorkerGlobals.js'
import '../src/service-worker.js'

const PAYLOAD = { title: 'A mentioned you', body: 'hi', access_token: 'tok-a', notification_id: '42', icon: 'https://a/avatar.png' }

async function push (data) {
  const pending = []
  handlers.push({
    data: data === undefined ? null : { json: () => { if (data instanceof Error) throw data; return data } },
    waitUntil: p => pending.push(p)
  })
  await Promise.all(pending)
}
function reset ({ fetchResult } = {}) {
  shown.length = 0
  windows.length = 0
  globalThis.fetch = async () => {
    if (fetchResult instanceof Error) throw fetchResult
    return { status: 200, headers: new Map(), json: async () => fetchResult }
  }
}
function report (id, instance) {
  handlers.message({ data: { type: 'zocial-view', instance }, source: { id } })
}

test('a push without a usable payload still shows a notification', async () => {
  reset()
  await push(undefined)
  await push(new SyntaxError('not JSON'))
  assert.deepEqual(shown.map(n => n.title), ['Zocial', 'Zocial'])
})

test('an unknown token or a failing lookup still shows the plain notification', async () => {
  reset({ fetchResult: new TypeError('Failed to fetch') })
  await push(Object.assign({}, PAYLOAD, { access_token: 'unknown' }))
  await push(PAYLOAD) // known account, but fetching the notification fails
  assert.equal(shown.length, 2)
  assert.ok(shown.every(n => n.title === PAYLOAD.title && n.options.body === 'hi'))
})

test('a rich notification for a mention offers boost and favourite, sent to the right instance', async () => {
  reset({ fetchResult: { id: '42', type: 'mention', account: { id: '1' }, status: { id: '9', visibility: 'public', url: 'https://a.social/@x/9', account: { acct: 'x' } } } })
  await push(PAYLOAD)
  assert.equal(shown.length, 1)
  assert.deepEqual(shown[0].options.actions.map(a => a.action), ['reblog', 'favourite'])
  assert.equal(shown[0].options.data.instance, 'https://a.social')
})

test('a notification type the worker does not know is shown plainly, never dropped', async () => {
  reset({ fetchResult: { id: '42', type: 'added_to_collection', account: { id: '1' } } })
  await push(PAYLOAD)
  assert.equal(shown.length, 1)
})

test("suppressed only while a visible window shows that push's account", async () => {
  reset({ fetchResult: { id: '42', type: 'follow', account: { id: '1' } } })
  windows.push({ id: 'w1', visibilityState: 'visible' })
  await push(PAYLOAD) // the window hasn't said which account it shows: as before, suppress
  assert.equal(shown.length, 0)
  report('w1', 'b.social')
  await push(PAYLOAD) // the visible window shows another account: this one would be lost
  assert.equal(shown.length, 1)
  report('w1', 'a.social')
  await push(PAYLOAD) // the push's own account is on screen: the in-app stream has it
  assert.equal(shown.length, 1)
  windows[0].visibilityState = 'hidden'
  await push(PAYLOAD)
  assert.equal(shown.length, 2)
})
