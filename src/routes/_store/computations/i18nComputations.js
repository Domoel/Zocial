import { getMessagesMap } from '../../_intl/runtime.js'

export function i18nComputations (store) {
  // Flat map of all simple (no-placeholder) messages for the current locale. The loader rewrites
  // template intl literals to $messages lookups, so the whole UI re-renders instantly when the
  // user switches language (the computed recomputes when `locale` changes).
  store.compute('messages', ['locale'], (locale) => getMessagesMap(locale))
}
