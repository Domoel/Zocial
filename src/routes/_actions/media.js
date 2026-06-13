import { store } from '../_store/store.js'
import { uploadMedia } from '../_api/media.js'
import { toast } from '../_components/toast/toast.js'
import { scheduleIdleTask } from '../_utils/scheduleIdleTask.js'
import { formatIntl } from '../_utils/formatIntl.js'
import { database } from '../_database/database.js'

export async function doMediaUpload (realm, file) {
  const { currentInstance, accessToken, maxStatusMediaAttachments } = store.get()
  store.set({ uploadingMedia: true })
  try {
    let composeMedia = store.getComposeData(realm, 'media') || []
    if (composeMedia.length === maxStatusMediaAttachments) {
      throw new Error('Only ' + maxStatusMediaAttachments + ' media max are allowed')
    }
    const response = await uploadMedia(currentInstance, accessToken, file)
    composeMedia = store.getComposeData(realm, 'media') || []
    if (composeMedia.length === maxStatusMediaAttachments) {
      throw new Error('Only ' + maxStatusMediaAttachments + ' media max are allowed')
    }
    await database.setCachedMediaFile(response.id, file)
    composeMedia.push({
      data: response,
      file: { name: file.name },
      description: ''
    })
    store.setComposeData(realm, {
      media: composeMedia
    })
    scheduleIdleTask(() => store.save())
  } catch (e) {
    console.error(e)
    /* no await */ toast.say(formatIntl('intl.failedToUploadMedia', { error: (e.message || '') }))
  } finally {
    store.set({ uploadingMedia: false })
  }
}

export function deleteMedia (realm, i) {
  const composeMedia = store.getComposeData(realm, 'media')
  const removed = composeMedia[i]
  composeMedia.splice(i, 1)

  store.setComposeData(realm, {
    media: composeMedia
  })
  // Drop the cached blob for the removed attachment so it doesn't orphan in IndexedDB (only
  // postStatus cleaned these up before). Safe if there was no cached file (e.g. redrafted media) —
  // the delete is a no-op then.
  if (removed && removed.data && removed.data.id) {
    scheduleIdleTask(() => database.deleteCachedMediaFile(removed.data.id))
  }
  if (!composeMedia.length) {
    const contentWarningShown = store.getComposeData(realm, 'contentWarningShown')
    const contentWarning = store.getComposeData(realm, 'contentWarning')
    store.setComposeData(realm, {
      sensitive: contentWarningShown && contentWarning // reset sensitive if the last media is deleted
    })
  }
  scheduleIdleTask(() => store.save())
}
