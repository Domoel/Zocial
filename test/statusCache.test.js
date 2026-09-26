// @mock databaseLifecycle.ts -> ./mocks/mapDatabase.js
// @mock insertion.ts -> ./mocks/insertion.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { stores, setReadDelay } from './mocks/mapDatabase.js'
import { getStatus } from '../src/routes/_database/timelines/getStatusOrNotification.js'
import { setStatusFavorited, setStatusBookmarked, setStatusPinned, updateStatus } from '../src/routes/_database/timelines/updateStatus.js'
import { cacheStatus } from '../src/routes/_database/timelines/cacheStatus.js'
import { getAccount } from '../src/routes/_database/accounts.js'
import { hasInCache, getInCache, setInCache, statusesCache, accountsCache } from '../src/routes/_database/cache.js'

const I = 'zocial.social'

test('a miss is not cached, and an edit of that post is stored (v1.12.2)', async () => {
  assert.equal(await getStatus(I, 'parent1'), undefined)
  assert.equal(hasInCache(statusesCache, I, 'parent1'), false)
  await updateStatus(I, { id: 'parent1', content: 'edited', account: { id: 'a1' } })
  assert.equal(stores.statuses.get('parent1').content, 'edited')
})

test('a read in flight does not overwrite a fresher entry from an insert', async () => {
  setReadDelay(20)
  const pending = getStatus(I, 'fresh1')
  const fresh = { id: 'fresh1', content: 'net', favourited: false, account: { id: 'a2' } }
  cacheStatus(fresh, I)
  await pending
  setReadDelay(0)
  stores.statuses.set('fresh1', fresh)
  assert.equal(getInCache(statusesCache, I, 'fresh1').content, 'net')
  await setStatusFavorited(I, 'fresh1', true)
  assert.equal(getInCache(statusesCache, I, 'fresh1').favourited, true)
})

test('an undefined cache entry does not crash updateStatus', async () => {
  setInCache(statusesCache, I, 'legacy1', undefined)
  await updateStatus(I, { id: 'legacy1', content: 'e' })
  assert.equal(stores.statuses.get('legacy1').content, 'e')
})

test('flag setters skip a status that is not stored (search results)', async () => {
  await setStatusFavorited(I, 'search-1', true)
  await setStatusBookmarked(I, 'search-1', true)
  await setStatusPinned(I, 'search-1', true)
  assert.equal(stores.statuses.has('search-1'), false)
  stores.statuses.set('s2', { id: 's2', favourited: false, favourites_count: 1 })
  await setStatusFavorited(I, 's2', true)
  assert.equal(stores.statuses.get('s2').favourites_count, 2)
})

test('the account cache holds found records only (v1.12.3)', async () => {
  assert.equal(await getAccount(I, 'nobody'), undefined)
  assert.equal(hasInCache(accountsCache, I, 'nobody'), false)
  setReadDelay(20)
  const pending = getAccount(I, 'bob')
  cacheStatus({ id: 's1', account: { id: 'bob', acct: 'bob' } }, I)
  await pending
  setReadDelay(0)
  assert.equal(getInCache(accountsCache, I, 'bob').acct, 'bob')
})
