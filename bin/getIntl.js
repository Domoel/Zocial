import { DEFAULT_LOCALE, LOCALE } from '../src/routes/_static/intl.js'

import enUS from '../src/intl/en-US.js'
import fr from '../src/intl/fr.js'
import de from '../src/intl/de.js'
import es from '../src/intl/es.js'
import parse from 'format-message-parse'

// TODO: make it so we don't have to explicitly list these out
const locales = {
  'en-US': enUS,
  fr,
  de,
  es
}

const intl = locales[LOCALE] || {}
const defaultIntl = locales[DEFAULT_LOCALE] || {}

export function warningOrError (message) { // avoid crashing the whole server on `pnpm dev`
  if (process.env.NODE_ENV === 'production') {
    console.error(message)
    return message.replace('Unknown intl string: ', '')
  }
  console.warn(message)
  return '(Placeholder intl string)'
}

const cache = {}
export function getIntl (key) {
  if (cache[key]) return cache[key]

  // 1. Suche in der gewählten Sprache, dann im Englischen Fallback
  let res = intl[key] || defaultIntl[key]

  // 2. Wenn gar nichts gefunden wurde, gib eine Warnung aus und nutze den Key als Notlösung
  if (typeof res !== 'string') {
    res = warningOrError('Unknown intl string: ' + key)
  }

  // 3. Bereinige den String (Leerzeichen etc.)
  const parsed = parse(res.trim().replace(/\s+/g, ' '))

  // 4. Cache das Ergebnis (entweder ein String oder ein AST-Array für format-message)
  if (parsed.length === 1 && typeof parsed[0] === 'string') {
    cache[key] = parsed[0]
    return cache[key]
  }
  cache[key] = parsed
  return parsed
}
