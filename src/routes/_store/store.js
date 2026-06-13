import { observers } from './observers/observers.js'
import { computations } from './computations/computations.js'
import { mixins } from './mixins/mixins.js'
import { LocalStorageStore } from './LocalStorageStore.js'
import { observe } from 'svelte-extras'
import { isKaiOS } from '../_utils/userAgent/isKaiOS.js'

const persistedState = {
  alwaysShowFocusRing: false,
  autoplayGifs: !(
    !ZOCIAL_IS_BROWSER || matchMedia('(prefers-reduced-motion: reduce)').matches
  ),
  composeData: {},
  currentInstance: null,
  currentRegisteredInstanceName: undefined,
  currentRegisteredInstance: undefined,
  // OAuth CSRF token: generated before redirecting to the instance's authorize endpoint and
  // verified against the `state` query param on the callback. Persisted so it survives the
  // full-page redirect round-trip. See _actions/addInstance.js.
  currentRegisteredInstanceState: undefined,
  // we disable scrollbars by default on iOS
  disableCustomScrollbars:
    ZOCIAL_IS_BROWSER && /iP(?:hone|ad|od)/.test(navigator.userAgent),
  bottomNav: false,
  centerNav: true,
  // When true, replies default to "unlisted" visibility (never more public than the
  // post being replied to). See setReplyVisibility() in _actions/compose.js.
  defaultUnlistedReplies: false,
  // When true, new posts default to local-only (on instances that support it). See
  // applyDefaultLocalOnly() in _actions/compose.js.
  defaultLocalOnly: false,
  enableQuotePost: false,
  disableFollowRequestCount: false,
  hideLongPosts: true,
  longPostLength: 1024,
  disableFavCounts: false,
  disableFollowerCounts: false,
  disableHotkeys: false,
  disableInfiniteScroll: false,
  disableLongAriaLabels: false,
  announceCardDescriptions: false,
  disableNotificationBadge: false,
  // Per-instance push-intent flag ({ [instanceName]: true }). Was a single global boolean until
  // v1.8.4 — see the migration after the store is constructed. Per-instance so enabling/disabling
  // (or a failure on) push for one account never affects another.
  enableDesktopNotifications: {},
  // Per-instance flag: have we already shown the one-time "enable OS notifications?" login
  // prompt for this account? Persisted so we ask at most once per account.
  osNotificationPrompted: {},
  enableThreadPolling: true,
  disableNotificationSound: (() => {
    try {
      return localStorage.getItem('store_disableNotificationBadge') === 'true'
    } catch (e) {
      return false
    }
  })(),
  disableReblogCounts: false,
  disableReplyCounts: false,
  disableRelativeTimestamps: false,
  disableTapOnStatus: false,
  enableGrayscale: false,
  hideCards: false,
  leftRightChangesFocus: isKaiOS(),
  instanceNameInSearch: '',
  instanceThemes: {},
  instanceSettings: {},
  loggedInInstances: {},
  loggedInInstancesInOrder: [],
  markMediaAsSensitive: false,
  showAllSpoilers: false,
  neverMarkMediaAsSensitive: false,
  ignoreBlurhash: false,
  omitEmojiInDisplayNames: undefined,
  pinnedPages: {},
  navTabOrder: {},
  pushSubscriptions: {},
  lastPushAlerts: {},
  // Per-instance count of consecutive silent push re-registration failures. Used to give up on
  // push (turn the master toggle off) after a threshold, so a permanently-broken push service
  // doesn't leave the toggle stuck "on". Reset to 0 on any successful registration.
  pushFailureCount: {},
  lastPings: {},
  reduceMotion:
    !ZOCIAL_IS_BROWSER || matchMedia('(prefers-reduced-motion: reduce)').matches,
  underlineLinks: true,
  // Logs page: when false (default) only error/warn lines are shown; when true, all
  // captured log levels (info/log/debug/…) are shown too. Persisted like other UI prefs.
  showAllLogs: false,
  lastContentTypes: {},
  translationTargetLanguage: null,
  translationLanguages: {}
}

const nonPersistedState = {
  instanceFollowedHashtags: {},
  customEmoji: {},
  unexpiredInstanceFilters: {},
  followRequestCounts: {},
  instanceInfos: {},
  instanceLists: {},
  instanceListsSupported: {},
  instanceFilters: {},
  online: !ZOCIAL_IS_BROWSER || navigator.onLine,
  pinnedStatuses: {},
  // cache of profile posting-stats (original/replies/boosts) keyed by `instance/accountId`,
  // so switching account tabs (separate routes) reuses the result instead of refetching and
  // flickering the bar in/out. Not persisted.
  postingStatsByAccount: {},
  polls: {},
  pushNotificationsSupport:
    ZOCIAL_IS_BROWSER &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'getKey' in PushSubscription.prototype,
  queryInSearch: '',
  repliesShown: {},
  sensitivesShown: {},
  spoilersShown: {},
  statusModifications: {},
  verifyCredentials: {},
  statusTranslationContents: {},
  statusTranslations: {},
  instanceDataReady: {},
  translationLanguagesFetched: {},
  // Number of mounted Timeline components. Used to gate the 60s polling fallback so it only
  // runs while the user is actually viewing a timeline (not on settings/profile/etc.). A count
  // (rather than a boolean) stays correct even if a new Timeline mounts before the old one is
  // destroyed during a route transition.
  mountedTimelines: 0
}

const state = Object.assign({}, persistedState, nonPersistedState)
export const keysToStoreInLocalStorage = new Set(Object.keys(persistedState))

export class PinaforeStore extends LocalStorageStore {
  constructor (state) {
    super(state, keysToStoreInLocalStorage)
  }

  runIfLoggedIn (instanceName, callback) {
    const state = this.get()
    if (instanceName && state.loggedInInstances[instanceName]) {
      return callback(state)
    }
  }
}

PinaforeStore.prototype.observe = observe

export const store = new PinaforeStore(state)

// Migration: `enableDesktopNotifications` used to be a single global boolean; it is now a
// per-instance map. Convert a legacy boolean once. A global `true` applied to whichever accounts
// actually had a push subscription, so seed those; anything else becomes an empty map. After this
// runs the persisted value is an object, so subsequent loads skip it.
if (ZOCIAL_IS_BROWSER) {
  const legacy = store.get().enableDesktopNotifications
  if (typeof legacy !== 'object' || legacy === null) {
    const migrated = {}
    if (legacy === true) {
      const subs = store.get().pushSubscriptions || {}
      for (const name of Object.keys(subs)) {
        if (subs[name]) {
          migrated[name] = true
        }
      }
    }
    store.set({ enableDesktopNotifications: migrated })
    store.save()
  }
}

mixins(PinaforeStore)
computations(store)
observers(store)

if (ZOCIAL_IS_BROWSER) {
  window.__store = store // for debugging
}
