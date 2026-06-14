import { DEFAULT_LOCALE } from '../src/routes/_intl/locales.js'

import enUS from '../src/intl/en-US.js'
import parse from 'format-message-parse'

// Build-time strings (static loading-screen template, manifest, service worker) are always rendered
// in the default locale (English); the live UI language is resolved at runtime, not here.
const locales = {
  'en-US': enUS
}

const intl = locales[DEFAULT_LOCALE] || {}

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

  // 1. Look up the English build-time string
  let res = intl[key]

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
