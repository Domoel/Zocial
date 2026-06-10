import { importLibreTranslate } from '../_utils/asyncModules/importLibreTranslate.js'
import { store } from '../_store/store.js'
import escapeHtml from 'escape-html'
import { renderPostHTML } from '../_utils/renderPostHTML.ts'
async function translate (html, to, from) {
  const { sourceLanguageNames, translate, detectLanguage } = await importLibreTranslate()
  if (from === 'auto') {
    // Run detect and translate in parallel to save a round trip for the
    // common case (different language). If translate succeeds, use its result
    // directly. If it fails, use the detect result to distinguish "same
    // language" (silent close) from a real error.
    const [transResult, detectResult] = await Promise.allSettled([
      translate(html, to, from),
      detectLanguage(html)
    ])
    if (transResult.status === 'fulfilled') {
      const result = transResult.value
      // The parallel /api/detect call strips HTML before sending and is more
      // reliable than LibreTranslate's own detection on the HTML-wrapped input.
      // Check both so that a misdetection in the translate response doesn't
      // silently show a translated version of an already-matching-language post.
      const detectedFromDetect = detectResult.status === 'fulfilled' ? detectResult.value : null
      if ((result.detected && result.detected === to) || (detectedFromDetect && detectedFromDetect === to)) {
        return { content: null, sourceLanguageNames, sameLanguage: true }
      }
      return { content: result, sourceLanguageNames }
    }
    const detected = detectResult.status === 'fulfilled' ? detectResult.value : null
    if (detected && detected === to) {
      return { content: null, sourceLanguageNames, sameLanguage: true }
    }
    throw transResult.reason
  }
  return { content: await translate(html, to, from), sourceLanguageNames }
}
// Read the target language at call time so that changes to the stored
// preference take effect immediately without a page reload.
function getDefaultLanguage () {
  if (ZOCIAL_IS_BROWSER) {
    const { translationTargetLanguage } = store.get()
    return (translationTargetLanguage || navigator.language).split('-')[0]
  }
  return (process.env.LOCALE || 'en-US').split('-')[0]
}
export function translateStatus (
  status,
  currentInstance,
  to = getDefaultLanguage(),
  from = 'auto'
) {
  const id = currentInstance + '-' + status.id
  const {
    statusTranslations,
    statusTranslationContents,
    autoplayGifs
  } = store.get()
  statusTranslations[id] = statusTranslations[id] || {}
  statusTranslations[id].show = true
  if (
    !(
      statusTranslations[id].loading ||
      (statusTranslationContents[id] &&
        statusTranslations[id].to === to &&
        statusTranslations[id].from === from)
    )
  ) {
    statusTranslations[id].loading = true
    statusTranslations[id].error = false
    statusTranslations[id].rateLimited = false
    statusTranslations[id].unsupportedLanguage = false
    statusTranslations[id].to = to
    statusTranslations[id].from = from
    const emojis = new Map()
    if (status.emojis) {
      for (const emoji of status.emojis) {
        emojis.set(emoji.shortcode, emoji)
      }
    }
    translate(
      (status.spoiler_text
        ? renderPostHTML({
          content: '<span class="spoiler_text">' +
            escapeHtml(status.spoiler_text) +
            '\n\n</span>',
          tags: status.tags,
          autoplayGifs,
          emojis
        })
        : '') + status.content,
      to,
      from
    )
      .then(({ content, sourceLanguageNames, sameLanguage }) => {
        const { statusTranslations, statusTranslationContents } = store.get()
        statusTranslations[id].loading = false
        if (sameLanguage) {
          statusTranslations[id].sameLanguage = true
          store.set({ statusTranslations })
          return
        }
        statusTranslations[id].sourceLanguageNames = sourceLanguageNames
        statusTranslationContents[id] = content
        store.set({ statusTranslations, statusTranslationContents })
      })
      .catch(err => {
        console.error('error translating status', err)
        const { statusTranslations, statusTranslationContents } = store.get()
        statusTranslations[id].loading = false
        if (err.type === 'rateLimit') {
          statusTranslations[id].rateLimited = true
        } else if (err.type === 'unsupportedLanguage') {
          statusTranslations[id].unsupportedLanguage = true
        } else {
          statusTranslations[id].error = true
        }
        delete statusTranslationContents[id]
        store.set({ statusTranslations, statusTranslationContents })
      })
  }
  store.set({ statusTranslations })
}
