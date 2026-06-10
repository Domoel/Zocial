import { store } from '../_store/store.js'

export async function fetchTranslationLanguages () {
  const { translationLanguagesFetched } = store.get()
  if (translationLanguagesFetched) return
  // Mark as fetched immediately so concurrent calls (e.g. rapid settings re-opens) don't stack up
  store.set({ translationLanguagesFetched: true })
  try {
    const resp = await fetch('/api/languages')
    if (!resp.ok) return
    const data = await resp.json()
    if (!Array.isArray(data) || data.length === 0) return
    store.set({ translationLanguages: data.map(l => ({ code: l.code, name: l.name })) })
    store.save()
  } catch {
    // leave whatever was previously cached in the store
  }
}
