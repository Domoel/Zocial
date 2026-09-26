import { post, WRITE_TIMEOUT } from '../_utils/ajax.js'
import { basename, auth } from './utils.js'

export async function reblogStatus (instanceName, accessToken, statusId) {
  const url = `${basename(instanceName)}/api/v1/statuses/${statusId}/reblog`
  return post(url, null, auth(accessToken), { timeout: WRITE_TIMEOUT })
}

export async function unreblogStatus (instanceName, accessToken, statusId) {
  const url = `${basename(instanceName)}/api/v1/statuses/${statusId}/unreblog`
  return post(url, null, auth(accessToken), { timeout: WRITE_TIMEOUT })
}
