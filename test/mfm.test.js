import { test } from 'node:test'
import assert from 'node:assert/strict'
import { serialize } from 'parse5'
import { renderMfm } from '../src/routes/_workers/processContent/mfm.ts'

const BOB = { id: '42', username: 'bob', acct: 'bob@x.y', url: 'https://x.y/@bob' }
const BEE = { shortcode: 'bee', url: 'https://x/bee.gif', static_url: 'https://x/bee.png' }

function render (mfmContent, { htmlContent = '', autoplayGifs = false } = {}) {
  return serialize(renderMfm({
    mfmContent,
    htmlContent,
    autoplayGifs,
    emojis: new Map([['bee', BEE]]),
    mentionsByURL: new Map([[BOB.url, BOB]]),
    mentionsByAcct: new Map([[BOB.acct, BOB]]),
    mentionsByLowerAcct: new Map([[BOB.acct, BOB]])
  }))
}

test('markup in the source is text, not HTML', () => {
  const html = render('<script>alert(1)</script> <img src=x onerror=alert(1)>')
  assert.doesNotMatch(html, /<script|<img/)
  assert.match(html, /&lt;script&gt;/)
})

test('only http(s) URLs become links, with safe rel/target', () => {
  assert.doesNotMatch(render('[click](javascript:alert(1))'), /<a/)
  const html = render('?[label](https://ok.example/)')
  assert.match(html, /<a [^>]*href="https:\/\/ok\.example\/"/)
  assert.match(html, /rel="nofollow noopener ugc"/)
  assert.match(html, /target="_blank"/)
})

test('fn arguments that end up in CSS are validated', () => {
  assert.match(render('$[fg.color=red x]'), /color: #f00;/) // not hex → default
  assert.match(render('$[fg.color=0af x]'), /color: #0af;/)
  assert.match(render('$[border.style=evil,width=3 x]'), /border: 3px solid /)
  assert.match(render('$[scale.x=100 x]'), /scale\(5, 1\)/) // capped
  assert.match(render('$[rotate.deg=abc x]'), /rotate\(90deg\)/)
  assert.match(render('$[tada.speed=fast x]', { autoplayGifs: true }), /global-tada 1s /)
})

test('animations only when autoplay is on', () => {
  assert.doesNotMatch(render('$[tada x]'), /animation/)
  assert.match(render('$[tada x]', { autoplayGifs: true }), /animation: global-tada/)
})

test('unknown functions are shown as their source', () => {
  assert.equal(render('$[unknown hi]'), '<span>$[unknown hi]</span>')
})

test('mentions resolve to the account, unknown ones to a search', () => {
  const warn = console.warn
  console.warn = () => {} // "failed to get mention for @eve@z.z"
  let html
  try {
    html = render('@bob@x.y and @eve@z.z', {
      htmlContent: '<p><a class="u-url mention" href="https://x.y/@bob">@bob</a> and <a class="mention" href="https://z.z/@eve">@eve</a></p>'
    })
  } finally {
    console.warn = warn
  }
  assert.match(html, /href="\/accounts\/42"[^>]*>@bob</)
  assert.match(html, /href="\/search\?q=%40eve%40z\.z"/)
})

test('hashtags, custom emoji and missing emoji', () => {
  const html = render('#bees :bee: :nope:')
  assert.match(html, /<a class="hashtag" href="\/tags\/bees" rel="tag" data-tag="bees">#bees<\/a>/)
  assert.match(html, /src="https:\/\/x\/bee\.png"/) // static without autoplay
  assert.match(html, /:nope:/)
  assert.match(render(':bee:', { autoplayGifs: true }), /src="https:\/\/x\/bee\.gif"/)
})
