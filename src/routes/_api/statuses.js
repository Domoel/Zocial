import { auth, basename } from './utils.js'
import { DEFAULT_TIMEOUT, get, post, put, WRITE_TIMEOUT } from '../_utils/ajax.js'

// post is create, put is edit
async function postOrPutStatus (url, accessToken, method, text, inReplyToId, mediaIds,
  sensitive, spoilerText, visibility, poll, contentType, quoteId, localOnly, scheduledAt, mediaAttributes) {
  const body = {
    status: text,
    media_ids: mediaIds,
    sensitive,
    spoiler_text: spoilerText,
    content_type: contentType,
    quote_id: quoteId,
    local_only: localOnly,
    visibility,
    poll,
    ...(method === 'post' && {
      // you can't change these properties when editing
      in_reply_to_id: inReplyToId,
      visibility,
      // ISO8601 timestamp; when set the server returns a ScheduledStatus instead of a Status
      scheduled_at: scheduledAt
    }),
    ...(method === 'put' && {
      // alt text / focal point of already-attached media can only be changed here on edit
      media_attributes: mediaAttributes
    })
  }

  for (const key of Object.keys(body)) {
    const value = body[key]
    // remove any unnecessary fields, except 'status' which must at least be an empty string
    if (key !== 'status' && key !== 'local_only' && (!value || (Array.isArray(value) && !value.length))) {
      delete body[key]
    }
  }

  const func = method === 'post' ? post : put

  return func(url, body, auth(accessToken), { timeout: WRITE_TIMEOUT })
}

export async function postStatus (instanceName, accessToken, text, inReplyToId, mediaIds,
  sensitive, spoilerText, visibility, poll, contentType, quoteId, localOnly, scheduledAt) {
  const url = `${basename(instanceName)}/api/v1/statuses`
  return postOrPutStatus(url, accessToken, 'post', text, inReplyToId, mediaIds,
    sensitive, spoilerText, visibility, poll, contentType, quoteId, localOnly, scheduledAt)
}

export async function putStatus (instanceName, accessToken, id, text, inReplyToId, mediaIds,
  sensitive, spoilerText, visibility, poll, contentType, quoteId, localOnly, mediaAttributes) {
  const url = `${basename(instanceName)}/api/v1/statuses/${id}`
  return postOrPutStatus(url, accessToken, 'put', text, inReplyToId, mediaIds,
    sensitive, spoilerText, visibility, poll, contentType, quoteId, localOnly, undefined, mediaAttributes)
}

export async function getStatusContext (instanceName, accessToken, statusId) {
  const url = `${basename(instanceName)}/api/v1/statuses/${statusId}/context`
  return get(url, auth(accessToken), { timeout: DEFAULT_TIMEOUT })
}

export async function getStatus (instanceName, accessToken, statusId) {
  const url = `${basename(instanceName)}/api/v1/statuses/${statusId}`
  return get(url, auth(accessToken), { timeout: DEFAULT_TIMEOUT })
}

export async function getStatusSource (instanceName, accessToken, statusId) {
  const url = `${basename(instanceName)}/api/v1/statuses/${statusId}/source`
  return get(url, auth(accessToken), { timeout: DEFAULT_TIMEOUT })
}
