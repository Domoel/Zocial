import { updateInstanceInfo, updateVerifyCredentialsForInstance, updateNodeInfoForInstance } from '../../_actions/instances.js'
import { setupListsForInstance } from '../../_actions/lists.js'
import { setupFollowedHashtagsForInstance } from '../../_actions/followedTags.js'
import { createStream } from '../../_actions/stream/streaming.js'
import { updatePushSubscriptionForInstance } from '../../_actions/pushSubscription.js'
import { setupCustomEmojiForInstance } from '../../_actions/emoji.js'
import { fetchTranslationLanguages } from '../../_actions/fetchTranslationLanguages.js'
import { scheduleIdleTask } from '../../_utils/scheduleIdleTask.js'
import { mark, stop } from '../../_utils/marks.js'
import { store } from '../store.js'
import { updateFollowRequestCountIfLockedAccount } from '../../_actions/followRequests.js'
import { setupFiltersForInstance } from '../../_actions/filters.js'
import { getStreamingApi } from '../../_api/utils.js'

// stream to watch for home timeline updates and notifications
let currentInstanceStream

// Background instance refreshes are best-effort. A failure (e.g. a 429 rate-limit from the
// instance, or a network blip) must not surface as an uncaught promise rejection — log it quietly.
const ignoreRefreshError = e => console.warn('instance refresh failed', e)

async function refreshInstanceDataAndStream (store, instanceName) {
  mark(`refreshInstanceDataAndStream-${instanceName}`)
  await doRefreshInstanceDataAndStream(store, instanceName)
  stop(`refreshInstanceDataAndStream-${instanceName}`)
}

function currentInstanceChanged (store, instanceName) {
  return store.get().currentInstance !== instanceName
}

async function doRefreshInstanceDataAndStream (store, instanceName) {
  if (currentInstanceChanged(store, instanceName)) {
    return
  }

  await refreshInstanceData(instanceName)

  if (currentInstanceChanged(store, instanceName)) {
    return
  }

  const { currentInstanceInfo } = store.get()
  if (!currentInstanceInfo) {
    return
  }

  stream(store, instanceName, currentInstanceInfo)
}

async function refreshInstanceData (instanceName) {
  // these are all low-priority
  scheduleIdleTask(() => setupCustomEmojiForInstance(instanceName).catch(ignoreRefreshError))
  scheduleIdleTask(() => setupListsForInstance(instanceName).catch(ignoreRefreshError))
  scheduleIdleTask(() => setupFollowedHashtagsForInstance(instanceName).catch(ignoreRefreshError))
  scheduleIdleTask(() => setupFiltersForInstance(instanceName).catch(ignoreRefreshError))
  scheduleIdleTask(() => updatePushSubscriptionForInstance(instanceName).catch(ignoreRefreshError))
  scheduleIdleTask(() => updateNodeInfoForInstance(instanceName).catch(ignoreRefreshError))
  scheduleIdleTask(() => fetchTranslationLanguages().catch(ignoreRefreshError))

  // these are the only critical ones
  const ready = Promise.all([
    updateInstanceInfo(instanceName),
    updateVerifyCredentialsForInstance(instanceName).then(() => {
      // Once we have the verifyCredentials (so we know if the account is locked), lazily update the follow requests
      scheduleIdleTask(() => updateFollowRequestCountIfLockedAccount(instanceName).catch(ignoreRefreshError))
    })
  ])
  store.setInstanceData(instanceName, 'instanceDataReady', ready)
  await ready
}

function stream (store, instanceName, currentInstanceInfo) {
  const { accessToken } = store.get()
  const streamingApi = getStreamingApi(currentInstanceInfo)
  const firstStatusId = store.getFirstTimelineItemId(instanceName, 'home')
  const firstNotificationId = store.getFirstTimelineItemId(instanceName, 'notifications')

  currentInstanceStream = createStream(streamingApi, instanceName, accessToken, 'home',
    firstStatusId, firstNotificationId)

  if (process.env.NODE_ENV !== 'production') {
    window.currentInstanceStream = currentInstanceStream
  }
}

export function instanceObservers () {
  store.observe('currentInstance', async (currentInstance) => {
    if (!ZOCIAL_IS_BROWSER) {
      return
    }
    if (currentInstanceStream) {
      currentInstanceStream.close()
      currentInstanceStream = null
      if (process.env.NODE_ENV !== 'production') {
        window.currentInstanceStream = null
      }
    }
    if (!currentInstance) {
      return
    }

    // floating on purpose, but guard it so a failed critical refresh (instanceInfo /
    // verifyCredentials, e.g. on a 429 rate-limit) can't become an uncaught rejection
    refreshInstanceDataAndStream(store, currentInstance).catch(ignoreRefreshError)
  })
}
