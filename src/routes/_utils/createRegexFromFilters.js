// copy-pasta'd from mastodon
// https://github.com/tootsuite/mastodon/blob/2ff01f7/app/javascript/mastodon/selectors/index.js#L40-L63
import { escapeRegExp } from './escapeRegExp.js'

export const createRegexFromFilters = filters => {
  const expressions = filters.map(filter => {
    let expr = escapeRegExp(filter.phrase)

    if (filter.whole_word) {
      if (/^[\w]/.test(expr)) {
        expr = `\\b${expr}`
      }

      if (/[\w]$/.test(expr)) {
        expr = `${expr}\\b`
      }
    }

    return expr
  }).filter(Boolean) // drop empty phrases — an empty alternative (`foo|`) makes the regex match
  // *everything*, which would silently hide the entire timeline.

  if (!expressions.length) {
    return /(?!)/ // never matches
  }

  return new RegExp(expressions.join('|'), 'i')
}
