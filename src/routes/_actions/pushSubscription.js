import { getSubscription, deleteSubscription, postSubscription, putSubscription } from '../_api/pushSubscription.js'
import { store } from '../_store/store.js'
import { urlBase64ToUint8Array } from '../_utils/base64.js'

const dummyApplicationServerKey = 'BImgAz4cF_yvNFp8uoBJCaGpCX4d0atNIFMHfBvAAXCyrnn9IMAFQ10DW_ZvBCzGeR4fZI5FnEi2JVcRE-L88jY='

export async function updatePushSubscriptionForInstance (instanceName) {
  return store.runIfLoggedIn(instanceName, async ({ loggedInInstances, currentPushSubscription }) => {
    const accessToken = loggedInInstances[instanceName].access_token

    if (currentPushSubscription === null) {
      return
    }

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription === null) {
      store.setInstanceData(instanceName, 'pushSubscriptions', null)
      store.save()
      return
    }

    try {
      const backendSubscription = await getSubscription(instanceName, accessToken)

      // Check if applicationServerKey changed (need to get another subscription from the browser)
      if (btoa(urlBase64ToUint8Array(backendSubscription.server_key).buffer) !== btoa(subscription.options.applicationServerKey)) {
        await subscription.unsubscribe()
        await deleteSubscription(instanceName, accessToken)
        await updateAlerts(instanceName, currentPushSubscription.alerts)
      } else {
        store.setInstanceData(instanceName, 'pushSubscriptions', backendSubscription)
        store.save()
      }
    } catch (e) {
      // ajax.js throws `Error('Request failed: <status>')` with `err.status` set, so detect by status.
      if (e.status === 404) {
        // the backend no longer has this subscription → clean up locally
        await subscription.unsubscribe()
        store.setInstanceData(instanceName, 'pushSubscriptions', null)
        store.save()
      } else {
        // 401 (invalid token), network errors, etc. — best-effort background sync; log instead of
        // silently swallowing (and don't rethrow, so it can't become an uncaught rejection)
        console.error('failed to sync push subscription', e)
      }
    }
  })
}

// Fully turn off Web Push for an instance: unsubscribe the browser push subscription, delete it
// on the backend, and clear it from the store. Used by the "Notify me on this device" master
// toggle when switched off.
export async function disablePushForInstance (instanceName) {
  return store.runIfLoggedIn(instanceName, async ({ loggedInInstances }) => {
    const accessToken = loggedInInstances[instanceName].access_token

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      await subscription.unsubscribe()
    }
    try {
      await deleteSubscription(instanceName, accessToken)
    } catch (e) {
      // 404 = the backend already has no subscription; anything else is best-effort cleanup.
      if (e.status !== 404) {
        console.warn('failed to delete push subscription on backend', e)
      }
    }
    store.setInstanceData(instanceName, 'pushSubscriptions', null)
    store.save()
  })
}

export async function updateAlerts (instanceName, alerts) {
  return store.runIfLoggedIn(instanceName, async ({ loggedInInstances }) => {
    const accessToken = loggedInInstances[instanceName].access_token

    const registration = await navigator.serviceWorker.ready
    let subscription = await registration.pushManager.getSubscription()

    if (subscription === null) {
      // We need applicationServerKey in order to register a push subscription
      // but the API doesn't expose it as a constant (as it should).
      // So we need to register a subscription with a dummy applicationServerKey,
      // send it to the backend saves it and return applicationServerKey, which
      // we use to register a new subscription.
      // https://github.com/tootsuite/mastodon/issues/8785
      subscription = await registration.pushManager.subscribe({
        applicationServerKey: urlBase64ToUint8Array(dummyApplicationServerKey),
        userVisibleOnly: true
      })

      let backendSubscription = await postSubscription(instanceName, accessToken, subscription, alerts)

      await subscription.unsubscribe()

      subscription = await registration.pushManager.subscribe({
        applicationServerKey: urlBase64ToUint8Array(backendSubscription.server_key),
        userVisibleOnly: true
      })

      backendSubscription = await postSubscription(instanceName, accessToken, subscription, alerts)

      store.setInstanceData(instanceName, 'pushSubscriptions', backendSubscription)
      store.save()
    } else {
      try {
        const backendSubscription = await putSubscription(instanceName, accessToken, alerts)
        store.setInstanceData(instanceName, 'pushSubscriptions', backendSubscription)
        store.save()
      } catch (e) {
        const backendSubscription = await postSubscription(instanceName, accessToken, subscription, alerts)
        store.setInstanceData(instanceName, 'pushSubscriptions', backendSubscription)
        store.save()
      }
    }
  })
}
