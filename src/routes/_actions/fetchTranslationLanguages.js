import { store } from '../_store/store.js'

export async function fetchTranslationLanguages () {
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
