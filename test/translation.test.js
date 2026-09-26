// @mock _store/store.js -> ./mocks/observableStore.js
// @mock asyncModules/importLibreTranslate.js -> ./mocks/translationBackend.js
// @mock libreTranslateHTML.js -> ./mocks/passthroughHTML.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { store } from './mocks/observableStore.js'
import { backend } from './mocks/translationBackend.js'
import { detectLanguage, translate } from '../src/routes/_utils/libreTranslate.js'
import { translateStatus } from '../src/routes/_actions/translate.js'

const settle = () => new Promise(resolve => setTimeout(resolve, 5))

function respond (status, body) {
  const requests = []
  globalThis.fetch = async (url, init) => {
    requests.push({ url, body: JSON.parse(init.body) })
    if (status === 0) throw new TypeError('Failed to fetch')
    return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status })
  }
  return requests
}

test('detectLanguage strips what pulls the detector toward English', async () => {
  const requests = respond(200, [{ language: 'de', confidence: 100 }])
  const result = await detectLanguage('<p>Hallo @rolle und @bob@x.y, schau mal https://x.y/a?b=c #bees &amp; mehr Text hier</p>')
  assert.deepEqual(result, { language: 'de', confidence: 100 })
  const { q } = requests[0].body
  assert.match(q, /^Hallo und , schau mal mehr Text hier$/)
})

test('detectLanguage: too little text, errors and empty answers give null', async () => {
  let requests = respond(200, [{ language: 'en', confidence: 100 }])
  assert.equal(await detectLanguage('<p>@bob@x.y #ok https://x.y</p>'), null)
  assert.equal(requests.length, 0)
  respond(500, { error: 'boom' })
  assert.equal(await detectLanguage('long enough to detect'), null)
  respond(0)
  assert.equal(await detectLanguage('long enough to detect'), null)
  respond(200, [])
  assert.equal(await detectLanguage('long enough to detect'), null)
  requests = respond(200, [{ language: 'de', confidence: 100 }])
  await detectLanguage('x'.repeat(2000))
  assert.equal(requests[0].body.q.length, 500)
})

test('translate classifies backend errors', async () => {
  respond(429, { error: 'Slow down' })
  await assert.rejects(translate('<p>x</p>', 'de', 'auto'), { type: 'rateLimit', message: 'Slow down' })
  respond(400, { error: 'fi is not supported' })
  await assert.rejects(translate('<p>x</p>', 'de', 'auto'), { type: 'unsupportedLanguage' })
  respond(502, '<html>Bad Gateway</html>')
  await assert.rejects(translate('<p>x</p>', 'de', 'auto'), /non-JSON \(HTTP 502\)/)
})

test('translate reports the detected language only for auto', async () => {
  respond(200, { translatedText: 'Hallo', detectedLanguage: { language: 'en', confidence: 0 } })
  assert.deepEqual(await translate('Hello', 'de', 'auto'), { detected: 'en', detectedConfidence: 0, text: 'Hallo', to: 'de', from: 'auto' })
  respond(200, { translatedText: 'Hallo', detectedLanguage: { language: 'en', confidence: 90 } })
  const result = await translate('Hello', 'de', 'en')
  assert.equal(result.detected, null)
  assert.equal(result.detectedConfidence, null)
})

store.set({
  statusTranslations: {},
  statusTranslationContents: {},
  translationLanguages: { 'a.social': [{ code: 'de' }, { code: 'en' }, { code: 'fr' }] }
})
const CONTENT = '<p>Hyvää huomenta kaikille, mitä kuuluu tänään?</p>'
let nextId = 0

// translateStatus with a stubbed backend; returns the per-status UI state and content.
async function run ({ detect, translated, translateError, to = 'de' }) {
  backend.detectLanguage = async () => detect
  backend.translate = async html => {
    if (translateError) throw translateError
    return { html: '<p>Guten Morgen zusammen, wie geht es euch heute?</p>', ...translated }
  }
  const id = String(++nextId)
  translateStatus({ id, content: CONTENT }, 'a.social', to)
  await settle()
  const { statusTranslations, statusTranslationContents } = store.get()
  return { state: statusTranslations['a.social-' + id], content: statusTranslationContents['a.social-' + id] }
}

test('confidence 0 means the backend has no model for the language', async () => {
  const { state, content } = await run({ detect: { language: 'en', confidence: 0 }, translated: { detected: 'en', detectedConfidence: 0 } })
  assert.equal(state.unsupportedLanguage, true)
  assert.equal(state.error, false)
  assert.equal(content, undefined)
})

test('without /api/detect the translate response carries the same signal', async () => {
  const { state } = await run({ detect: null, translated: { detected: 'en', detectedConfidence: 0 } })
  assert.equal(state.unsupportedLanguage, true)
})

test('a backend without confidence values is not treated as unsupported', async () => {
  const { state, content } = await run({ detect: null, translated: { detected: 'fi', detectedConfidence: undefined } })
  assert.equal(state.unsupportedLanguage, false)
  assert.ok(content)
})

test('a confident detection outside the instance languages is unsupported', async () => {
  const { state } = await run({ detect: { language: 'fi', confidence: 95 } })
  assert.equal(state.unsupportedLanguage, true)
})

test('confidently in the target language: same language, nothing shown', async () => {
  const { state, content } = await run({ detect: { language: 'de', confidence: 99 }, translated: { detected: 'en', detectedConfidence: 80 } })
  assert.equal(state.sameLanguage, true)
  assert.equal(content, undefined)
})

test('an ambiguous detection is ignored and the translation shown', async () => {
  const { state, content } = await run({ detect: { language: 'de', confidence: 30 }, translated: { detected: 'en', detectedConfidence: 30 } })
  assert.equal(state.sameLanguage, false)
  assert.equal(state.unsupportedLanguage, false)
  assert.ok(content)
})

test('the label comes from /api/detect, not from the translate response', async () => {
  const { content } = await run({ detect: { language: 'fr', confidence: 90 }, translated: { detected: 'en', detectedConfidence: 40 } })
  assert.equal(content.detected, 'fr')
})

test('text that comes back unchanged is the same language', async () => {
  const { state } = await run({ detect: { language: 'en', confidence: 40 }, translated: { html: CONTENT, detected: 'en', detectedConfidence: 40 } })
  assert.equal(state.sameLanguage, true)
})

test('failed translations: rate limit, same language, unsupported, error', async () => {
  const rateLimit = Object.assign(new Error('Slow down'), { type: 'rateLimit' })
  assert.equal((await run({ detect: null, translateError: rateLimit })).state.rateLimited, true)
  const failed = new TypeError('Failed to fetch')
  const warn = console.warn
  console.warn = () => {}
  try {
    assert.equal((await run({ detect: { language: 'de', confidence: 99 }, translateError: failed })).state.sameLanguage, true)
    assert.equal((await run({ detect: { language: 'en', confidence: 0 }, translateError: failed })).state.unsupportedLanguage, true)
    const { state, content } = await run({ detect: { language: 'fr', confidence: 99 }, translateError: failed })
    assert.equal(state.error, true)
    assert.equal(content, undefined)
  } finally {
    console.warn = warn
  }
})
