import { importLibreTranslate } from '../_utils/asyncModules/importLibreTranslate.js'
import { store } from '../_store/store.js'
import escapeHtml from 'escape-html'
import { renderPostHTML } from '../_utils/renderPostHTML.ts'
function unsupportedLanguageError (language) {
  const err = new Error('Unsupported source language: ' + (language || 'unknown'))
  err.type = 'unsupportedLanguage'
  return err
}

// Decide whether a detection ({ language, confidence } | null) means the source language is
// not supported by the backend. Two independent signals:
//   1. confidence ≈ 0: the backend has no detection model for this language and fell back to
//      its default with (near-)zero confidence. This is the primary, most reliable signal and
//      works even when we don't know the instance's supported-language list. We use < 1 rather
//      than === 0 to stay robust if a backend reports a tiny non-zero value for "no model".
//      A null/undefined confidence (older backend) is NOT treated as unsupported.
//   2. A confidently detected language (≥ 50) that is not in the known supported list — a
//      backup for instances whose detector knows more languages than the translator supports.
function isUnsupportedDetection (detection, trustedLanguage, supportedSourceCodes) {
  if (detection && typeof detection.confidence === 'number' && detection.confidence < 1) {
    return true
  }
  if (trustedLanguage && supportedSourceCodes && supportedSourceCodes.length > 0 &&
      !supportedSourceCodes.includes(trustedLanguage)) {
    return true
  }
  return false
}

// supportedSourceCodes: array of language codes supported by the current instance (e.g. ['de','en']).
// Used as a secondary check; the primary unsupported-language signal is a zero-confidence
// detection (the backend has no model for the language) — see isUnsupportedDetection.
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
    // /api/detect runs on pre-cleaned plain text (HTML/URL/mention-stripped) and is
    // more reliable than the translate endpoint's detection on raw HTML input.
    // It returns { language, confidence } or null.
    const detection = detectResult.status === 'fulfilled' ? detectResult.value : null

    if (transResult.status === 'fulfilled') {
      const result = transResult.value

      // Prefer the dedicated /api/detect result. If it failed (network/empty), fall back to the
      // translate endpoint's own detection — it carries a confidence too, so the zero-confidence
      // "no model" signal still works even when /api/detect is unavailable.
      const effectiveDetection = detection ||
        (result.detected != null
          ? { language: result.detected, confidence: result.detectedConfidence }
          : null)
      const trustedLanguage = effectiveDetection && effectiveDetection.confidence >= 50
        ? effectiveDetection.language
        : null

      // IMPORTANT: the unsupported-language check MUST run before the same-language /
      // text-similarity checks. The backend returns the text unchanged for a language it
      // can't translate, which would otherwise be mistaken for "already in your language".
      if (isUnsupportedDetection(effectiveDetection, trustedLanguage, supportedSourceCodes)) {
        throw unsupportedLanguageError(trustedLanguage)
      }
      if (trustedLanguage) {
        if (trustedLanguage === to) {
          return { content: null, sourceLanguageNames, sameLanguage: true }
        }
      } else if (result.detected && result.detected === to) {
        // No trustworthy independent detection — fall back to the translate endpoint's result.
        return { content: null, sourceLanguageNames, sameLanguage: true }
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
      if (trustedLanguage) {
        result.detected = trustedLanguage
      }
      return { content: result, sourceLanguageNames }
    }
    // Translate failed, so there is no translate-endpoint detection to fall back to —
    // only the /api/detect result is available here.
    const trustedLanguage = detection && detection.confidence >= 50 ? detection.language : null
    if (isUnsupportedDetection(detection, trustedLanguage, supportedSourceCodes)) {
      throw unsupportedLanguageError(trustedLanguage)
    }
    if (trustedLanguage && trustedLanguage === to) {
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
    statusTranslations[id].sameLanguage = false
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
        const { statusTranslations, statusTranslationContents } = store.get()
        statusTranslations[id].loading = false
        if (err.type === 'rateLimit') {
          statusTranslations[id].rateLimited = true
        } else if (err.type === 'unsupportedLanguage') {
          // Expected, classified outcome (not a supported language) — surfaced in the UI,
          // not an error worth logging to the console.
          statusTranslations[id].unsupportedLanguage = true
        } else {
          console.error('error translating status', err)
          statusTranslations[id].error = true
        }
        delete statusTranslationContents[id]
        store.set({ statusTranslations, statusTranslationContents })
      })
  }
  store.set({ statusTranslations })
}
