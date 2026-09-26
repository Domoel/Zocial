import { auth, basename } from './utils.js'
import { post, WRITE_TIMEOUT } from '../_utils/ajax.js'

export async function report (instanceName, accessToken, accountId, statusIds, comment, forward) {
  const url = `${basename(instanceName)}/api/v1/reports`
  return post(url, {
    account_id: accountId,
    status_ids: statusIds,
    comment,
    forward
  }, auth(accessToken), { timeout: WRITE_TIMEOUT })
}
