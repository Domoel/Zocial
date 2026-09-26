// @mock marks.js -> ./mocks/marks.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { compareTimelineItemSummaries, toReversePaddedBigInt } from '../src/routes/_utils/statusIdSorting.js'
import { mergeArrays, concat } from '../src/routes/_utils/arrays.js'
import { uniqById } from '../src/routes/_utils/lodash-lite.js'
import { sortItemSummariesForThread, sortItemSummariesForNotificationBatch } from '../src/routes/_utils/sortItemSummaries.ts'
import { markThreadBundles } from '../src/routes/_utils/groupThreadsInTimeline.js'

const byId = ids => ids.map(id => ({ id }))
const sorted = ids => byId(ids).sort(compareTimelineItemSummaries).map(s => s.id)

test('ids sort chronologically for every server format', () => {
  // Mastodon: numeric strings of different lengths (older ids are shorter)
  assert.deepEqual(sorted(['100', '99', '9', '1000']), ['9', '99', '100', '1000'])
  assert.deepEqual(sorted(['113456789012345678', '99999999999999999']), ['99999999999999999', '113456789012345678'])
  // Pleroma/Akkoma flake ids (base62, fixed length)
  assert.deepEqual(sorted(['AbC0000000000000z1', 'AbC000000000000000', 'ABC0000000000000z1']), ['ABC0000000000000z1', 'AbC000000000000000', 'AbC0000000000000z1'])
  // GoToSocial ULIDs (Crockford base32, fixed length, time first)
  assert.deepEqual(sorted(['01J8Z0000000000000000000ZZ', '01H0000000000000000000000A']), ['01H0000000000000000000000A', '01J8Z0000000000000000000ZZ'])
})

test('the reversed key sorts newest first (IndexedDB key order)', () => {
  const ids = ['9', '99', '100', '1000', 'AbC000000000000000']
  const byReversedKey = [...ids].sort((a, b) => toReversePaddedBigInt(a) < toReversePaddedBigInt(b) ? -1 : 1)
  assert.deepEqual(byReversedKey, [...sorted(ids)].reverse())
})

test('merging two newest-first lists keeps the order and each id once', () => {
  const left = byId(['9', '7', '5'])
  const right = byId(['8', '7', '4'])
  const merged = mergeArrays(left, right, compareTimelineItemSummaries)
  assert.deepEqual(merged.map(s => s.id), ['9', '8', '7', '5', '4'])
  assert.equal(merged[2], left[1]) // on a tie the existing (left) object is kept
})

test('uniqById keeps the first of each id and drops entries without one', () => {
  const a = { id: '1', n: 1 }
  assert.deepEqual(uniqById([a, { id: '1', n: 2 }, null, {}, { id: '2' }]).map(s => s.id), ['1', '2'])
  assert.equal(uniqById([a, { id: '1' }])[0], a)
  assert.deepEqual(concat([1, 2], 3, [4]), [1, 2, 3, 4])
})

test('a thread is ordered ancestors → focused post → replies depth-first, oldest reply first', () => {
  const thread = [
    { id: '1' }, // root
    { id: '2', replyId: '1' },
    { id: '3', replyId: '2' }, // focused
    { id: '6', replyId: '3' },
    { id: '4', replyId: '3' },
    { id: '5', replyId: '4' }
  ]
  const result = sortItemSummariesForThread(thread, '3')
  assert.deepEqual(result.map(s => s.id), ['1', '2', '3', '4', '5', '6'])
  assert.deepEqual(result.map(s => s.depth), [0, 1, 0, 1, 2, 1])
  assert.equal(result[2].start, true)
  assert.equal(result[5].end, true)
  assert.ok(result.every(s => s.parent === undefined && s.replies === undefined))
})

test('a thread without its focused post is left as it is', () => {
  const warn = console.warn
  console.warn = () => {}
  try {
    const thread = [{ id: '1' }, { id: '2', replyId: '1' }]
    assert.equal(sortItemSummariesForThread(thread, 'missing'), thread)
  } finally {
    console.warn = warn
  }
})

test('notifications about the same post are grouped; mentions stay single', () => {
  const batch = [
    { id: 'n1', type: 'favourite', statusId: 's1' },
    { id: 'n2', type: 'mention', statusId: 's2' },
    { id: 'n3', type: 'reblog', statusId: 's1' }
  ]
  const result = sortItemSummariesForNotificationBatch(batch)
  assert.deepEqual(result.map(s => s.id), ['n1', 'n3', 'n2'])
  assert.equal(result[0].group, result[1].group)
  assert.notEqual(result[2].group, result[0].group)
})

test('self-threads are bundled oldest-on-top; other authors and boosts break the chain', () => {
  const summaries = [
    { id: 'd', replyId: 'c', accountId: 'me' },
    { id: 'c', replyId: 'b', accountId: 'me' },
    { id: 'b', accountId: 'me' },
    { id: 'x', replyId: 'y', accountId: 'other' },
    { id: 'y', accountId: 'someone else' }
  ]
  const result = markThreadBundles(summaries)
  assert.deepEqual(result.slice(0, 3).map(s => [s.id, s.threadPosition, s.threadIndex]), [['b', 'top', 1], ['c', 'middle', 2], ['d', 'bottom', 3]])
  assert.equal(result[3].threadPosition, undefined)
  assert.equal(markThreadBundles(summaries, result)[0], result[0]) // unchanged items keep their object
  const noChain = [{ id: '2', replyId: '1', accountId: 'a' }, { id: '1', accountId: 'b' }]
  assert.equal(markThreadBundles(noChain), noChain)
})
