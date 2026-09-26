// @mock _store/store.js -> ./mocks/observableStore.js
// @mock ../store.js -> ./mocks/observableStore.js
// @mock _actions/filters.js -> ./mocks/filtersAction.js
// @mock _database/database.js -> ./mocks/timelineDatabase.js
// @mock marks.js -> ./mocks/marks.js
// @define ZOCIAL_IS_BROWSER=true
import './mocks/window.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import './mocks/domParser.js'
import { store, computed, fireObserver } from './mocks/observableStore.js'
import { createRegexFromFilters } from '../src/routes/_utils/createRegexFromFilters.js'
import { computeFilterContextsForStatusOrNotification } from '../src/routes/_utils/computeFilterContextsForStatusOrNotification.js'
import { RAW_CONTENT } from '../src/routes/_utils/createSearchIndexFromStatusOrNotification.js'
import { createFilterFunction } from '../src/routes/_utils/createFilterFunction.js'
import { wordFilterComputations } from '../src/routes/_store/computations/wordFilterComputations.js'
import { wordFilterObservers } from '../src/routes/_store/observers/wordFilterObservers.js'

test('phrases: case-insensitive, whole-word when asked, special characters literal', () => {
  const regex = createRegexFromFilters([{ phrase: 'bee', whole_word: true }, { phrase: 'c++', whole_word: false }])
  assert.ok(regex.test('A BEE here'))
  assert.ok(!regex.test('beetle'))
  assert.ok(regex.test('I write C++ code'))
  assert.ok(!regex.test('c--'))
  assert.ok(createRegexFromFilters([{ phrase: 'bee', whole_word: false }]).test('beetle'))
})

test('an empty phrase never makes the filter match everything', () => {
  assert.ok(!createRegexFromFilters([{ phrase: '', whole_word: false }]).test('anything'))
  assert.ok(!createRegexFromFilters([{ phrase: 'x', whole_word: true }, { phrase: '' }]).test('other text'))
  assert.ok(!createRegexFromFilters([]).test('anything'))
})

test('filters are split into "hide" (irreversible) and "warn" per context; unknown means warn', () => {
  wordFilterComputations(store)
  const filters = {
    'i.social': [
      { phrase: 'drop', whole_word: true, irreversible: true, context: ['home'] },
      { phrase: 'warn', whole_word: true, irreversible: false, context: ['home', 'public'] },
      { phrase: 'unset', whole_word: true, context: ['notifications'] }
    ]
  }
  const hide = computed.unexpiredInstanceFilterRegexes(filters)['i.social']
  const warn = computed.unexpiredInstanceFilterWarnRegexes(filters)['i.social']
  assert.deepEqual(Object.keys(hide), ['home'])
  assert.ok(hide.home.test('drop it') && !hide.home.test('warn'))
  assert.deepEqual(Object.keys(warn).sort(), ['home', 'notifications', 'public'])
  assert.ok(warn.notifications.test('unset'))
})

test('expired filters stop applying; open-ended and future ones stay', () => {
  wordFilterObservers()
  const now = Date.now()
  store.set({ now, unexpiredInstanceFilters: {} })
  fireObserver('instanceFilters', {
    'i.social': [
      { phrase: 'old', expires_at: new Date(now - 60000).toISOString() },
      { phrase: 'later', expires_at: new Date(now + 60000).toISOString() },
      { phrase: 'forever', expires_at: null }
    ]
  })
  assert.deepEqual(store.get().unexpiredInstanceFilters['i.social'].map(f => f.phrase), ['later', 'forever'])
})

test('the search index covers content warning, poll options and media descriptions', () => {
  const contexts = { home: /secret/i, public: /nomatch/i }
  const status = { spoiler_text: '', content: '<p>hi</p>', poll: { options: [{ title: 'a secret option' }] }, media_attachments: [] }
  assert.deepEqual(computeFilterContextsForStatusOrNotification(status, contexts), ['home'])
  assert.deepEqual(computeFilterContextsForStatusOrNotification({ spoiler_text: 'Secret CW', content: '' }, contexts), ['home'])
  assert.deepEqual(computeFilterContextsForStatusOrNotification({ content: '', media_attachments: [{ description: 'SECRET photo' }] }, contexts), ['home'])
  assert.equal(computeFilterContextsForStatusOrNotification(status, {}), undefined)
})

test('warn filters match the raw text, not the processed content (v1.12.4)', () => {
  const status = { content: '<p>Look!</p>' } // processed: the trailing hashtag moved to the tag bar
  status[RAW_CONTENT] = '<p>Look!</p><p><a href="https://x/tags/bees" class="hashtag">#<span>bees</span></a></p>'
  assert.deepEqual(computeFilterContextsForStatusOrNotification(status, { home: /\bbees\b/i }), ['home'])
})

test('the filter function drops by context, quote-hidden posts only where mutes apply, and by type', () => {
  const home = createFilterFunction(true, true, true, true, true, true, true, 'home')
  assert.equal(home({ id: '1', filterContexts: ['home'] }), false)
  assert.equal(home({ id: '1', filterContexts: ['public'] }), true)
  assert.equal(home({ id: '1', quoteHidden: true }), false)
  const notifications = createFilterFunction(true, true, true, true, true, true, true, 'notifications')
  assert.equal(notifications({ id: '1', quoteHidden: true }), true)
  const noBoostsNoReplies = createFilterFunction(false, false, true, false, true, true, true, 'home')
  assert.equal(noBoostsNoReplies({ id: '1', reblogId: '2' }), false)
  assert.equal(noBoostsNoReplies({ id: '1', replyId: '2' }), false)
  assert.equal(noBoostsNoReplies({ id: '1' }), true)
  assert.equal(noBoostsNoReplies({ id: '1', type: 'favourite' }), false)
  assert.equal(noBoostsNoReplies({ id: '1', type: 'mention' }), true)
})
