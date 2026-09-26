import { test } from 'node:test'
import assert from 'node:assert/strict'
import { get, post } from '../src/routes/_utils/ajax.js'
import { isNetworkNoiseError } from '../src/routes/_utils/isNetworkError.js'
import { waitForMediaProcessing } from '../src/routes/_api/media.js'

const reply = (status, body, isJson = true) => ({
  status,
  headers: new Map(),
  json: async () => {
    if (!isJson) throw new SyntaxError('not JSON')
    return body
  }
})

test('HTTP errors carry the server reason, keep the status and stay network noise', async () => {
  globalThis.fetch = async url => url.endsWith('/422')
    ? reply(422, { error: 'Validation failed: Text character limit of 500 exceeded' })
    : reply(502, null, false)
  const e1 = await post('https://x/422', {}, {}).catch(e => e)
  assert.equal(e1.status, 422)
  assert.equal(e1.message, 'Request failed: 422 · Validation failed: Text character limit of 500 exceeded')
  assert.equal(isNetworkNoiseError(e1), true)
  const e2 = await get('https://x/502', {}).catch(e => e)
  assert.equal(e2.message, 'Request failed: 502')
})

test('media processing: poll until ready, skip when ready, never throw', async () => {
  let polls = 0
  globalThis.fetch = async () => {
    polls++
    return reply(polls < 2 ? 206 : 200, { id: 'm1', url: polls < 2 ? null : 'https://x/m1.mp4' })
  }
  assert.equal((await waitForMediaProcessing('x.social', 't', { id: 'm1', url: null })).url, 'https://x/m1.mp4')
  polls = 0
  await waitForMediaProcessing('x.social', 't', { id: 'm2', url: 'https://x/m2.png' })
  assert.equal(polls, 0)
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch') }
  const warn = console.warn
  console.warn = () => {}
  try {
    assert.equal((await waitForMediaProcessing('x.social', 't', { id: 'm3', url: null })).id, 'm3')
  } finally {
    console.warn = warn
  }
})
