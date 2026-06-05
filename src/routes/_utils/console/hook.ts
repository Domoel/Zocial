import { emit } from '../eventBus.ts'
export type Log = {
  type: string
  args: unknown[]
  time: number
  stack?: string
}
export const logs: Log[] = []

// Startup banner — shown in the devtools console and, separately, as an always-visible
// header on the Logs page (so it's exempt from the error/warn level filter).
// "Built for" reflects the branch-based channel: main → Production, otherwise Development.
const channelLabel = ZOCIAL_CHANNEL === 'prod' ? 'Production' : 'Development'
export const banner = String.raw`=====    Starting Zocial
  //     Version ${ZOCIAL_VERSION}
=====    Built for ${channelLabel}`

// Empty the in-memory log buffer and tell the Logs view to clear what it's showing.
export function clearLogs() {
  logs.length = 0
  emit('clearConsole')
}

if (ZOCIAL_IS_BROWSER) {
  // Print to the real console BEFORE installing the capture proxy, so the banner shows
  // in devtools but is NOT captured into the in-app logs (it's rendered there separately).
  console.info(banner)

  function add(log: Log) {
    if (logs.length > 100) {
      logs.shift()
    }
    logs.push(log)
    emit('console', log)
  }
  globalThis.addEventListener('unhandledrejection', (event) => {
    const log = {
      type: 'error',
      args: ['Uncaught (in promise) %o', event.reason],
      time: Date.now(),
      stack: new Error().stack,
    }
    add(log)
  })
  globalThis.addEventListener('error', (event) => {
    const log = {
      type: 'error',
      args: ['%o', event.error],
      time: Date.now(),
      stack: new Error().stack,
    }
    add(log)
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
