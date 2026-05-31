import { get, DEFAULT_TIMEOUT } from '../_utils/ajax.js'
import { auth, basename } from './utils.js'

export function getFollowedTags (instanceName, accessToken) {
  const url = `${basename(instanceName)}/api/v1/followed_tags?limit=200`
  return get(url, auth(accessToken), { timeout: DEFAULT_TIMEOUT })
}
