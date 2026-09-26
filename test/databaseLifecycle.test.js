// @mock knownInstances.js -> ./mocks/knownInstances.js
// @mock migrations.js -> ./mocks/migrations.js
// @mock lifecycle.ts -> ./mocks/lifecycle.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as idb from './mocks/fakeIndexedDB.js'
import { getDatabase, dbPromise, deleteDatabase } from '../src/routes/_database/databaseLifecycle.ts'

test('an aborted transaction rejects instead of hanging', async () => {
  const db = await getDatabase('a.social')
  const pending = dbPromise(db, 'statuses', 'readwrite', () => {})
  idb.lastTransaction.onabort()
  await assert.rejects(pending, { name: 'AbortError' })
})

test('a logged-out instance is not re-opened; others are', async () => {
  await deleteDatabase('a.social')
  await assert.rejects(getDatabase('a.social'))
  assert.equal(idb.opened.filter(name => name === 'a.social').length, 1)
  assert.ok(await getDatabase('b.social'))
})
