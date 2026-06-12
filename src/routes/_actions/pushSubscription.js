import { getSubscription, deleteSubscription, postSubscription, putSubscription } from '../_api/pushSubscription.js'
import { store } from '../_store/store.js'
import { urlBase64ToUint8Array } from '../_utils/base64.js'
import { ALL_PUSH_ALERTS } from '../_static/pushAlerts.js'

const dummyApplicationServerKey = 'BImgAz4cF_yvNFp8uoBJCaGpCX4d0atNIFMHfBvAAXCyrnn9IMAFQ10DW_ZvBCzGeR4fZI5FnEi2JVcRE-L88jY='

export async function updatePushSubscriptionForInstance (instanceName) {
  return store.runIfLoggedIn(instanceName, async ({ loggedInInstances, currentPushSubscription }) => {
    const accessToken = loggedInInstances[instanceName].access_token

    // OS permission was revoked since we were last enabled. Nothing can deliver an OS notification
    // anymore (System A checks permission, System B won't receive pushes), so reconcile the stored
    // state with reality and stop — there is nothing useful to sync. Clear enableDesktopNotifications
    // and drop any stored subscription (best-effort browser unsubscribe; most browsers already
    // revoked it, but some keep it, which would otherwise leave the master toggle showing "on" via
    // the `enabled` computed). The settings UI also surfaces a "denied" alert via the
    // notificationPermission observer.
    if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
      const { enableDesktopNotifications } = store.get()
      // Nothing left to reconcile (already cleaned up on a previous load) — avoid a redundant write.
      if (enableDesktopNotifications || currentPushSubscription) {
        store.set({ enableDesktopNotifications: false })
        if (currentPushSubscription) {
          store.setInstanceData(instanceName, 'pushSubscriptions', null)
          try {
            const registration = await navigator.serviceWorker.ready
            const sub = await registration.pushManager.getSubscription()
            if (sub) {
              await sub.unsubscribe()
            }
          } catch (_) {
            // best-effort: the subscription is dead anyway with permission denied
          }
        }
        store.save()
      }
      return
    }

    if (currentPushSubscription === null) {
      // No stored subscription. If the user had notifications on and push is still available,
      // silently re-register so the UI stays consistent after a subscription loss (e.g. browser
      // cleared it after a SW update). Only attempt if permission is already granted — we never
      // prompt here.
      if (canSilentlyReregister()) {
        try {
          await updateAlerts(instanceName, getSavedAlerts(instanceName))
        } catch (e) {
          // Re-registration failed. Count it; after a threshold (or a permanent error) push is
          // given up on and the master toggle is turned off (recordPushFailure).
          await recordPushFailure(instanceName, e)
        }
      }
      return
    }

    const registration = await navigator.serviceWorker.ready
    let subscription
    try {
      subscription = await registration.pushManager.getSubscription()
    } catch (e) {
      // DOMException from pushManager.getSubscription() — expected on iOS Safari when the app is
      // not installed as a PWA (push requires Home Screen installation on iOS). Treat as "no
      // subscription" and clean up locally.
      console.warn('pushManager.getSubscription() failed, clearing local subscription', describeDOMException(e))
      store.setInstanceData(instanceName, 'pushSubscriptions', null)
      store.save()
      return
    }

    if (subscription === null) {
      // Browser subscription lost — most commonly after a service worker update. If conditions
      // allow, re-register silently with the previously saved alert preferences.
      if (canSilentlyReregister()) {
        try {
          await updateAlerts(instanceName, getSavedAlerts(instanceName))
          return
        } catch (e) {
          if (await recordPushFailure(instanceName, e)) {
            return // gave up on push — markPushUnavailable already cleaned up
          }
          // Transient: fall through to clear the stale sub; the null-subscription branch retries
          // on the next load (the failure count persists across loads).
        }
      }
      store.setInstanceData(instanceName, 'pushSubscriptions', null)
      store.save()
      return
    }

    try {
      const backendSubscription = await getSubscription(instanceName, accessToken)

      // Check if applicationServerKey changed (need to get another subscription from the browser).
      // Both keys are binary; compare them byte-for-byte. (The old `btoa(arrayBuffer)` comparison
      // was a no-op — btoa() stringifies any ArrayBuffer to "[object ArrayBuffer]", so the two
      // sides were always equal and a rotated VAPID key was never picked up.)
      const serverKey = urlBase64ToUint8Array(backendSubscription.server_key)
      if (!binaryKeysEqual(serverKey, subscription.options.applicationServerKey)) {
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
      } else if (e instanceof DOMException) {
        // pushManager.subscribe() / unsubscribe() can throw on mobile (NotSupportedError on iOS
        // browser tabs, NotAllowedError when permission revoked, AbortError/InvalidStateError on
        // transient SW timing issues). All are expected — warn, don't error.
        console.warn('push subscription sync failed (browser/platform limitation)', describeDOMException(e))
      } else {
        // 401 (invalid token), network errors, etc. — best-effort background sync
        console.warn('failed to sync push subscription', e)
      }
    }
  })
}

// True when a silent push re-registration attempt is worthwhile: the user has already granted
// notification permission, push is supported in this browser, and desktop notifications were
// explicitly enabled by the user.
function canSilentlyReregister () {
  const { pushNotificationsSupport, enableDesktopNotifications } = store.get()
  return (
    pushNotificationsSupport &&
    enableDesktopNotifications &&
    typeof Notification !== 'undefined' &&
    Notification.permission === 'granted'
  )
}

// Byte-for-byte equality for two VAPID keys. Each argument may be an ArrayBuffer, a TypedArray,
// or null/undefined (a subscription created without an applicationServerKey). Normalises both to
// Uint8Array views before comparing, so a Uint8Array and the ArrayBuffer it came from compare equal.
function binaryKeysEqual (a, b) {
  if (!a || !b) {
    return a === b
  }
  const ua = a instanceof Uint8Array ? a : new Uint8Array(a)
  const ub = b instanceof Uint8Array ? b : new Uint8Array(b)
  if (ua.length !== ub.length) {
    return false
  }
  for (let i = 0; i < ua.length; i++) {
    if (ua[i] !== ub[i]) {
      return false
    }
  }
  return true
}

// Returns the last saved per-type alert config for an instance, falling back to ALL_PUSH_ALERTS.
function getSavedAlerts (instanceName) {
  const { lastPushAlerts } = store.get()
  return (lastPushAlerts && lastPushAlerts[instanceName]) || ALL_PUSH_ALERTS
}

// DOMException serialises as {} with console.error/JSON.stringify (properties are inherited, not own).
export function describeDOMException (e) {
  if (e instanceof DOMException) {
    return e.name + (e.message ? ': ' + e.message : '')
  }
  return String(e)
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
    store.set({ enableDesktopNotifications: false })
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
      savePushAlerts(instanceName, alerts)
      store.save()
    } else {
      try {
        const backendSubscription = await putSubscription(instanceName, accessToken, alerts)
        store.setInstanceData(instanceName, 'pushSubscriptions', backendSubscription)
        savePushAlerts(instanceName, alerts)
        store.save()
      } catch (e) {
        const backendSubscription = await postSubscription(instanceName, accessToken, subscription, alerts)
        store.setInstanceData(instanceName, 'pushSubscriptions', backendSubscription)
        savePushAlerts(instanceName, alerts)
        store.save()
      }
    }
  })
}

// Persist the alert config AND clear the failure counter — saving alerts only happens after a
// successful (re-)registration, so any prior failure streak is over.
function savePushAlerts (instanceName, alerts) {
  const { lastPushAlerts, pushFailureCount } = store.get()
  const update = { lastPushAlerts: Object.assign({}, lastPushAlerts, { [instanceName]: alerts }) }
  if (pushFailureCount && pushFailureCount[instanceName]) {
    update.pushFailureCount = Object.assign({}, pushFailureCount)
    delete update.pushFailureCount[instanceName]
  }
  store.set(update)
}

// How many consecutive silent re-registration failures before we conclude push is dead.
const PUSH_FAILURE_THRESHOLD = 3

// Errors that mean push fundamentally can't work on this device/server (no point retrying).
function isPermanentPushError (e) {
  return e instanceof DOMException && e.name === 'NotSupportedError'
}

// Push has failed for good: drop the subscription and clear the intent flag so the master toggle
// honestly shows "off", and reset the counter. Best-effort browser unsubscribe.
async function markPushUnavailable (instanceName) {
  const { pushFailureCount } = store.get()
  const nextCount = Object.assign({}, pushFailureCount)
  delete nextCount[instanceName]
  store.setInstanceData(instanceName, 'pushSubscriptions', null)
  store.set({ enableDesktopNotifications: false, pushFailureCount: nextCount })
  store.save()
  try {
    const registration = await navigator.serviceWorker.ready
    const sub = await registration.pushManager.getSubscription()
    if (sub) {
      await sub.unsubscribe()
    }
  } catch (_) {
    // best-effort — push is being abandoned anyway
  }
}

// Record a failed silent re-registration. Returns true if push has now been given up on (caller
// should stop). A permanent error gives up immediately; otherwise we tolerate up to
// PUSH_FAILURE_THRESHOLD consecutive failures (transient blips heal via savePushAlerts' reset).
async function recordPushFailure (instanceName, e) {
  if (isPermanentPushError(e)) {
    await markPushUnavailable(instanceName)
    return true
  }
  const { pushFailureCount } = store.get()
  const count = ((pushFailureCount && pushFailureCount[instanceName]) || 0) + 1
  if (count >= PUSH_FAILURE_THRESHOLD) {
    await markPushUnavailable(instanceName)
    return true
  }
  store.set({ pushFailureCount: Object.assign({}, pushFailureCount, { [instanceName]: count }) })
  store.save()
  return false
}

// Enable OS push notifications for an instance: request permission and, when granted, register
// Web Push. OS notifications are push-only, so the intent flag `enableDesktopNotifications` is set
// ONLY when registration actually succeeds — a failure leaves it off so the master toggle never
// falsely shows "on". Returns `{ permission, pushError, pushUnsupported }`:
//   - permission: 'granted' | 'denied' | 'default' | 'unsupported'
//   - pushUnsupported: true when the browser can't do Web Push at all (nothing to enable)
//   - pushError: the registration error when push is supported but registration failed
// Shared by the settings master toggle and the one-time login prompt.
export async function enableOSNotificationsForInstance (instanceName) {
  if (typeof Notification === 'undefined') {
    return { permission: 'unsupported' }
  }
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return { permission }
  }
  const { pushNotificationsSupport } = store.get()
  if (!pushNotificationsSupport) {
    // No Web Push in this browser — with OS notifications now push-only there is nothing to turn
    // on. Don't set the intent flag; let the caller explain.
    return { permission, pushUnsupported: true }
  }
  try {
    await updateAlerts(instanceName, ALL_PUSH_ALERTS)
  } catch (e) {
    // Registration failed — leave the flag off so the toggle reflects reality.
    return { permission, pushError: e }
  }
  store.set({ enableDesktopNotifications: true })
  store.save()
  return { permission, pushError: null }
}
