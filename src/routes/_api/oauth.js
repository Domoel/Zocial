import { post, paramsString, WRITE_TIMEOUT } from '../_utils/ajax.js'
import { basename } from './utils.js'

const WEBSITE = 'https://zocial.social'
const SCOPES = 'read write follow push'

export function registerApplication (instanceName, redirectUri) {
  const url = `${basename(instanceName)}/api/v1/apps`
  return post(url, {
    client_name: process.env.UPSTREAM ? 'Zocial' : ZOCIAL_IS_BROWSER ? location.hostname : 'Zocial',
    redirect_uris: redirectUri,
    scopes: SCOPES,
    website: ZOCIAL_IS_BROWSER ? location.origin : WEBSITE
  }, null, { timeout: WRITE_TIMEOUT })
}

export function generateAuthLink (instanceName, clientId, redirectUri, state) {
  const params = paramsString({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES,
    state
  })
  return `${basename(instanceName)}/oauth/authorize?${params}`
}

export function getAccessTokenFromAuthCode (instanceName, clientId, clientSecret, code, redirectUri) {
  const url = `${basename(instanceName)}/oauth/token`
  // Using URLSearchParams here guarantees a content type of application/x-www-form-urlencoded
  // See https://fetch.spec.whatwg.org/#bodyinit-unions
  return post(url, new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    code
  }), null, { timeout: WRITE_TIMEOUT })
}

// RFC 7009 token revocation (Mastodon, GoToSocial and Akkoma all offer it; Mastodon allows it via
// CORS). Needs the credentials of the app the token was issued to.
export function revokeToken (instanceName, clientId, clientSecret, token) {
  const url = `${basename(instanceName)}/oauth/revoke`
  return post(url, new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    token
  }), null, { timeout: WRITE_TIMEOUT })
}
