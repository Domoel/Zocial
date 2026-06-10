// @ts-check

/**
 * @param {string} instanceName
 */
function targetIsLocalhost (instanceName) {
  return instanceName.startsWith('localhost:') || instanceName.startsWith('127.0.0.1:')
}

/**
 * @param {string} instanceName
 */
export function basename (instanceName) {
  if (targetIsLocalhost(instanceName)) {
    return `http://${instanceName}`
  }
  return `https://${instanceName}`
}

/**
 * @param {string} accessToken
 */
export function auth (accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`
  }
}

/**
 * Derive the streaming API base URL from an instance's info object.
 * Mastodon 4+ exposes it under configuration.urls.streaming; older/other backends
 * use urls.streaming_api. Returns a falsy value if neither is present.
 * @param {any} instanceInfo
 */
export function getStreamingApi (instanceInfo) {
  return (instanceInfo?.configuration?.urls?.streaming) ||
    (instanceInfo?.urls?.streaming_api)
}
