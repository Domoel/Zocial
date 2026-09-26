// A browser push stack (one shared subscription), a Mastodon push API and the store, for the push
// actions. Everything the tests inspect is exported.
export const SERVER_KEY = Buffer.alloc(65, 7).toString('base64url')
export const OTHER_KEY = Buffer.alloc(65, 9).toString('base64url')
const keyBytes = key => new Uint8Array(Buffer.from(key, 'base64url'))

let endpointCounter = 0
class FakeSubscription {
  constructor (applicationServerKey) {
    this.options = { applicationServerKey }
    this.endpoint = 'https://push.example/' + (++endpointCounter)
  }

  toJSON () {
    return { endpoint: this.endpoint, keys: { p256dh: 'x', auth: 'y' } }
  }

  async unsubscribe () {
    this.unsubscribed = true
    if (pushManager.current === this) pushManager.current = null
    return true
  }
}

export const pushManager = {
  current: null,
  subscribed: [],
  async getSubscription () {
    return this.current
  },
  async subscribe ({ applicationServerKey }) {
    const subscription = new FakeSubscription(applicationServerKey)
    this.current = subscription
    this.subscribed.push(subscription)
    return subscription
  }
}
export function browserSubscriptionWithKey (key) {
  const subscription = new FakeSubscription(keyBytes(key))
  pushManager.current = subscription
  return subscription
}

// Web Locks: one holder per name at a time
const lockQueues = {}
export const lockLog = []
Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  writable: true,
  value: {
    serviceWorker: { ready: Promise.resolve({ pushManager }) },
    locks: {
      request (name, fn) {
        const previous = lockQueues[name] || Promise.resolve()
        const run = previous.then(async () => {
          lockLog.push('enter')
          try {
            return await fn({ name })
          } finally {
            lockLog.push('exit')
          }
        })
        lockQueues[name] = run.catch(() => {})
        return run
      }
    }
  }
})
globalThis.Notification = { permission: 'granted' }

// Mastodon: one push subscription per access token
export const server = { subscription: null, requests: [], failNextPost: null }
globalThis.fetch = async (url, opts) => {
  const method = opts.method
  const body = opts.body ? JSON.parse(opts.body) : null
  server.requests.push({ method, body })
  const reply = (status, json) => ({ status, headers: new Map(), json: async () => json })
  if (method === 'POST') {
    if (server.failNextPost) {
      const status = server.failNextPost
      server.failNextPost = null
      return reply(status, { error: 'nope' })
    }
    server.subscription = { id: 1, endpoint: body.subscription.endpoint, server_key: SERVER_KEY, alerts: body.data.alerts }
    return reply(200, server.subscription)
  }
  if (!server.subscription) return reply(404, { error: 'Record not found' })
  if (method === 'PUT') {
    server.subscription = Object.assign({}, server.subscription, { alerts: body.data.alerts })
    return reply(200, server.subscription)
  }
  if (method === 'DELETE') {
    server.subscription = null
    return reply(200, {})
  }
  return reply(200, server.subscription)
}

const state = {
  loggedInInstances: { 'a.social': { access_token: 'tok-a' }, 'b.social': { access_token: 'tok-b' } },
  pushSubscriptions: {},
  enableDesktopNotifications: {},
  lastPushAlerts: {},
  pushFailureCount: {},
  pushNotificationsSupport: true
}
export const reloadedKeys = []
export const store = {
  get: () => state,
  set (obj) {
    Object.assign(state, obj)
  },
  save () {},
  reloadKeys (keys) {
    reloadedKeys.push(keys)
  },
  getInstanceData: (instanceName, key) => (state[key] || {})[instanceName],
  setInstanceData (instanceName, key, value) {
    state[key] = Object.assign({}, state[key], { [instanceName]: value })
  },
  runIfLoggedIn (instanceName, callback) {
    if (instanceName && state.loggedInInstances[instanceName]) {
      return callback(state)
    }
  }
}
export function sameKey (bytes, key) {
  return Buffer.from(bytes).equals(Buffer.from(key, 'base64url'))
}
