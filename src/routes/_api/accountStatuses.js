import { get, paramsString, DEFAULT_TIMEOUT } from '../_utils/ajax.js'
import { auth, basename } from './utils.js'

// Fetch an account's most recent statuses (replies and boosts included) for the
// posting-stats bar shown on the profile page. Best-effort, small fixed page.
export async function getAccountStatusesForStats (instanceName, accessToken, accountId, limit = 20) {
  let url = `${basename(instanceName)}/api/v1/accounts/${accountId}/statuses`
  url += '?' + paramsString({
    limit,
    exclude_replies: false,
    exclude_reblogs: false
  })
  return get(url, auth(accessToken), { timeout: DEFAULT_TIMEOUT })
}
