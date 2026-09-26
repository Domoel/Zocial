// @mock _api/search.js -> ./mocks/search.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import './mocks/browserGlobals.js'
import { calls, setSearchMode } from './mocks/search.js'
import { resolveCardForUrl } from '../src/routes/_utils/resolveCardForUrl.js'

test('concurrent lookups of the same link share one request', async () => {
  const [a, b] = await Promise.all([
    resolveCardForUrl('https://s/@x/1', 'i1', 't'),
    resolveCardForUrl('https://s/@x/1', 'i1', 't')
  ])
  assert.equal(calls.length, 1)
  assert.equal(a, b)
  assert.equal(a.url, '/statuses/i1-1')
})

test('cards are cached per instance (the ids in them are instance-local)', async () => {
  const card = await resolveCardForUrl('https://s/@x/1', 'i2', 't')
  assert.equal(calls.length, 2)
  assert.equal(card.url, '/statuses/i2-1')
})

test('a failed lookup is retried, "nothing found" is cached', async () => {
  setSearchMode('throw')
  const fallback = await resolveCardForUrl('https://s/@x/2', 'i1', 't')
  await resolveCardForUrl('https://s/@x/2', 'i1', 't')
  assert.equal(calls.length, 4)
  assert.equal(fallback.title, 's')
  setSearchMode('empty')
  await resolveCardForUrl('https://news/a', 'i1', 't')
  await resolveCardForUrl('https://news/a', 'i1', 't')
  assert.equal(calls.length, 5)
})
