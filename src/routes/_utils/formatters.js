import { getCurrentLocale } from '../_intl/runtime.js'

const safeFormatter = (formatter) => {
  return {
    format (date) {
      if (typeof date !== 'number') {
        return 'intl.never' // null means "never" in Misskey
      }
      try {
        return formatter.format(date)
      } catch (e) {
        if (e instanceof RangeError) {
          // The fediverse is wild, so invalid dates may exist. Don't fail with a fatal error in that case.
          return 'intl.never'
        }
        throw e
      }
    }
  }
}

// One memoized Intl formatter per locale, so date formats follow the runtime UI language (a new
// formatter is built the first time each locale is used) instead of being frozen at the build locale.
function perLocaleFormatter (create) {
  const cache = {}
  return () => {
    const locale = getCurrentLocale()
    return cache[locale] || (cache[locale] = safeFormatter(create(locale)))
  }
}

export const absoluteDateFormatter = perLocaleFormatter((locale) => new Intl.DateTimeFormat(locale, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
}))

export const shortAbsoluteDateFormatter = perLocaleFormatter((locale) => new Intl.DateTimeFormat(locale, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
}))

export const dayOnlyAbsoluteDateFormatter = perLocaleFormatter((locale) => new Intl.DateTimeFormat(locale, {
  year: 'numeric',
  month: 'short',
  day: 'numeric'
}))
