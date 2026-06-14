import { formatMessage } from '../_intl/runtime.js'
import { mark, stop } from './marks.js'

// Thin wrapper kept for the stable import path used across the app. Delegates to the runtime
// resolver, which resolves the message against the currently selected locale (current → en-US →
// key fallback). Accepts either a message key (the runtime path, e.g. formatIntl(key, values))
// or — for backward compatibility during the loader migration — an already-parsed AST.
export function formatIntl (keyOrAst, values) {
  mark('formatIntl')
  const res = formatMessage(keyOrAst, values)
  stop('formatIntl')
  return res
}
