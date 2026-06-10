import { store } from '../_store/store.js'

export async function fetchTranslationLanguages () {
  const { currentInstance, translationLanguagesFetched } = store.get()
  if (!currentInstance) return
  if (translationLanguagesFetched[currentInstance]) return
  store.set({ translationLanguagesFetched: { ...translationLanguagesFetched, [currentInstance]: true } })
  try {
    const resp = await fetch('/api/languages')
    if (!resp.ok) return
    const data = await resp.json()
    if (!Array.isArray(data) || data.length === 0) return
    const langs = data.map(l => ({ code: l.code, name: l.name }))
    const { translationLanguages, translationTargetLanguage } = store.get()
    const update = { translationLanguages: { ...translationLanguages, [currentInstance]: langs } }
    if (translationTargetLanguage && !langs.find(l => l.code === translationTargetLanguage)) {
      update.translationTargetLanguage = null
    }
    store.set(update)
    store.save()
  } catch {
    // Reset flag so the next settings visit retries instead of silently giving up
    const { translationLanguagesFetched: f } = store.get()
    const reset = { ...f }
    delete reset[currentInstance]
    store.set({ translationLanguagesFetched: reset })
  }
}
