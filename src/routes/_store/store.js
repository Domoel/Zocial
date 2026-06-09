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
  enableDesktopNotifications: false,
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
  lastPings: {},
  reduceMotion:
    !ZOCIAL_IS_BROWSER || matchMedia('(prefers-reduced-motion: reduce)').matches,
  underlineLinks: true,
  // Logs page: when false (default) only error/warn lines are shown; when true, all
  // captured log levels (info/log/debug/…) are shown too. Persisted like other UI prefs.
  showAllLogs: false,
  lastContentTypes: {}
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
  instanceDataReady: {}
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

mixins(PinaforeStore)
computations(store)
observers(store)

if (ZOCIAL_IS_BROWSER) {
  window.__store = store // for debugging
}
