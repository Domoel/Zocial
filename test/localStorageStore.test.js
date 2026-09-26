// @mock safeLocalStorage.js -> ./mocks/localStorage.js
// @mock lifecycle.ts -> ./mocks/lifecycle.js
// @define ZOCIAL_IS_BROWSER=true
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dispatch } from './mocks/window.js'
import { written, setStorageFull } from './mocks/localStorage.js'
import { LocalStorageStore } from '../src/routes/_store/LocalStorageStore.js'
import { composeMixins } from '../src/routes/_store/mixins/composeMixins.js'

class TestStore extends LocalStorageStore {}
composeMixins(TestStore)

const quietly = fn => {
  const warn = console.warn
  console.warn = () => {}
  try {
    return fn()
  } finally {
    console.warn = warn
  }
}

test('a full localStorage neither throws nor blocks the other keys, and the key is retried', () => {
  const store = new TestStore({ big: 1, small: 1 }, new Set(['big', 'small']))
  store.set({ big: 2, small: 2 })
  assert.doesNotThrow(() => quietly(() => store.save()))
  assert.equal(written.store_small, '2')
  setStorageFull(false)
  store.save()
  assert.equal(written.store_big, '2')
})

test("another tab's write is taken over and not written back; the current account stays per tab", () => {
  const store = new TestStore({ loggedInInstances: { a: {}, b: {} }, currentInstance: 'a' }, new Set(['loggedInInstances', 'currentInstance']))
  const events = []
  store.on('externalChange', e => events.push(e))
  delete written.store_loggedInInstances
  dispatch('storage', { key: 'store_loggedInInstances', newValue: JSON.stringify({ b: {} }) })
  dispatch('storage', { key: 'store_currentInstance', newValue: '"b"' })
  assert.deepEqual(store.get().loggedInInstances, { b: {} })
  assert.equal(store.get().currentInstance, 'a')
  assert.deepEqual(Object.keys(events[0].previous), ['a', 'b'])
  store.save()
  assert.equal(written.store_loggedInInstances, undefined) // nothing stale written back
})

test('drafts: a draft posted in another tab goes, unsaved typing here stays', () => {
  const store = new TestStore({ currentInstance: 'i', composeData: { i: { home: { text: 'old draft', ts: 1 } } } }, new Set(['composeData']))
  store._syncedAt.composeData = Date.now() - 1000 // as if loaded from storage a second ago
  store.setComposeData('reply-1', { text: 'typing here' }) // not saved yet
  // the other tab posted "home" (removed it) and has a draft of its own
  dispatch('storage', { key: 'store_composeData', newValue: JSON.stringify({ i: { dialog: { text: 'theirs', ts: 5 } } }) })
  const drafts = store.get().composeData.i
  assert.equal(drafts.home, undefined)
  assert.equal(drafts.dialog.text, 'theirs')
  assert.equal(drafts['reply-1'].text, 'typing here')
  store.save()
  assert.match(written.store_composeData, /typing here/) // our addition is still saved
})
