import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getDisplayableQuote, getQuotedStatusUrl, isQuoteWithheld, isQuoteOfHiddenAccount } from '../src/routes/_utils/quotes.js'

const quoted = { id: '9', url: 'https://m/@a/9', account: { acct: 'a' } }
const wrapper = (state, quotedStatus = quoted) => ({ quote: { state, quoted_status: quotedStatus } })

test('only an accepted Mastodon quote (or an Akkoma quote) is displayable', () => {
  assert.equal(getDisplayableQuote(wrapper('accepted')), quoted)
  assert.equal(getDisplayableQuote({ quote: quoted }), quoted)
  for (const state of ['pending', 'rejected', 'revoked', 'deleted', 'unauthorized', 'muted_account']) {
    assert.equal(getDisplayableQuote(wrapper(state)), null, state)
  }
  assert.equal(getDisplayableQuote(wrapper('accepted', null)), null)
  assert.equal(getDisplayableQuote({ quote: { state: 'accepted', quoted_status_id: '1' } }), null) // ShallowQuote
})

test('withheld quotes (not accepted) never become preview cards', () => {
  for (const state of ['pending', 'rejected', 'revoked', 'deleted', 'muted_account', 'blocked_domain']) {
    assert.equal(isQuoteWithheld(wrapper(state)), true, state)
  }
  assert.equal(isQuoteWithheld(wrapper('accepted')), false)
  assert.equal(isQuoteWithheld({ quote: quoted }), false)
  assert.equal(isQuoteWithheld({}), false)
})

test('muted/blocked quoted authors are detected', () => {
  assert.equal(isQuoteOfHiddenAccount(wrapper('muted_account')), true)
  assert.equal(isQuoteOfHiddenAccount(wrapper('rejected')), false)
})

test('the quoted URL for delete-and-redraft', () => {
  assert.equal(getQuotedStatusUrl(wrapper('accepted')), 'https://m/@a/9')
  assert.equal(getQuotedStatusUrl({ quote: { uri: 'https://ak/o/1', account: { acct: 'b' } } }), 'https://ak/o/1')
  assert.equal(getQuotedStatusUrl(wrapper('deleted', null)), undefined)
  assert.equal(getQuotedStatusUrl({}), undefined)
})
