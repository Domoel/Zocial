import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderPostHTML } from '../src/routes/_utils/renderPostHTML.ts'

const NO_EMOJI = new Map()
const BEE = new Map([['bee', { shortcode: 'bee', url: 'https://x/bee.png', static_url: 'https://x/bee.png' }]])
const render = (content, emojis = NO_EMOJI, extra = {}) => renderPostHTML({
  content,
  tags: [{ name: 'bees' }],
  autoplayGifs: false,
  emojis,
  mentionsByURL: new Map(),
  mentionsByAcct: new Map(),
  hasQuote: false,
  ...extra
})

test('"::" survives without custom emoji (v1.12.4)', () => {
  const html = render('<p>use std::vector, fe80::1</p>')
  assert.match(html, /std::vector/)
  assert.match(html, /fe80::1/)
})

test('"::" survives next to a custom emoji', () => {
  const html = render('<p>a::b :bee:</p>', BEE)
  assert.match(html, /a::b/)
  assert.match(html, /inline-custom-emoji/)
})

test('script-capable URLs are removed, also when obfuscated', () => {
  assert.doesNotMatch(render('<p><a href="javascript:alert(1)">x</a></p>'), /javascript/i)
  assert.doesNotMatch(render('<p><a href="java&#9;script:alert(1)">x</a></p>'), /script:/i)
})

test('event handler attributes are removed, the element stays', () => {
  const html = render('<p><img src="https://x/a.png" onerror="alert(1)"></p>')
  assert.doesNotMatch(html, /onerror/)
  assert.match(html, /https:\/\/x\/a\.png/)
})

test('active and embedding elements are dropped', () => {
  const html = render('<p>ok</p><script>alert(1)</script><iframe src="https://e"></iframe><form><button>b</button></form>')
  assert.equal(html, '<p>ok</p>')
})

test('normal links, hashtags and data: images still work', () => {
  assert.match(render('<p><a href="https://example.com/x">x</a></p>'), /href="https:\/\/example\.com\/x".*target="_blank"/)
  assert.match(render('<p><a href="https://m.s/tags/bees" class="mention hashtag" rel="tag">#<span>bees</span></a></p>'), /href="\/tags\/bees"/)
  assert.match(render('<p><img src="data:image/png;base64,AAAA"></p>'), /data:image\/png/)
})

test('a second emoji is not wrapped twice', () => {
  const html = render('<p>😀 hi 😀</p>')
  assert.equal((html.match(/inline-emoji/g) || []).length, 2)
  assert.doesNotMatch(html, /<span class="inline-emoji"><span/)
})

test('adjacent quote fallback lines are both stripped when the quote renders', () => {
  const html = render('<p class="quote-inline">RE: a</p><p class="quote-inline">RE: b</p><p>body</p>', NO_EMOJI, { hasQuote: true })
  assert.equal(html, '<p>body</p>')
})
