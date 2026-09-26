import { test } from 'node:test'
import assert from 'node:assert/strict'
import { serialize } from 'parse5'
import { renderPostHTMLToDOM } from '../src/routes/_utils/renderPostHTML.ts'
import { computeHashtagBarForStatus, localeAwareInclude, normalizeHashtag } from '../src/routes/_workers/processContent/hashtagBar.ts'

const tagLink = name => `<a href="https://m.s/tags/${name.toLowerCase()}" class="mention hashtag" rel="tag">#<span>${name}</span></a>`

// the same two steps the processContent worker runs
function process (content, tags) {
  const status = { content, tags: tags.map(name => ({ name })) }
  const dom = renderPostHTMLToDOM({
    content,
    tags: status.tags,
    autoplayGifs: false,
    emojis: new Map(),
    mentionsByURL: new Map(),
    mentionsByAcct: new Map(),
    hasQuote: false
  })
  const { dom: result, hashtagsInBar } = computeHashtagBarForStatus(dom, status)
  return { html: serialize(result), bar: hashtagsInBar.map(tag => tag.value) }
}

test('normalizeHashtag and localeAwareInclude', () => {
  assert.equal(normalizeHashtag('#Bees'), 'Bees')
  assert.equal(normalizeHashtag('#'), '')
  assert.equal(normalizeHashtag('ｆｕｌｌ'), 'full') // NFKC
  assert.ok(localeAwareInclude(['Café'], 'cafe'))
  assert.ok(localeAwareInclude(['BEES'], 'bees'))
  assert.ok(!localeAwareInclude(['bees'], 'bee'))
})

test('a trailing hashtag paragraph moves into the bar', () => {
  const { html, bar } = process(`<p>Look at them</p><p>${tagLink('bees')} ${tagLink('Cats')}</p>`, ['bees', 'cats'])
  assert.equal(html, '<p>Look at them</p>')
  assert.deepEqual(bar.sort(), ['Cats', 'bees'])
})

test('hashtags inside the text stay where they are', () => {
  const { html, bar } = process(`<p>I like ${tagLink('bees')} a lot</p>`, ['bees'])
  assert.match(html, /data-tag="bees"/)
  assert.match(html, /a lot/)
  assert.deepEqual(bar, [])
})

test('a last line mixing text and hashtags is left alone', () => {
  const { html, bar } = process(`<p>Hello</p><p>so many ${tagLink('bees')}</p>`, ['bees'])
  assert.match(html, /so many/)
  assert.match(html, /data-tag="bees"/)
  assert.deepEqual(bar, [])
})

test('tags only in the metadata show up in the bar, once and case-insensitively', () => {
  const { html, bar } = process(`<p>Hello</p><p>${tagLink('Bees')}</p>`, ['bees', 'hidden'])
  assert.equal(html, '<p>Hello</p>')
  assert.deepEqual(bar.sort(), ['Bees', 'hidden'])
})

test('a hashtag-looking link that is not one of the status tags is not moved', () => {
  const { html, bar } = process(`<p>Hello</p><p>${tagLink('fake')}</p>`, ['bees'])
  assert.match(html, /fake/)
  assert.deepEqual(bar, ['bees'])
})

test('Akkoma: hashtags after a line break', () => {
  const { html, bar } = process(`<p>Hello<br>${tagLink('bees')}</p>`, ['bees'])
  assert.equal(html, '<p>Hello</p>')
  assert.deepEqual(bar, ['bees'])
})

test('a status without tags is untouched', () => {
  const content = '<p>Hello <a href="https://example.com/">link</a></p>'
  const { html, bar } = process(content, [])
  assert.match(html, /Hello/)
  assert.deepEqual(bar, [])
})
