import { get, post, DEFAULT_TIMEOUT, WRITE_TIMEOUT } from '../_utils/ajax.js'
import { auth, basename } from './utils.js'

export function getFollowedTags (instanceName, accessToken) {
  const url = `${basename(instanceName)}/api/v1/followed_tags?limit=200`
  return get(url, auth(accessToken), { timeout: DEFAULT_TIMEOUT })
}

export function followTag (instanceName, accessToken, tagName) {
  const url = `${basename(instanceName)}/api/v1/tags/${encodeURIComponent(tagName)}/follow`
  return post(url, null, auth(accessToken), { timeout: WRITE_TIMEOUT })
}

export function unfollowTag (instanceName, accessToken, tagName) {
  const url = `${basename(instanceName)}/api/v1/tags/${encodeURIComponent(tagName)}/unfollow`
  return post(url, null, auth(accessToken), { timeout: WRITE_TIMEOUT })
}
