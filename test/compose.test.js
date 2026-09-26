// @mock _store/store.js -> ./mocks/appStore.js
// @mock toast/toast.js -> ./mocks/appMisc.js
// @mock _database/database.js -> ./mocks/appMisc.js
// @mock scheduleIdleTask.js -> ./mocks/scheduleIdleTask.js
// @mock addStatusOrNotification.js -> ./mocks/appMisc.js
// @mock rehydrateStatusOrNotification.js -> ./mocks/appMisc.js
// @mock formatIntl.js -> ./mocks/appMisc.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { store } from './mocks/appStore.js'
import { postStatus } from '../src/routes/_actions/compose.js'

test('Idempotency-Key: one per draft, reused on retry, gone after success; none on edits', async () => {
  const requests = []
  let loseResponse = true
  globalThis.fetch = async (url, opts) => {
    requests.push({ method: opts.method, key: opts.headers['Idempotency-Key'] })
    if (loseResponse) {
      loseResponse = false
      throw new TypeError('Failed to fetch') // the server created the post, the response got lost
    }
    return { status: 200, headers: new Map(), json: async () => ({ id: '1', content: 'hi' }) }
  }
  const warn = console.warn
  console.warn = () => {}
  try {
    store.setComposeData('dialog', { text: 'hi' })
    await postStatus('dialog', 'hi')
    const key = requests[0].key
    assert.match(key, /^[0-9a-f]{32}$/)
    assert.equal(store.getComposeData('dialog', 'idempotencyKey'), key)
    await postStatus('dialog', 'hi')
    assert.equal(requests[1].key, key)
    assert.equal(store.getComposeData('dialog', 'idempotencyKey'), undefined)
    store.setComposeData('dialog', { text: 'next' })
    await postStatus('dialog', 'next')
    assert.notEqual(requests[2].key, key)
    // postStatus (realm, text, inReplyToId, mediaIds, sensitive, spoilerText, visibility, mediaDescriptions,
    //   inReplyToUuid, poll, mediaFocalPoints, contentType, quoteId, localOnly, editId)
    await postStatus('dialog', 'edit', null, [], false, '', 'public', [], null, null, [], 'text/plain', null, false, 'edit-id')
    assert.equal(requests[3].method, 'PUT')
    assert.equal(requests[3].key, undefined)
  } finally {
    console.warn = warn
  }
})
