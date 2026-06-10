import { store } from '../_store/store.js'

export async function fetchTranslationLanguages () {
  const { currentInstance, translationLanguagesFetched } = store.get()
  if (!currentInstance) return
  if (translationLanguagesFetched[currentInstance]) return
  store.set({ translationLanguagesFetched: { ...translationLanguagesFetched, [currentInstance]: true } })

  // Clear the fetch flag so the next settings visit retries. Called for every failure
  // (non-OK response, invalid payload, or network exception) but NOT for a legitimately
  // empty language list, which is treated as a valid result that needs no retry.
  const resetFetchedFlag = () => {
    const { translationLanguagesFetched: f } = store.get()
    const reset = { ...f }
    delete reset[currentInstance]
    store.set({ translationLanguagesFetched: reset })
  }

  try {
    const resp = await fetch('/api/languages')
    if (!resp.ok) {
      resetFetchedFlag()
      return
    }
    const data = await resp.json()
    if (!Array.isArray(data)) {
      resetFetchedFlag()
      return
    }
    if (data.length === 0) return // valid empty result — keep the flag, don't retry
    const langs = data.map(l => ({ code: l.code, name: l.name }))
    const { translationLanguages, translationTargetLanguage } = store.get()
    const update = { translationLanguages: { ...translationLanguages, [currentInstance]: langs } }
    if (translationTargetLanguage && !langs.find(l => l.code === translationTargetLanguage)) {
      update.translationTargetLanguage = null
    }
    store.set(update)
    store.save()
  } catch {
    resetFetchedFlag()
  }
}
