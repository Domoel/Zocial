import { auth, basename } from './utils.js'
import { get, post, put, DEFAULT_TIMEOUT, MEDIA_WRITE_TIMEOUT, WRITE_TIMEOUT } from '../_utils/ajax.js'

async function doUploadMedia (version, instanceName, accessToken, file, description) {
  const formData = new FormData()
  formData.append('file', file)
  if (description) {
    formData.append('description', description)
  }
  const url = `${basename(instanceName)}/api/${version}/media`
  return post(url, formData, auth(accessToken), { timeout: MEDIA_WRITE_TIMEOUT })
}

async function doPutMediaMetadata (version, instanceName, accessToken, mediaId, description, focus) {
  const url = `${basename(instanceName)}/api/${version}/media/${mediaId}`
  return put(url, { description, focus: (focus && focus.join(',')) }, auth(accessToken), { timeout: WRITE_TIMEOUT })
}

export async function uploadMedia (instanceName, accessToken, file, description) {
  try {
    return (await doUploadMedia('v2', instanceName, accessToken, file, description))
  } catch (err) {
    if (err && err.status === 404) { // fall back to old v1 API
      return doUploadMedia('v1', instanceName, accessToken, file, description)
    } else {
      throw err
    }
  }
}

export async function putMediaMetadata (instanceName, accessToken, mediaId, description, focus) {
  try {
    return (await doPutMediaMetadata('v2', instanceName, accessToken, mediaId, description, focus))
  } catch (err) {
    if (err && err.status === 404) { // fall back to old v1 API
      return doPutMediaMetadata('v1', instanceName, accessToken, mediaId, description, focus)
    } else {
      throw err
    }
  }
}

const MEDIA_PROCESSING_MAX_WAIT = 120000

// Mastodon's v2 upload answers 202 with `url: null` while a large file (a video) is still being
// processed, and attaching it before then fails with 422. Poll GET /media/:id (206 while processing)
// until it's ready, bounded; on timeout or error the caller carries on with what it has.
export async function waitForMediaProcessing (instanceName, accessToken, media) {
  let current = media
  let delay = 1000
  const deadline = Date.now() + MEDIA_PROCESSING_MAX_WAIT
  try {
    while (current && current.id && current.url == null && Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, delay))
      delay = Math.min(delay * 1.5, 5000)
      current = (await get(`${basename(instanceName)}/api/v1/media/${media.id}`, auth(accessToken), { timeout: DEFAULT_TIMEOUT })) || current
    }
  } catch (e) {
    console.warn('failed to check media processing:', (e && e.message) || e)
  }
  return current || media
}
