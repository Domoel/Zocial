import { emit } from '../eventBus.ts'
export type Log = {
  type: string
  args: unknown[]
  time: number
  stack?: string
  // set on logs restored from storage — pre-formatted text, rendered as-is
  message?: string
}
export const logs: Log[] = []

const LOG_STORAGE_KEY = 'zocial_logs'
const MAX_LOGS = 100

function stringifyValue(value: unknown): string {
  if (typeof value === 'string') return value
  if (value instanceof Error) return value.stack || `${value.name}: ${value.message}`
  if (value === null) return 'null'
  if (typeof value === 'undefined') return 'undefined'
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch (e) {
      return String(value)
    }
  }
  return String(value)
}

// Turn a log's args into a single plain-text line, substituting console-style format
// specifiers (%s %d %i %f %o %O %j %c) so persisted text reads like the live output.
function serializeArgs(args: unknown[]): string {
  if (!args.length) return ''
  const first = args[0]
  if (typeof first === 'string' && args.length > 1 && /%[sdifoOjc%]/.test(first)) {
    let i = 1
    const formatted = first.replace(/%([sdifoOjc%])/g, (match, spec) => {
      if (spec === '%') return '%'
      if (i >= args.length) return match
      const value = args[i++]
      return spec === 'c' ? '' : stringifyValue(value)
    })
    return [formatted, ...args.slice(i).map(stringifyValue)].join(' ')
  }
  return args.map(stringifyValue).join(' ')
}

function logToStored(log: Log) {
  return {
    type: log.type,
    time: log.time,
    message: typeof log.message === 'string' ? log.message : serializeArgs(log.args),
  }
}

// Startup banner — shown in the devtools console and, separately, as an always-visible
// header on the Logs page (so it's exempt from the error/warn level filter).
// "Built for" reflects the branch-based channel: main → Production, otherwise Development.
const channelLabel = ZOCIAL_CHANNEL === 'prod' ? 'Production' : 'Development'
export const banner = String.raw`=====    Zocial
  //     Version ${ZOCIAL_VERSION}
=====    Built for ${channelLabel}`

// Empty the in-memory log buffer and tell the Logs view to clear what it's showing.
export function clearLogs() {
  logs.length = 0
  emit('clearConsole')
  if (ZOCIAL_IS_BROWSER) {
    try {
      localStorage.removeItem(LOG_STORAGE_KEY)
    } catch (e) { /* storage unavailable */ }
  }
}

if (ZOCIAL_IS_BROWSER) {
  // Restore the previous session's logs (stored as plain text so they survive a reload).
  try {
    const stored = localStorage.getItem(LOG_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        for (const entry of parsed.slice(-MAX_LOGS)) {
          logs.push({ type: entry.type, time: entry.time, args: [], message: entry.message })
        }
      }
    }
  } catch (e) { /* corrupt or unavailable storage */ }

  // Persist the buffer (debounced), and flush synchronously when the page is hidden/closed
  // so logs aren't lost if a reload happens within the debounce window.
  function saveNow() {
    try {
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs.map(logToStored)))
    } catch (e) { /* quota or unavailable */ }
  }
  let saveTimer: ReturnType<typeof setTimeout> | undefined
  function persist() {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(saveNow, 1000)
  }
  globalThis.addEventListener('pagehide', saveNow)

  // Print to the real console BEFORE installing the capture proxy, so the banner shows
  // in devtools but is NOT captured into the in-app logs (it's rendered there separately).
  console.info(banner)

  function add(log: Log) {
    if (logs.length > MAX_LOGS) {
      logs.shift()
    }
    logs.push(log)
    emit('console', log)
    persist()
  }
  globalThis.addEventListener('unhandledrejection', (event) => {
    // capture the ORIGINAL error's stack (event.reason), not the handler's, and fold it into
    // the message so the source is visible live, in "Copy logs", and after a reload
    const reason: any = event.reason
    const detail = (reason && reason.stack) || (reason && reason.message) || String(reason)
    add({
      type: 'error',
      args: ['Uncaught (in promise): ' + detail],
      time: Date.now(),
      stack: reason && reason.stack,
    })
  })
  globalThis.addEventListener('error', (event) => {
    const err: any = event.error
    const detail = (err && err.stack) || (err && err.message) || event.message || String(err)
    add({
      type: 'error',
      args: [detail],
      time: Date.now(),
      stack: err && err.stack,
    })
  })
  globalThis.console = new Proxy(console, {
    get(target, key) {
      const real: unknown = (target as any)[key]
      if (typeof real === 'function' && typeof key === 'string') {
        return function (this: Console, ...args: any[]) {
          const log = {
            type: key,
            args,
            time: Date.now(),
            stack: new Error().stack,
          }
          add(log)
          return real.call(this, ...args)
        }
      }
    },
  })
}
