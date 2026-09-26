// The database layer against a real IndexedDB implementation (fake-indexeddb): schema and
// migrations, insertion and paging, threads, deletion, cleanup and logout.
// @mock knownInstances.js -> ./mocks/knownInstances.js
// @mock lifecycle.ts -> ./mocks/lifecycle.js
// @mock rehydrateStatusOrNotification.js -> ./mocks/rehydrate.js
// @mock marks.js -> ./mocks/marks.js
// @mock lodash/timers.js -> ./mocks/timers.js
import 'fake-indexeddb/auto'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getDatabase, dbPromise, deleteDatabase } from '../src/routes/_database/databaseLifecycle.ts'
import { migrations } from '../src/routes/_database/migrations.js'
import {
  ACCOUNTS_STORE, CURRENT_TIME, DB_VERSION_CURRENT, DB_VERSION_INITIAL, NOTIFICATIONS_STORE,
  STATUS_TIMELINES_STORE, STATUSES_STORE, USERNAME_LOWERCASE
} from '../src/routes/_database/constants.js'
import { createTimelineId } from '../src/routes/_database/keys.js'
import { insertTimelineItems, insertStatus } from '../src/routes/_database/timelines/insertion.ts'
import { getTimeline } from '../src/routes/_database/timelines/pagination.js'
import { deleteStatusesAndNotifications, deleteTimelineItemsForAccount } from '../src/routes/_database/timelines/deletion.js'
import { getStatus } from '../src/routes/_database/timelines/getStatusOrNotification.js'
import { cleanup } from '../src/routes/_database/cleanup.js'
import { clearAllCaches, hasInCache, statusesCache } from '../src/routes/_database/cache.js'
import { CLEANUP_TIME_AGO } from '../src/routes/_static/database.js'

const account = n => ({ id: 'a' + n, acct: 'user' + n, username: 'user' + n, url: 'https://a.social/@user' + n })
const status = (id, n = 1, extra = {}) => ({ id, content: `<p>${id}</p>`, account: account(n), ...extra })
const ids = items => items.map(item => item.id)

async function allKeys (instanceName, storeName) {
  const db = await getDatabase(instanceName)
  return dbPromise(db, storeName, 'readonly', (store, callback) => {
    store.getAllKeys().onsuccess = e => callback(e.target.result)
  })
}

function accountIndexes (db) {
  return dbPromise(db, ACCOUNTS_STORE, 'readonly', (store, callback) => {
    const names = Array.from(store.indexNames)
    callback(names)
  })
}

async function quietly (fn) {
  const warn = console.warn
  console.warn = () => {}
  try {
    return await fn()
  } finally {
    console.warn = warn
  }
}

test('a fresh database has every store and index at the current version', async () => {
  const db = await getDatabase('fresh.social')
  assert.equal(db.version, DB_VERSION_CURRENT.version)
  assert.equal(db.objectStoreNames.length, 9)
  assert.ok((await accountIndexes(db)).includes(USERNAME_LOWERCASE))
  const [a, b] = await Promise.all([getDatabase('fresh.social'), getDatabase('fresh.social')])
  assert.equal(a, db) // concurrent callers share one connection
  assert.equal(b, db)
})

test('a v9 database is migrated: username index and snowflake timeline keys', async () => {
  const name = 'old.social'
  const old = await new Promise((resolve, reject) => {
    const req = indexedDB.open(name, DB_VERSION_INITIAL)
    req.onupgradeneeded = () => migrations[0].migration(req.result, req.transaction, () => {})
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  await dbPromise(old, [STATUS_TIMELINES_STORE, STATUSES_STORE], 'readwrite', ([timelines, statuses]) => {
    for (const id of ['9', '10', '100']) {
      statuses.put({ id })
      timelines.put(id, 'home\u0000old-' + id) // the old key format sorts 10, 100, 9
    }
  })
  old.close()

  const db = await getDatabase(name)
  assert.equal(db.version, DB_VERSION_CURRENT.version)
  assert.ok((await accountIndexes(db)).includes(USERNAME_LOWERCASE))
  assert.deepEqual((await allKeys(name, STATUS_TIMELINES_STORE)).sort(), ['9', '10', '100'].map(id => createTimelineId('home', id)).sort())
  assert.deepEqual(ids(await getTimeline(name, 'home')), ['100', '10', '9'])
})

test('timelines page newest first across ID lengths, with accounts and boosts joined', async () => {
  const I = 'page.social'
  await insertTimelineItems(I, 'home', [
    status('98'), status('99'), status('100', 2), status('101'),
    status('1000', 2, { reblog: status('50', 3) })
  ])
  clearAllCaches(I) // read back from IndexedDB, not from the memory cache
  const first = await getTimeline(I, 'home', null, 2)
  assert.deepEqual(ids(first), ['1000', '101'])
  assert.equal(first[0].account.acct, 'user2')
  assert.equal(first[0].reblog.id, '50')
  assert.equal(first[0].reblog.account.acct, 'user3')
  assert.deepEqual(ids(await getTimeline(I, 'home', '101', 2)), ['100', '99'])
  assert.deepEqual(ids(await getTimeline(I, 'home', '99', 2)), ['98'])
  assert.deepEqual(await getTimeline(I, 'local'), [])
})

test('notifications come back with their account and status', async () => {
  const I = 'notif.social'
  await insertTimelineItems(I, 'notifications', [
    { id: '11', type: 'favourite', account: account(4), status: status('60') },
    { id: '12', type: 'follow', account: account(5) }
  ])
  clearAllCaches(I)
  const [follow, favourite] = await getTimeline(I, 'notifications')
  assert.equal(follow.id, '12')
  assert.equal(follow.account.acct, 'user5')
  assert.equal(favourite.status.id, '60')
  assert.equal(favourite.status.account.acct, 'user1')
})

test('a thread stored again drops replies that are gone; an unknown thread is just the status', async () => {
  const I = 'thread.social'
  await insertTimelineItems(I, 'status/5', [status('3'), status('5'), status('7')])
  assert.deepEqual(ids(await getTimeline(I, 'status/5')), ['3', '5', '7'])
  await insertTimelineItems(I, 'status/5', [status('5'), status('7')])
  assert.deepEqual(ids(await getTimeline(I, 'status/5')), ['5', '7'])
  assert.deepEqual(ids(await getTimeline(I, 'status/3')), ['3'])
})

test('a timeline pointer whose status body is gone leaves no hole', async () => {
  const I = 'hole.social'
  await insertTimelineItems(I, 'local', [status('200'), status('201')])
  const db = await getDatabase(I)
  await dbPromise(db, STATUSES_STORE, 'readwrite', store => store.delete('201'))
  clearAllCaches(I)
  assert.equal((await allKeys(I, STATUS_TIMELINES_STORE)).length, 2)
  assert.deepEqual(ids(await getTimeline(I, 'local')), ['200'])
})

test('deleting a status removes it from timelines, threads and notifications', async () => {
  const I = 'delete.social'
  await insertTimelineItems(I, 'home', [status('1'), status('2')])
  await insertTimelineItems(I, 'status/1', [status('1'), status('2')])
  await insertTimelineItems(I, 'notifications', [{ id: '9', type: 'mention', account: account(2), status: status('2') }])
  await deleteStatusesAndNotifications(I, ['2'], ['9'])
  assert.deepEqual(ids(await getTimeline(I, 'home')), ['1'])
  assert.deepEqual(ids(await getTimeline(I, 'status/1')), ['1'])
  assert.deepEqual(await getTimeline(I, 'notifications'), [])
  assert.equal(await getStatus(I, '2'), undefined)
  assert.deepEqual(await allKeys(I, NOTIFICATIONS_STORE), [])
})

test('unfollow removes the account from home and lists only', async () => {
  const I = 'unfollow.social'
  for (const timeline of ['home', 'list/7', 'local']) {
    await insertTimelineItems(I, timeline, [status('1', 2), status('2', 3)])
  }
  await deleteTimelineItemsForAccount(I, 'a2', { homeAndListsOnly: true })
  assert.deepEqual(ids(await getTimeline(I, 'home')), ['2'])
  assert.deepEqual(ids(await getTimeline(I, 'list/7')), ['2'])
  assert.deepEqual(ids(await getTimeline(I, 'local')), ['2', '1'])
})

test('getStatus reads through to IndexedDB and never caches a miss', async () => {
  const I = 'lookup.social'
  await insertStatus(I, status('77', 6))
  clearAllCaches(I)
  const found = await getStatus(I, '77')
  assert.equal(found.account.acct, 'user6')
  assert.ok(hasInCache(statusesCache, I, '77'))
  assert.equal(await getStatus(I, '78'), undefined)
  assert.ok(!hasInCache(statusesCache, I, '78'))
})

test('cleanup removes what is older than the cutoff, in batches', async () => {
  const I = 'cleanup.social'
  const now = CURRENT_TIME.now
  CURRENT_TIME.now = () => Date.now() - CLEANUP_TIME_AGO - 60000
  try {
    const old = Array.from({ length: 45 }, (_, i) => status(String(1000 + i), 7))
    await insertTimelineItems(I, 'home', old)
    await insertTimelineItems(I, 'status/1000', old.slice(0, 3))
    await insertTimelineItems(I, 'notifications', [{ id: '5', type: 'favourite', account: account(7), status: old[0] }])
  } finally {
    CURRENT_TIME.now = now
  }
  await insertTimelineItems(I, 'home', [status('5000', 8)])
  await cleanup(I)
  clearAllCaches(I)
  assert.deepEqual(ids(await getTimeline(I, 'home', null, 100)), ['5000'])
  assert.deepEqual(await getTimeline(I, 'status/1000'), [])
  assert.deepEqual(await getTimeline(I, 'notifications'), [])
  assert.deepEqual(await allKeys(I, STATUSES_STORE), ['5000'])
  assert.deepEqual(await allKeys(I, ACCOUNTS_STORE), ['a8'])
})

test('logout deletes the database and it is not re-created', async () => {
  const I = 'logout.social'
  await insertStatus(I, status('1'))
  await deleteDatabase(I)
  const names = (await indexedDB.databases()).map(db => db.name)
  assert.ok(!names.includes(I))
  await assert.rejects(getDatabase(I), /logged out/)
})

test('a delete from another tab is not blocked by this tab', async () => {
  const I = 'othertab.social'
  const ours = await getDatabase(I)
  await new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(I)
    req.onsuccess = resolve
    req.onerror = reject
    req.onblocked = () => reject(new Error('blocked'))
  })
  const fresh = await getDatabase(I) // a new connection, not the closed one
  assert.notEqual(fresh, ours)
  await insertStatus(I, status('1'))
})

test('a delete blocked by a foreign connection still resolves', async () => {
  const I = 'blocked.social'
  await getDatabase(I)
  const foreign = await new Promise(resolve => {
    const req = indexedDB.open(I)
    req.onsuccess = () => resolve(req.result) // no versionchange handler: it never closes by itself
  })
  await quietly(() => deleteDatabase(I))
  foreign.close()
})
