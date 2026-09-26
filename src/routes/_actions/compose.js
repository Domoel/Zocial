import { store } from '../_store/store.js'
import { toast } from '../_components/toast/toast.js'
import { postStatus as postStatusToServer, putStatus as putStatusToServer } from '../_api/statuses.js'
import { addStatusOrNotification } from './addStatusOrNotification.js'
import { database } from '../_database/database.js'
import { emit } from '../_utils/eventBus.ts'
import { putMediaMetadata } from '../_api/media.js'
import { scheduleIdleTask } from '../_utils/scheduleIdleTask.js'
import { uniqById } from '../_utils/lodash-lite.js'
import { formatIntl } from '../_utils/formatIntl.js'
import { logActionError } from '../_utils/isNetworkError.js'
import { rehydrateStatusOrNotification } from './rehydrateStatusOrNotification.js'
import { randomToken } from '../_utils/randomToken.js'

export async function insertHandleForReply (realm, statusId, statusInHand) {
  const { currentInstance } = store.get()
  // search results aren't stored in IndexedDB, so fall back to the status the reply box belongs to
  const status = (await database.getStatus(currentInstance, statusId)) || statusInHand
  if (!status) {
    return
  }
  const { currentVerifyCredentials } = store.get()
  const originalStatus = status.reblog || status
  let accounts = [originalStatus.account].concat(originalStatus.mentions || [])
    .filter(account => account.id !== currentVerifyCredentials.id)
  // Pleroma includes account in mentions as well, so make uniq
  accounts = uniqById(accounts)
  if (!store.getComposeData(realm, 'text') && accounts.length) {
    store.setComposeData(realm, {
      text: accounts.map(account => `@${account.acct} `).join('')
    })
  }
}

export async function postStatus (realm, text, inReplyToId, mediaIds,
  sensitive, spoilerText, visibility,
  mediaDescriptions, inReplyToUuid, poll, mediaFocalPoints, contentType, quoteId, localOnly, editId, scheduledAt) {
  const { currentInstance, accessToken, online } = store.get()

  if (!online) {
    /* no await */ toast.say('intl.cannotPostOffline')
    return
  }

  text = text || ''

  const mediaMetadata = (mediaIds || []).map((mediaId, idx) => {
    const focalPoint = ((mediaFocalPoints && mediaFocalPoints[idx]) || [0, 0]).slice() // copy: don't mutate stored data
    return {
      description: (mediaDescriptions && mediaDescriptions[idx]) || '',
      focalPoint: [focalPoint[0] || 0, focalPoint[1] || 0]
    }
  })
  // Mastodon only lets PUT /media/:id change media that isn't attached yet (404 otherwise), so an
  // edit has to send alt text and focal points along with the status.
  const mediaAttributes = editId
    ? (mediaIds || []).map((id, i) => {
        const attributes = { id, description: mediaMetadata[i].description }
        const rawFocalPoint = mediaFocalPoints && mediaFocalPoints[i]
        if (rawFocalPoint && (typeof rawFocalPoint[0] === 'number' || typeof rawFocalPoint[1] === 'number')) {
          attributes.focus = mediaMetadata[i].focalPoint.join(',') // only when set: "0,0" would re-center it
        }
        return attributes
      })
    : undefined

  store.set({ postingStatus: true })
  try {
    await Promise.all(mediaMetadata.map(async ({ description, focalPoint }, i) => {
      if (description || focalPoint[0] || focalPoint[1]) {
        // A failed metadata update (description / focal point) must not abort the whole post — the
        // media is already uploaded. Log it and post anyway.
        try {
          await putMediaMetadata(currentInstance, accessToken, mediaIds[i], description, focalPoint)
        } catch (e) {
          console.warn('failed to update media metadata; posting anyway', (e && e.message) || e)
        }
      }
    }))
    if (editId) {
      const status = await putStatusToServer(currentInstance, accessToken, editId, text,
        inReplyToId, mediaIds, sensitive, spoilerText, visibility, poll, contentType, quoteId, localOnly, mediaAttributes)
      await database.insertStatus(currentInstance, status)
      await rehydrateStatusOrNotification({ status })
      emit('statusUpdated', status)
      emit('postedStatus', { realm, inReplyToUuid }) // mitt passes a single payload
    } else {
      // One key per draft (stored with it, so it also survives a reload): a retry after a lost
      // response is recognised by the server instead of creating a duplicate post. Cleared together
      // with the draft once the post went out.
      let idempotencyKey = store.getComposeData(realm, 'idempotencyKey')
      if (!idempotencyKey) {
        idempotencyKey = randomToken()
        store.setComposeData(realm, { idempotencyKey })
        store.save() // persist before the request, so a retry after a reload reuses it
      }
      const result = await postStatusToServer(currentInstance, accessToken, text,
        inReplyToId, mediaIds, sensitive, spoilerText, visibility, poll, contentType, quoteId, localOnly, scheduledAt, idempotencyKey)
      if (scheduledAt) {
        // when scheduled, the server returns a ScheduledStatus (not a real status yet),
        // so don't add it to the timeline — just confirm it was scheduled
        /* no await */ toast.say('intl.scheduledStatusCreated')
      } else {
        addStatusOrNotification(currentInstance, 'home', result)
      }
      emit('postedStatus', { realm, inReplyToUuid }) // mitt passes a single payload
    }
    store.clearComposeData(realm)
    scheduleIdleTask(() => (mediaIds || []).forEach(mediaId => database.deleteCachedMediaFile(mediaId))) // clean up media cache
  } catch (e) {
    logActionError('post status', e)
    /* no await */ toast.say(formatIntl('intl.unableToPost', { error: (e.message || '') }))
  } finally {
    store.set({ postingStatus: false })
  }
}

export function setReplySpoiler (realm, spoiler) {
  const contentWarning = store.getComposeData(realm, 'contentWarning')
  const contentWarningShown = store.getComposeData(realm, 'contentWarningShown')
  if (typeof contentWarningShown !== 'undefined' || contentWarning) {
    return // user has already interacted with the CW
  }
  store.setComposeData(realm, {
    contentWarning: spoiler,
    contentWarningShown: true
  })
}

const PRIVACY_LEVEL = {
  direct: 1,
  private: 2,
  unlisted: 3,
  public: 4
}

export function setReplyVisibility (realm, replyVisibility) {
  // return the most private between the user's preferred default privacy
  // and the privacy of the status they're replying to
  const postPrivacy = store.getComposeData(realm, 'postPrivacy')
  if (typeof postPrivacy !== 'undefined') {
    return // user has already set the postPrivacy
  }
  const { currentVerifyCredentials, defaultUnlistedReplies } = store.get()
  // When the user opts in, default replies to "unlisted"; otherwise use their account default.
  // Either way we still cap at the replied-to status's privacy below, so a reply is never
  // more public than the post it answers.
  const defaultVisibility = defaultUnlistedReplies
    ? 'unlisted'
    : (currentVerifyCredentials.source.privacy || 'public')
  const visibility = PRIVACY_LEVEL[replyVisibility] < PRIVACY_LEVEL[defaultVisibility]
    ? replyVisibility
    : defaultVisibility
  store.setComposeData(realm, { postPrivacy: visibility })
}

export function applyDefaultLocalOnly (realm) {
  // Default new posts to local-only when the user opted in AND the instance supports it.
  // Don't override an explicit value (e.g. restored from edit/redraft, or already toggled).
  if (typeof store.getComposeData(realm, 'localOnly') !== 'undefined') {
    return
  }
  const { defaultLocalOnly, currentSupportedToggles } = store.get()
  if (defaultLocalOnly && currentSupportedToggles && currentSupportedToggles.local_only) {
    store.setComposeData(realm, { localOnly: true })
  }
}
