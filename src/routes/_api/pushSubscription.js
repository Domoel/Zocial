import { auth, basename } from './utils.js'
import { post, put, get, del, DEFAULT_TIMEOUT, WRITE_TIMEOUT } from '../_utils/ajax.js'

export async function postSubscription (instanceName, accessToken, subscription, alerts) {
  const url = `${basename(instanceName)}/api/v1/push/subscription`

  return post(url, { subscription: subscription.toJSON(), data: { alerts } }, auth(accessToken), { timeout: WRITE_TIMEOUT })
}

export async function putSubscription (instanceName, accessToken, alerts) {
  const url = `${basename(instanceName)}/api/v1/push/subscription`

  return put(url, { data: { alerts } }, auth(accessToken), { timeout: WRITE_TIMEOUT })
}

export async function getSubscription (instanceName, accessToken) {
  const url = `${basename(instanceName)}/api/v1/push/subscription`

  return get(url, auth(accessToken), { timeout: DEFAULT_TIMEOUT })
}

export async function deleteSubscription (instanceName, accessToken) {
  const url = `${basename(instanceName)}/api/v1/push/subscription`

  return del(url, auth(accessToken), { timeout: WRITE_TIMEOUT })
}
