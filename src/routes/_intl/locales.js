// Single source of truth for the languages the app ships. ALL locale tables are bundled here so
// the UI language can be switched at runtime (one build, no per-language builds). en-US is the
// canonical fallback locale — see the runtime resolver, which always falls back current → en-US →
// the raw key so a missing/broken translation never renders as empty text.
import enUS from '../../intl/en-US.js'
import de from '../../intl/de.js'
import es from '../../intl/es.js'
import fr from '../../intl/fr.js'
import ruRU from '../../intl/ru-RU.js'

export const DEFAULT_LOCALE = 'en-US'

export const LOCALE_TABLES = {
  'en-US': enUS,
  de,
  es,
  fr,
  'ru-RU': ruRU
}

// Order shown in the language picker. The `name` is the autonym (the language's own name) and is
// intentionally NOT translated. en-US is first because it is always the default (see store.locale):
// the app boots in English (matching the static en-US prerender) and the user switches at runtime.
export const AVAILABLE_LOCALES = [
  { code: 'en-US', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'ru-RU', name: 'Русский' }
]
