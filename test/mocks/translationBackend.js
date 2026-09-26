// The lazily imported LibreTranslate module, with translate/detectLanguage set per test.
export const backend = {
  sourceLanguageNames: { de: 'German', en: 'English', fi: 'Finnish', fr: 'French' },
  translate: null,
  detectLanguage: null
}
export const importLibreTranslate = async () => backend
