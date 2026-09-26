// @mock _store/store.js -> ./mocks/timelineStore.js
// @mock _database/database.js -> ./mocks/timelineDatabase.js
// @mock rehydrateStatusOrNotification.js -> ./mocks/rehydrate.js
// @mock ./statuses.js -> ./mocks/statuses.js
// @mock _api/timelines.js -> ./mocks/timelinesApi.js
// @mock scheduleIdleTask.js -> ./mocks/scheduleIdleTask.js
// @mock marks.js -> ./mocks/marks.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { data, threads } from './mocks/timelineStore.js'
import { db } from './mocks/timelineDatabase.js'
import { setPages } from './mocks/timelinesApi.js'
import { createMakeProps } from '../src/routes/_actions/createMakeProps.js'
import { addStatusesOrNotifications, refreshServerDerivedFlags } from '../src/routes/_actions/addStatusOrNotification.js'
import { fillStreamingGap } from '../src/routes/_actions/stream/fillStreamingGap.js'

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
const ids = list => (list || []).map(s => s.id).join()
const quiet = async fn => {
  const warn = console.warn
  console.warn = () => {}
  try {
    return await fn()
  } finally {
    console.warn = warn
  }
}

test('items whose body or author is gone are dropped instead of rendered', () => quiet(async () => {
  data.timelineItemSummaries.home = [{ id: 'gone' }, { id: 'noauthor' }, { id: 'fine' }]
  db.statuses.noauthor = { id: 'noauthor' }
  db.statuses.fine = { id: 'fine', account: { id: 'a' } }
  const makeProps = createMakeProps('i', 'home', undefined)
  const [gone, noAuthor, fine] = await Promise.all([makeProps({ id: 'gone' }), makeProps({ id: 'noauthor' }), makeProps({ id: 'fine' })])
  assert.equal(gone, null)
  assert.equal(noAuthor, null)
  assert.equal(fine.status.id, 'fine')
  assert.equal(ids(data.timelineItemSummaries.home), 'fine')
}))

test('a missing notification is removed from All and Mentions', () => quiet(async () => {
  data.timelineItemSummaries.notifications = [{ id: 'n1' }, { id: 'n2' }]
  data.timelineItemSummaries['notifications/mentions'] = [{ id: 'n1' }]
  const makeProps = createMakeProps('i', 'notifications', undefined)
  assert.equal(await makeProps({ id: 'n1' }), null)
  assert.equal(ids(data.timelineItemSummaries.notifications), 'n2')
  assert.equal(data.timelineItemSummaries['notifications/mentions'].length, 0)
}))

test('a thread without its status collects no streamed replies', async () => {
  threads['status/404'] = []
  threads['status/f'] = [{ id: 'f' }]
  addStatusesOrNotifications('i', 'home', [
    { id: 'r1', in_reply_to_id: 'elsewhere', account: { id: 'x' } },
    { id: 'r2', in_reply_to_id: 'f', account: { id: 'x' } }
  ])
  await wait(20)
  assert.equal(ids(data.timelineItemSummariesToAdd['status/404']), '')
  assert.equal(ids(data.timelineItemSummariesToAdd['status/f']), 'r2')
})

test('a failed IndexedDB write does not swallow new posts', () => quiet(async () => {
  db.failInsert = true
  addStatusesOrNotifications('i', 'local', [{ id: 'p1', account: { id: 'x' } }])
  await wait(20)
  db.failInsert = false
  assert.equal(ids(data.timelineItemSummariesToAdd.local), 'p1')
}))

test('the gap fill after a reconnect also reaches the Mentions tab', async () => {
  setPages([[{ id: 'g2', type: 'mention', account: { id: 'x' } }, { id: 'g1', type: 'favourite', account: { id: 'y' } }]])
  await fillStreamingGap('i', 't', 'notifications', 'g0')
  await wait(20)
  assert.equal(ids(data.timelineItemSummariesToAdd['notifications/mentions']), 'g2')
})

test('server-derived flags are refreshed, thread fields kept', () => {
  const old = [{ id: '1', quoteHidden: undefined, filterContexts: [], depth: 2 }, { id: '2', quoteHidden: true, filterContexts: [] }]
  const fresh = [{ id: '1', quoteHidden: true, filterContexts: ['home'] }, { id: '2', quoteHidden: true, filterContexts: [] }]
  const merged = refreshServerDerivedFlags(old, fresh)
  assert.equal(merged[0].quoteHidden, true)
  assert.deepEqual(merged[0].filterContexts, ['home'])
  assert.equal(merged[0].depth, 2)
  assert.equal(merged[1], old[1])
})
