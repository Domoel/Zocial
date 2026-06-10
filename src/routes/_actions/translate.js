import { importLibreTranslate } from '../_utils/asyncModules/importLibreTranslate.js'
import { store } from '../_store/store.js'
import escapeHtml from 'escape-html'
import { renderPostHTML } from '../_utils/renderPostHTML.ts'
// supportedSourceCodes: array of language codes supported by the current instance (e.g. ['de','en']).
// When provided, used to catch cases where LibreTranslate mis-detects an unsupported language
// (e.g. Finnish) as a supported one (e.g. English) and silently produces a bogus translation.
async function translate (html, to, from, supportedSourceCodes) {
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
      // /api/detect runs on pre-cleaned plain text (HTML/URL/mention-stripped) and is
      // more reliable than the translate endpoint's detection on raw HTML input.
      const detectedFromDetect = detectResult.status === 'fulfilled' ? detectResult.value : null

      if (detectedFromDetect) {
        // We have a reliable detection. Use it exclusively for all checks.
        // IMPORTANT: unsupported-language check MUST run before same-language check.
        // If LibreTranslate mis-detects e.g. Finnish as English and the user's target IS
        // English, result.detected === to would fire "already in your language" before
        // we ever get a chance to surface the real problem (unsupported language).
        if (supportedSourceCodes && supportedSourceCodes.length > 0 &&
            !supportedSourceCodes.includes(detectedFromDetect)) {
          const err = new Error('Unsupported source language: ' + detectedFromDetect)
          err.type = 'unsupportedLanguage'
          throw err
        }
        if (detectedFromDetect === to) {
          return { content: null, sourceLanguageNames, sameLanguage: true }
        }
      } else {
        // No reliable independent detection — fall back to the translate endpoint's result.
        if (result.detected && result.detected === to) {
          return { content: null, sourceLanguageNames, sameLanguage: true }
        }
      }

      // Final fallback: if LibreTranslate returned the text completely unchanged it
      // effectively performed a no-op — treat it as same language regardless of what
      // language detection said (handles cases where both detectors misfire).
      const toPlain = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      const inputPlain = toPlain(html)
      const outputPlain = toPlain(result.html || '')
      if (inputPlain.length > 10 && inputPlain === outputPlain) {
        return { content: null, sourceLanguageNames, sameLanguage: true }
      }

      // Use the more reliable detect result for the "Translated from X" display label.
      if (detectedFromDetect) {
        result.detected = detectedFromDetect
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
    autoplayGifs,
    translationLanguages
  } = store.get()
  const instanceLangs = translationLanguages && translationLanguages[currentInstance]
  const supportedSourceCodes = instanceLangs ? instanceLangs.map(l => l.code) : null
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
      from,
      supportedSourceCodes
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
