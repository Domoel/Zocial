// Store, browser location and server for the OAuth login flow.
globalThis.location = { origin: 'https://zocial.test' }
globalThis.document = { location: {} }

const state = {
  instanceNameInSearch: 'Social.Example/',
  loggedInInstances: {},
  loggedInInstancesInOrder: [],
  instanceThemes: {},
  enableGrayscale: false
}
export const store = {
  get: () => state,
  set (obj) {
    Object.assign(state, obj)
  },
  save () {},
  runIfLoggedIn () {}
}

export const requests = []
globalThis.fetch = async (url, opts) => {
  requests.push({ url, method: opts.method, body: opts.body instanceof URLSearchParams ? Object.fromEntries(opts.body) : opts.body })
  const reply = json => ({ status: 200, headers: new Map(), json: async () => json })
  if (url.endsWith('/api/v1/apps')) return reply({ client_id: 'cid', client_secret: 'secret' })
  if (url.endsWith('/oauth/token')) return reply({ access_token: 'tok', token_type: 'Bearer', scope: 'read write follow push' })
  return reply({}) // instance info
}

export function goto () {}
export const DEFAULT_THEME = 'default'
export function switchToTheme () {}
export async function updateVerifyCredentialsForInstance () {}
export async function updateCustomEmojiForInstance () {}
export const database = { setInstanceInfo: async () => {} }
export function formatIntl (key, values) {
  return key.replace(/^intl\./, '') + ': ' + (values && (values.error || values.instance))
}
export function getSingleInstance () {
  return ''
}
