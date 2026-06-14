// Transforms `'intl.x'` message references at build time.
//
// Two modes:
//  - buildTimeIntl(): the original behaviour — inline the resolved default-locale (en-US) string/AST.
//    Used for STATIC build artifacts (manifest, template.html, inline script) and the service worker,
//    none of which have the app store at runtime.
//  - default export (webpack loader): RUNTIME resolution, so the UI language can be switched live.
//    Template `'intl.x'` -> `$messages['x']` (the reactive per-locale map; every component inherits
//    the store from the root _layout). Script `'intl.x'` -> `getMessage('intl.x')`, while
//    `formatIntl('intl.x', …)` keeps its key (formatIntl resolves keys at runtime). See src/routes/_intl/.
import { getIntl } from '../bin/getIntl.js'

const INTL_RE = /(['"])intl\.([^'"]+)\1/g
const NUL = String.fromCharCode(0) // null-char placeholder marker that never occurs in source

// Build-time inline (default locale). For static artifacts + the service worker.
export function buildTimeIntl (source) {
  return source.replace(INTL_RE, (match, _quote, key) => JSON.stringify(getIntl(key)))
}

// Transform a SCRIPT region (a component <script> body, or a whole .js/.ts module).
function transformScript (code) {
  // 1. Protect formatIntl('intl.X' so its key isn't wrapped in getMessage below.
  code = code.replace(/(formatIntl\(\s*)(['"])intl\.([^'"]+)\2/g,
    (match, prefix, _quote, key) => prefix + NUL + key + NUL)
  // 2. Any remaining bare 'intl.X' -> getMessage('intl.X')
  let usedGetMessage = false
  code = code.replace(INTL_RE, (match, _quote, key) => {
    usedGetMessage = true
    return `getMessage('intl.${key}')`
  })
  // 3. Restore the protected formatIntl keys.
  code = code.replace(new RegExp('formatIntl\\(\\s*' + NUL + '([^' + NUL + ']+)' + NUL, 'g'),
    (match, key) => `formatIntl('intl.${key}'`)
  // 4. Inject the getMessage import only if we actually produced a call to it, and the module
  // doesn't already declare or import getMessage (e.g. the runtime module itself defines it).
  const declaresGetMessage = /\bfunction\s+getMessage\b|\b(?:const|let|var)\s+getMessage\b|import\b[^\n;]*\bgetMessage\b/.test(code)
  if (usedGetMessage && !declaresGetMessage) {
    code = "import { getMessage } from 'zocial-intl-runtime'\n" + code
  }
  return code
}

// Transform a TEMPLATE region: 'intl.x' -> $messages['x'] (reactive store lookup).
function transformTemplate (markup) {
  return markup.replace(INTL_RE, (match, _quote, key) => `$messages[${JSON.stringify(key)}]`)
}

// Split a Svelte v2 .html into <script>/<style>/template and transform each part appropriately.
function transformHtml (source) {
  const blocks = []
  const stash = (text) => `${NUL}BLOCK${blocks.push(text) - 1}${NUL}`
  // Pull out <script> blocks (transformed as script) and <style> blocks (left untouched) so the
  // template-only transform can't touch them.
  let work = source.replace(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi,
    (match, attrs, body) => stash(`<script${attrs || ''}>${transformScript(body)}</script>`))
  work = work.replace(/<style(\s[^>]*)?>[\s\S]*?<\/style>/gi, (match) => stash(match))
  // What remains is the template.
  work = transformTemplate(work)
  // Restore the stashed blocks.
  return work.replace(new RegExp(NUL + 'BLOCK(\\d+)' + NUL, 'g'), (match, i) => blocks[+i])
}

// Webpack loader entry. The service worker has no store, so it keeps build-time inlining.
export default function (source) {
  const resourcePath = (this && this.resourcePath) || ''
  if (/service-worker/.test(resourcePath)) {
    return buildTimeIntl(source)
  }
  if (/\.html$/.test(resourcePath)) {
    return transformHtml(source)
  }
  return transformScript(source)
}
