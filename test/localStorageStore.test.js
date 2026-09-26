// @mock safeLocalStorage.js -> ./mocks/localStorage.js
// @mock lifecycle.ts -> ./mocks/lifecycle.js
// @define ZOCIAL_IS_BROWSER=true
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { written, setStorageFull } from './mocks/localStorage.js'
import { LocalStorageStore } from '../src/routes/_store/LocalStorageStore.js'

test('a full localStorage neither throws nor blocks the other keys, and the key is retried', () => {
  const store = new LocalStorageStore({ big: 1, small: 1 }, new Set(['big', 'small']))
  store.set({ big: 2, small: 2 })
  const warn = console.warn
  console.warn = () => {}
  try {
    assert.doesNotThrow(() => store.save())
  } finally {
    console.warn = warn
  }
  assert.equal(written.store_small, '2')
  setStorageFull(false)
  store.save()
  assert.equal(written.store_big, '2')
})
