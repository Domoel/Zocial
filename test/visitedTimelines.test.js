import { test } from 'node:test'
import assert from 'node:assert/strict'
import { recordVisitedTimeline, MAX_KEPT_TIMELINES } from '../src/routes/_store/observers/visitedTimelineObservers.js'

function fakeStore () {
  const cleared = []
  const state = { pinnedStatuses: { i: { 7: ['p'], 8: ['q'] } } }
  return {
    cleared,
    get: () => state,
    set (obj) { Object.assign(state, obj) },
    clearTimelineData (instanceName, names) { cleared.push(...names) }
  }
}

test('only the most recently visited timelines keep their data', () => {
  const store = fakeStore()
  recordVisitedTimeline(store, 'i', 'account/7')
  recordVisitedTimeline(store, 'i', 'home') // always kept, never counted
  for (let n = 0; n < MAX_KEPT_TIMELINES; n++) {
    recordVisitedTimeline(store, 'i', 'status/' + n)
  }
  assert.deepEqual(store.cleared, ['account/7'])
  assert.equal(store.get().pinnedStatuses.i[7], undefined) // that profile's pinned posts went too
  assert.deepEqual(store.get().pinnedStatuses.i[8], ['q'])
})

test('revisiting moves a timeline to the front', () => {
  const store = fakeStore()
  recordVisitedTimeline(store, 'j', 'list/1')
  for (let n = 0; n < MAX_KEPT_TIMELINES - 1; n++) {
    recordVisitedTimeline(store, 'j', 'tag/' + n)
  }
  recordVisitedTimeline(store, 'j', 'list/1') // revisit
  recordVisitedTimeline(store, 'j', 'tag/new')
  assert.deepEqual(store.cleared, ['tag/0'])
})
