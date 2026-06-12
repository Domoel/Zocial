# Architecture

Developer reference for the Zocial codebase. Covers the full "lay of the land" — structure, data flow, non-obvious behaviour, and the reasoning behind deliberate design decisions. Inline code comments cover single-line WHYs; this document covers everything that needs more than one sentence.

---

## Table of Contents

1. [Technology Stack](#1-technology-stack)
2. [Why Svelte v2 / Sapper?](#2-why-svelte-v2--sapper)
3. [Directory Structure](#3-directory-structure)
4. [Build System](#4-build-system)
5. [Routing & Page Architecture](#5-routing--page-architecture)
6. [State Management](#6-state-management)
   - [PinaforeStore](#pinaforestore)
   - [Persisted vs. non-persisted state](#persisted-vs-non-persisted-state)
   - [Computations](#computations)
   - [Observers](#observers)
   - [Mixins](#mixins)
7. [Database Layer](#7-database-layer)
8. [API Layer](#8-api-layer)
   - [HTTP client (`ajax.js`)](#http-client-ajaxjs)
   - [Error classification](#error-classification)
   - [Endpoint modules](#endpoint-modules)
9. [WebSocket Streaming](#9-websocket-streaming)
   - [TimelineStream](#timelinestream)
   - [Lifecycle integration](#lifecycle-integration)
10. [Component Architecture](#10-component-architecture)
    - [Virtual list](#virtual-list)
    - [Timeline](#timeline)
    - [Status](#status)
    - [Compose](#compose)
    - [Dialogs](#dialogs)
11. [Actions Layer](#11-actions-layer)
12. [Timeline System](#12-timeline-system)
    - [Timeline types](#timeline-types)
    - [Permanent background stream (home / notifications)](#permanent-background-stream-home--notifications)
    - [Active-only timelines (stream + 60 s poll)](#active-only-timelines-stream--60-s-poll)
    - [setupTimeline — when does a fetch happen?](#setuptimeline--when-does-a-fetch-happen)
    - [Fresh fetch vs. pagination](#fresh-fetch-vs-pagination)
    - [Sort order and ID helpers](#sort-order-and-id-helpers)
    - [New-post buffer and scroll awareness](#new-post-buffer-and-scroll-awareness)
    - [List timeline error handling](#list-timeline-error-handling)
13. [Translation System](#13-translation-system)
14. [Svelte 2 Template Syntax Constraints](#14-svelte-2-template-syntax-constraints)
15. [Internationalization](#15-internationalization)
16. [Service Worker & Offline](#16-service-worker--offline)
17. [Quote Posts](#17-quote-posts)
18. [Notification System](#18-notification-system)
19. [Log System](#19-log-system)
20. [Design Decisions Log](#20-design-decisions-log)
21. [Version History](#21-version-history)

---

## 1. Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| UI framework | Svelte v2.16.1 | No upgrade path to v3 — see §2 |
| SSR / routing | Sapper (Anthropic fork) | Outputs a static site |
| Bundler | Webpack 5 + esbuild-loader | esbuild for JS transpilation, CSS extraction via mini-css-extract |
| Language | JavaScript + TypeScript | `.ts` only in utils/db layers; templates are `.html` |
| Package manager | pnpm 9.4+ | |
| Database | IndexedDB | Per-instance, one IDB per logged-in account |
| Styling | SCSS (global) + vanilla CSS (components) | SCSS preprocessor not wired into Svelte component pipeline |
| Streaming | WebSocket | Auto-reconnect, freeze-aware (Page Lifecycle API) |
| Translation | LibreTranslate (self-hosted by default) | Backend configurable in settings |
| Push notifications | Web Push API | Via service worker |
| OCR | Tesseract.js | Lazy-loaded, for image alt-text extraction |
| Math rendering | KaTeX | Lazy-loaded |
| Emoji picker | emoji-picker-element (Svelte 3) | Loaded as a bundled custom element — see §10 |

---

## 2. Why Svelte v2 / Sapper?

There is [no upgrade path from Svelte v2 to v3](https://github.com/sveltejs/svelte/issues/2462). Migrating every component manually would be enormous work for no user-visible improvement (only DX). Similarly, Sapper → SvelteKit would require substantial work while the static-export output is essentially the same.

Zocial therefore remains on Svelte 2 and Sapper indefinitely. The [v2 Svelte docs](https://v2.svelte.dev/) are still online and share many concepts with v3. See §14 for the resulting syntax constraints.

---

## 3. Directory Structure

```
/
├── bin/                    Build scripts (template injection, asset pipeline, SVG sprites)
├── docs/                   Documentation (this file, guides, screenshots)
├── docker/                 Docker configuration
├── src/
│   ├── client.js           Client-side bootstrap (Sapper client, polyfills)
│   ├── server.js           Express server for sapper export
│   ├── service-worker.js   Offline caching, push notifications
│   ├── global.d.ts         Global TypeScript declarations (e.g. ZOCIAL_IS_BROWSER)
│   ├── build/              Build-time helpers
│   ├── inline-script/      Scripts injected inline into template.html at build time
│   ├── intl/               Locale files (en-US.js is source of truth)
│   ├── scss/               Global styles and themes
│   ├── thirdparty/         Vendored/forked libraries (websocket, lodash, timeago, autosize)
│   └── routes/             All Sapper pages and shared code
│       ├── _api/           Mastodon API endpoints + HTTP + WebSocket client
│       ├── _actions/       Pure functions: state mutations, API orchestration, side-effects
│       ├── _components/    Svelte UI components
│       ├── _database/      IndexedDB layer (per-instance)
│       ├── _pages/         Actual page components (see §5)
│       ├── _static/        Constants, config, metadata
│       ├── _store/         State management (store, computations, observers, mixins)
│       └── _utils/         Utilities (DOM, async, text, formatting, etc.)
├── static/                 Static assets served as-is (fonts, icons)
├── webpack/                Webpack configuration files
└── __sapper__/             Build output (not committed)
```

### Lots of small files

The codebase is highly modular — many single-function files. This aids tree-shaking, code-splitting, and avoids circular dependency issues. When in doubt, put new logic in its own file.

---

## 4. Build System

### Pipeline overview

1. **`before-build`** (runs in parallel):
   - `build-template-html` — Injects inline scripts, CSS, and SVGs into `template.html`.
   - `build-assets` — Optimises static assets.
   - `build-webpack-config` — Generates the final webpack config.

2. **`sapper-export`** — Webpack bundles the app (client + server + service-worker), then Sapper crawls and pre-renders every route as static HTML.

Output lands in `__sapper__/`.

### Webpack configs

- `webpack/client.config.js` — Client bundle with code-splitting, CSS extraction, and asset hashing.
- `webpack/server.config.js` — Server-side bundle used only during SSR / Sapper export.
- `webpack/service-worker.config.js` — Standalone SW bundle.
- `webpack/shared.config.js` — Common resolve aliases, version injection, theme-color inlining.

### `svelte-intl-loader`

A custom webpack loader that transforms `'intl.KEY'` string literals at build time into efficient format-message AST objects. See §15 for usage rules.

### Third-party code is vendored

`autosize` and `timeago` are forked and bundled inside `src/thirdparty/`. This was either to tweak behaviour or trim unused code where contributing back wasn't practical.

---

## 5. Routing & Page Architecture

### Sapper routing

Routes live in `src/routes/`. Every `.html` file at the top level maps to a URL. Dynamic segments use `[param]` in filenames.

### Lazy page duplication

**Every page is duplicated.** The file in `src/routes/` is only a thin lazy-loader; the actual page component lives in `src/routes/_pages/`.

```
src/routes/home.html          ← lazy loader, delays a few frames
src/routes/_pages/home.html   ← actual page component
```

The delay lets the nav-bar column animation finish before the page renders. Without it, the animation and the page load fight for resources and the transition looks janky.

### Navigation & animation

`_layout.html` is the app shell. It hosts the nav sidebar and manages swipe/slide animations between columns. Each column change triggers a CSS transition; the lazy-page delay is what makes the timing work.

---

## 6. State Management

### PinaforeStore

`src/routes/_store/store.js` defines `PinaforeStore`, which extends `LocalStorageStore` (a custom Svelte Store). The single `store` instance is the source of truth for all app state.

Every component that needs store state imports `store` directly — there is no Svelte store inheritance. Components declare `{ store }` explicitly.

```javascript
// Svelte 2 component accessing store
<script>
  import { store } from '../_store/store.js'
</script>
```

After construction, three things run against the store:

```javascript
mixins(PinaforeStore)   // add methods to the prototype
computations(store)     // register derived reactive properties
observers(store)        // register reactive side-effects
```

The store is exposed as `window.__store` in development for easy debugging in the browser console.

### Persisted vs. non-persisted state

State is split into two objects at startup:

**Persisted** (`persistedState`) — Written to `localStorage` on every change and restored on startup. Includes all user preferences and session data:
- `currentInstance`, `loggedInInstances`, `loggedInInstancesInOrder`
- All UI toggles: `autoplayGifs`, `disableCustomScrollbars`, `hideCards`, `reduceMotion`, `underlineLinks`, …
- Accessibility options: `disableLongAriaLabels`, `omitEmojiInDisplayNames`, `alwaysShowFocusRing`, …
- Feature flags: `enableQuotePost`, `defaultUnlistedReplies`, `defaultLocalOnly`, …
- `composeData` — Unsent compose content, persisted so refreshing doesn't lose a draft.
- `translationTargetLanguage`, `translationLanguages`

**Non-persisted** (`nonPersistedState`) — In-memory only, reset on every page load:
- `instanceInfos`, `customEmoji`, `instanceFilters`, `instanceLists` — fetched fresh each login
- `polls`, `verifyCredentials`, `repliesShown`, `sensitivesShown` — ephemeral UI state
- `online` — live navigator.onLine status
- `statusTranslations`, `statusTranslationContents` — translation results
- `mountedTimelines` — count of mounted Timeline components (guards the 60 s poll)

### Computations

Files in `src/routes/_store/computations/`. Computed values are derived from store state reactively — when dependencies change, the computed value updates automatically.

Key computation files:
- `instanceComputations.js` — Instance-dependent derived state (current instance info, streaming API URL, capabilities)
- `timelineComputations.js`, `timelineFilterComputations.js` — Timeline metadata and filtered views
- `navComputations.js` — Navigation structure, pinned pages, badge counts
- `loggedInComputations.js` — Login state, current user
- `badgeComputations.js` — Notification and follow-request badge counts

### Observers

Files in `src/routes/_store/observers/`. Observers react to store state changes and trigger side-effects. They are the "reactive glue" between state and the outside world (WebSockets, browser APIs, etc.).

Key observers:
- `instanceObservers.js` — Opens the permanent home/notifications WebSocket when `currentInstance` changes.
- `timelineObservers.js` — Opens/closes the active-timeline WebSocket when `currentTimeline` changes; runs the 60 s poll fallback.
- `notificationObservers.js` — Desktop notification dispatch.
- `wordFilterObservers.js` — Re-applies word filters when they change.
- `pageVisibilityObservers.js`, `themeObservers.js`, `resizeObservers.js` — Browser API integrations.
- `customEmojiObservers.js` — Refreshes custom emoji on instance switch.

### Mixins

Files in `src/routes/_store/mixins/`. Mixins add methods directly to `PinaforeStore.prototype`. These are the "verbs" of the store — things you actively do, not things that are derived.

- `instanceMixins.js` — `setInstanceData`, `getForTimeline`, `setForTimeline`, etc.
- `timelineMixins.js` — `setForCurrentTimeline`, `getFirstTimelineItemId`, `getLastTimelineItemId`
- `statusMixins.js` — Status/notification state helpers
- `composeMixins.js` — Compose dialog state
- `autosuggestMixins.js` — Autocomplete state

---

## 7. Database Layer

**Location:** `src/routes/_database/`

### Design

One IndexedDB database per logged-in instance (keyed by instance hostname). This isolates all cached data per account and allows switching accounts without data contamination.

### Async proxy pattern

`database.js` re-exports `asyncDatabase.js`, which is a lazy proxy. The actual database module is only imported the first time a method is called — typically the first time a timeline needs to read or write. This avoids loading IndexedDB code before the user is logged in.

### Lifecycle

`databaseLifecycle.ts` manages IDB connection creation and migration:
- Opens a connection with `indexedDB.open(instanceName, version)`.
- Applies incremental migrations via a versioned `migrations` array — each migration function receives `(db, tx, next)` and calls `next()` when done.
- Caches open connections in `databaseCache` so repeated calls are fast.

Connections are closed when the page is frozen (Page Lifecycle API) to prevent locks from blocking background tabs.

### Storage layout

The database stores:
- **Statuses** — Full status objects (used by all timelines)
- **Notifications** — Notification objects
- **Timeline item lists** — Ordered references (IDs) for each named timeline, enabling pagination
- **Accounts** — Cached account objects
- **Relationships** — Follow/block/mute state

### Pagination

`timelines/pagination.js` implements cursor-based pagination. `getTimeline(instanceName, timelineName, maxId, limit)` returns the `limit` items starting after `maxId`, or from the beginning when `maxId` is null.

---

## 8. API Layer

**Location:** `src/routes/_api/`

### HTTP client (`ajax.js`)

All API calls go through `ajax.js`. It wraps `fetch()` with:
- **Timeout enforcement** — `DEFAULT_TIMEOUT = 20 s`, `WRITE_TIMEOUT = 45 s`, `MEDIA_WRITE_TIMEOUT = 90 s`. Timeouts throw a plain `Error` with no `.status`.
- **JSON parsing** — Responses are parsed and returned as `{ json, headers }`.
- **Convenience methods** — `get`, `post`, `put`, `patch`, `del`, `delWithBody`, `getWithHeaders`.
- **Query string builder** — `paramsString()` handles arrays with Rails `[]` convention.
- **Link header parser** — `parseNextMaxId()` extracts `max_id` from Mastodon-style `Link: <…>; rel="next"` headers for pagination.

### Error classification

This distinction matters for error handling throughout the app:

| Error source | `err.status` | Example |
|---|---|---|
| HTTP ≥ 300 | Set (e.g. `422`, `429`) | Server rejected request |
| Timeout | `undefined` | Fetch took > 20 s |
| Network error | `undefined` | `TypeError: Failed to fetch` |

Code that needs to distinguish "server said something" from "no connection" checks `e.status`.

### Endpoint modules

Endpoints are grouped into ~42 single-responsibility files:
- `timelines.js` — Timeline fetching (home, local, federated, direct, list, tag)
- `statuses.js` — Fetch, create, delete, edit
- `instances.js` — Instance info (v2/v1 endpoints, nodeinfo)
- `oauth.js` — Client credentials, authorization flow
- `stream/TimelineStream.js` — WebSocket streaming (see §9)
- Individual action files for: `favorite`, `reblog`, `bookmark`, `pin`, `mute`, `block`, `follow`, etc.

---

## 9. WebSocket Streaming

### TimelineStream

`src/routes/_api/stream/TimelineStream.js` wraps the vendored `WebSocketClient` with:
- **Event emitter** (via `mitt`): emits `open`, `close`, `reconnect`, `message`.
- **First-open vs. reconnect distinction** — `open` fires once; subsequent reconnects fire `reconnect` instead.
- **Lifecycle integration** — Pauses the WebSocket when the page is frozen; resumes on unfreeze or `active` state.
- **Online/offline handling** — Closes the socket on `offline`, reopens and resets backoff on `online`.
- **Backoff reset** — When the connection drops and comes back, `ws.reset()` + `ws.reconnect()` resets the exponential backoff so new posts arrive quickly.

### Lifecycle integration

The Page Lifecycle API (`src/routes/_utils/lifecycle.ts`) maps browser lifecycle states to events. `TimelineStream` listens to `statechange`:
- `frozen` → pause (close socket to avoid battery drain in background tabs)
- `unfrozen` → unpause (recreate socket)
- `active` → trigger reconnect check

This means streams automatically recover after the device wakes from sleep or the browser unfreezes a background tab.

### Stream URL

`getStreamUrl.ts` builds the WebSocket URL from the instance's `streaming_api` URL (extracted from the instance info response) plus the access token and timeline name.

---

## 10. Component Architecture

**Location:** `src/routes/_components/`

### Virtual list

The virtual list renders only items visible in the viewport plus a small buffer. This is what makes Zocial fast on timelines with thousands of items.

- `VirtualList.html` — Outer scroller. Tracks `scrollTop`, manages visible window.
- `VirtualListContainer.html` — Viewport with fixed height; positions items absolutely.
- `VirtualListItem.html` / `VirtualListLazyItem.html` — Individual item slots. Lazy items defer rendering until they scroll near the viewport.
- `virtualListStore.js` — Separate Svelte store (LRU cache per "realm") that tracks scroll position per timeline. This is why hitting the back button restores your scroll position — the position is stored per-timeline key.

The virtual list was originally intended to become a standalone npm package (hence its own store). This never happened, but the separation remains and is useful.

### Timeline

`Timeline.html` (≈ 12 KB) is the main feed component. It:
- Subscribes to `timelineItemSummaries` from the store.
- Renders summaries as `StatusVirtualListItem` or `NotificationVirtualListItem` inside the virtual list.
- Watches `timelineItemSummariesToAdd` (the buffer) and either inserts items immediately (when scrolled to top) or shows the "Show X more" button.
- Calls `setupTimeline()` on mount and on tab re-activation.
- Increments `mountedTimelines` in `oncreate`, decrements in `ondestroy` — this gates the 60 s poll.
- Emits scroll events upward for `ScrollToTopButton` and scroll-restoration.

Props flow down via `createMakeProps()` (`_actions/createMakeProps.js`) which builds the per-item prop objects from summaries.

### Status

`Status.html` (≈ 30 KB) is the largest component. It handles:
- **Header** — boost/reply attribution, author avatar, display name, timestamp, thread position lines.
- **Content** — HTML post content (sanitised by `renderPostHTML.ts`), spoiler toggle, long-post collapse.
- **Media** — `StatusMediaAttachments.html` renders images, video, audio with blurhash placeholders.
- **Card** — `StatusCard.html` for link previews.
- **Poll** — `StatusPoll.html` with live vote submission.
- **Reactions** — `StatusReactions.html` for emoji reactions (Mastodon 3.5+ / Pleroma).
- **Toolbar** — Reply, boost, favorite, bookmark, more-menu.
- **Quoted posts** — `<svelte:self status={originalQuote} quotedBy={uuid}>` renders a nested Status inline when the server provides a `quote` field.

All computed properties that access `originalAccount` have null guards — some servers (Friendica, some Mastodon federations) return a `quote` object with `account: null` for remote posts not yet fetched.

### Compose

The compose system is split across ≈ 18 files:
- `ComposeBox.html` — Outermost container. Manages submit, save-draft, keyboard shortcuts.
- `ComposeInput.html` — Contenteditable text area with mention/hashtag/emoji autocomplete.
- `ComposeAutosuggest.html` — Dropdown for autocomplete results.
- `ComposeToolbar.html` — Visibility selector, content-warning toggle, attachment button, scheduling.
- `ComposeMediaItem.html` — Per-attachment preview with alt-text editor and focal-point picker.
- `ComposePoll.html` — Poll option editor.

The compose state (`composeData`) is persisted to localStorage so an unsent draft survives a page reload.

### Dialogs

`src/routes/_components/dialog/` contains ≈ 28 modal components built on `ModalDialog.html` (keyboard-trapped, accessible, focus-managed via `a11y-dialog`). Key ones:
- `StatusOptionsDialog.html` — The "…" more-menu for a status (delete, mute conversation, report, etc.).
- `MediaDialog.html` — Full-screen media viewer.
- `EmojiDialog.html` — Emoji picker (wraps `emoji-picker-element` custom element).

`emoji-picker-element` uses Svelte 3, which is incompatible with Svelte 2. It is loaded as a **bundled custom element** (not a Svelte component) to work around this.

---

## 11. Actions Layer

**Location:** `src/routes/_actions/`

Actions are async functions (not Svelte components) that orchestrate API calls, store mutations, and database writes. They are the layer between user interactions and the raw API/store.

Structure (≈ 64 files, grouped by domain):
- **Timeline orchestration** — `timeline.js` (master), `addStatusOrNotification.js`, `rehydrateStatusOrNotification.js`
- **Status CRUD** — `statuses.js`, `delete.js`, `edit.js`, `updateStatus.js`, `deleteAndRedraft.js`
- **Status interactions** — `favorite.js`, `reblog.js`, `bookmark.js`, `pin.js`, `react.js`, `polls.js`
- **Compose & publishing** — `compose.js`, `showComposeDialog.js`, `composePoll.js`, `quote.js`
- **Account / social** — `follow.js`, `unfollow.js`, `block.js`, `mute.js`, `accounts.js`, `updateProfile.js`
- **Instance & auth** — `instances.js`, `addInstance.js`, `pushSubscription.js`
- **Search & filters** — `search.js`, `filters.js`, `blockedAndMuted.js`
- **Translation** — `translate.js`, `fetchTranslationLanguages.js`
- **Media** — `media.js`
- **Streaming** — `stream/streaming.js` (creates `TimelineStream`, feeds items into the store)

Heavy modules (database, compose box, virtual list, translate) are always imported via `_utils/asyncModules/` wrappers so they are code-split and only loaded on demand.

---

## 12. Timeline System

This is the most complex part of the codebase. Read carefully.

### Timeline types

| Timeline key | WebSocket | Background when away | `alwaysStreaming` |
|---|---|---|---|
| `home` | Permanent | Yes (instanceObservers) | `true` |
| `notifications`, `notifications/mentions` | Permanent | Yes (instanceObservers) | `true` |
| `local`, `federated`, `direct` | While active | No | `false` |
| `list/<id>` | While active | No | `false` |
| `tag/<name>` | While active | No | `false` |
| `status/<id>` (thread) | None | No | `false` |
| `favorites`, `bookmarks` | None | No | `false` |

**`alwaysStreaming`** is not about whether WebSocket streaming is supported. It is a store-level flag that tells `setupTimeline` "this timeline's cache is kept fresh by a permanent background stream, so skip the network fetch when the cache is warm." Only home and notifications qualify.

### Permanent background stream (home / notifications)

**File:** `instanceObservers.js`

When `currentInstance` changes (login or account switch), `refreshInstanceDataAndStream` runs:
1. Fetches instance info, verify-credentials, custom emoji, lists, filters, follow requests (low-priority idle tasks), push subscription — all in parallel.
2. Opens a `TimelineStream` for the `home` timeline. This single stream delivers both home posts and notifications (Mastodon's streaming API multiplexes them on the `user` channel).
3. The stream persists regardless of which page the user navigates to. It is only torn down on instance switch.

Because the stream continuously inserts new items, `hasFreshCache` stays `true` for home/notifications. `setupTimeline` almost never issues a network fetch for these timelines:

```
!hasFreshCache || (!alwaysStreaming && !fetchedRecently)
= false         || (false           && ...)
= false  → skip fetch
```

### Active-only timelines (stream + 60 s poll)

**File:** `timelineObservers.js`

`shouldObserveTimeline(timeline)` returns `true` for: `local`, `federated`, `direct`, `list/*`, `tag/*`. Returns `false` for everything else (home, notifications, thread, account pages, settings).

On every `currentTimeline` change:
1. The previous stream is closed.
2. If `shouldObserveTimeline` is true, a new `TimelineStream` is opened.
3. The stream only runs while that specific timeline is active.

**60 s poll (streaming fallback):**

```javascript
scheduleInterval(() => {
  const { mountedTimelines, currentTimeline } = store.get()
  if (mountedTimelines > 0 && currentTimeline) setupTimeline()
}, 60000, false)
```

- `mountedTimelines` is incremented in `Timeline.html oncreate`, decremented in `ondestroy`. This ensures the poll is silenced on settings pages, profile pages, etc.
- `runOnActive: false` because `Timeline.html` already calls `setupTimeline` when the tab becomes active.
- `setupTimeline` has its own 30 s throttle, so if a stream already delivered fresh data this poll is a no-op.

### `setupTimeline` — when does a fetch happen?

**File:** `src/routes/_actions/timeline.js`

```javascript
const hasFreshCache   = timelineItemSummaries && !timelineItemSummariesAreStale
const alwaysStreaming = currentTimeline === 'home' ||
                        currentTimeline.startsWith('notifications')
const lastFetchedAt   = store.getForTimeline(currentInstance, currentTimeline, 'lastFetchedAt')
const fetchedRecently = lastFetchedAt && (Date.now() - lastFetchedAt < 30_000)

if (!hasFreshCache || (!alwaysStreaming && !fetchedRecently)) {
  // fetch
}
```

A fetch only happens when **either**:
- There is no warm cache (first load, stale, or after offline recovery), **or**
- The timeline is not `alwaysStreaming` **and** it was last fetched more than 30 seconds ago.

The **30 s throttle** (`fetchedRecently`) prevents redundant requests during rapid navigation between timelines.

### Fresh fetch vs. pagination

```
fresh=true  → maxId=null      → no max_id param → API returns newest posts
fresh=false → maxId=undefined → falls through to lastTimelineItemId → posts older than current bottom
```

| Call site | `fresh` | Result |
|---|---|---|
| `setupTimeline` (navigate, poll, stream reconnect) | `true` | Fetches newest posts |
| `fetchMoreItemsAtBottomOfTimeline` (infinite scroll) | `false`/omitted | Paginates older posts |

`favorites` and `bookmarks` bypass this entirely and always use `fetchPagedItems`, which follows the `Link: rel="next"` header because Mastodon uses internal pagination IDs for those endpoints.

### Sort order and ID helpers

**Files:** `_utils/statusIdSorting.js`, `_utils/arrays.js`

`compareTimelineItemSummaries` is an **ascending** comparator — it returns negative when the left ID is smaller (older). However, `mergeArrays` calls `comparator(right, left)` with arguments swapped, which inverts the result. The stored `timelineItemSummaries` array is therefore **descending** (newest at index 0, oldest at the end).

```
timelineItemSummaries[0]            → newest → firstTimelineItemId (streaming anchor: since_id)
timelineItemSummaries[length - 1]   → oldest → lastTimelineItemId  (pagination: max_id)
```

Mastodon uses string IDs (Snowflake, decimal) and Pleroma uses base62. `statusIdSorting.js` zero-pads both to a common length so string comparison gives the correct chronological order.

`showMoreItemsForTimeline` does `.sort(compareTimelineItemSummaries).reverse()` before calling `addTimelineItemSummaries`. The `.reverse()` converts the ascending sort result back to descending to match what `mergeArrays` expects. This is correct and intentional.

### New-post buffer and scroll awareness

New items from streaming or a re-navigate poll go into `timelineItemSummariesToAdd` (the buffer) rather than directly into `timelineItemSummaries`. `Timeline.html` checks scroll position:

```
scrollTop === 0 AND no "show more" header visible
  → insert items directly into timeline ("chat room mode")

scrollTop > 0
  → increment buffer count, show "Show X more" button at top
```

This prevents scroll-position jumps when new posts arrive while the user is reading further down.

The buffer path is taken when: `fresh && !stale && existingSummaries.length > 0`.
Direct insert is used for: initial loads, offline fallback, or empty timelines.

### List timeline error handling

List timelines have `alwaysStreaming=false`, so they re-fetch every ~60 s (poll fires, 30 s throttle expires). More fetches = more chances for transient failures = more "internet connection problems" toasts, even when the user's connection is actually fine.

To avoid this noise, errors in list timeline fetches are handled differently:

```
HTTP error (e.status set) on list/*
  → show empty timeline (e.g. GoToSocial returns 422 for empty lists — this is not a network error)

Non-HTTP error (timeout, network blip) on list/*
  → silent cache fallback, no toast

Any error on other timelines
  → "intl.showingOfflineContent" toast + cache fallback
```

After catching a non-HTTP error on a list timeline, the 60 s poll simply continues on the next tick. The user sees stale content quietly rather than repeated error toasts.

### List/tag reliability: slow server endpoint, three mitigations

The `timelines/list/:id` endpoint is assembled per-list **server-side** (heavy on GoToSocial, or when a Mastodon list feed needs regenerating), so it is frequently far slower than the cheap `timelines/public` read — list fetches time out at the default 20 s even on a perfectly stable connection. Client handling is otherwise identical to federated (same `getTimeline`, same active-only streaming + 60 s poll); the difference is purely the endpoint cost. Three list/tag-scoped mitigations (fast timelines are untouched):

1. **Longer read timeout** — `SLOW_READ_TIMEOUT` (40 s) instead of `DEFAULT_TIMEOUT` (20 s) for `list/*` and `tag/*` reads (`getTimeline` in `_api/timelines.js`), so a slow-but-working response isn't aborted.
2. **Cache-first render** — on a cold store, `setupTimeline` calls `prefillCurrentTimelineFromCache` for `list/*`/`tag/*`: it loads cached items from IndexedDB and renders them immediately (marked stale), so the user isn't blocked on the slow fetch. The network fetch **still runs** afterwards (the prefilled summaries are stale, so the fetch is never skipped) and refreshes the content — a successful refresh clears the stale marker so the 30 s throttle resumes. Fast timelines (local/federated) stay net-first.
3. **Smaller batch** — `list/*` fetches use `LIST_BATCH_SIZE` (10) instead of `TIMELINE_BATCH_SIZE` (20), so the per-list server query is cheaper/faster. Infinite scroll + streaming fill the rest in.

Together: the long timeout lets the background refresh actually succeed, cache-first makes that wait invisible, and the smaller batch shortens the wait — so list timeouts become rare and, when they do happen, unnoticed.

---

## 13. Translation System

**Files:** `src/routes/_actions/translate.js`, `src/routes/_utils/libreTranslate.js`, `src/routes/_utils/libreTranslateHTML.js`, `src/routes/_actions/fetchTranslationLanguages.js`, `src/routes/_components/status/StatusTranslateToolbar.html`

The design rationale for the choices below is summarised in §20; this section is the working reference for *how* it behaves.

### Backend

Default backend: `translate.zocial.social` (self-hosted LibreTranslate). Configurable in General Settings → Translation language. The proxy routes `/api/translate` and `/api/detect` to the configured backend, keeping the access key server-side.

When `source=auto`, the translate and detect calls run in parallel (`Promise.allSettled`) to save a round-trip for the common case (a post in a different language).

### Language detection — confidence bands

`detectLanguage` (in `libreTranslate.js`) returns `{ language, confidence }`, or `null` on a network/empty failure. The caller in `translate.js` interprets the confidence in three bands:

| Confidence | Meaning | Action |
|---|---|---|
| `< 1` (≈ 0) | The backend has **no model** for this language and fell back to its default (`en`) with zero confidence | Treat as **unsupported language** |
| `≥ 50` | Trustworthy detection | Used for the same-language check and the "Translated from X" display label |
| `1 ≤ c < 50` | Ambiguous (e.g. mixed-language posts) | Ignored — translate normally |

A `null`/`undefined` confidence (e.g. an older backend that doesn't report it) is **not** treated as unsupported — `isUnsupportedDetection` requires `typeof confidence === 'number'`.

### Unsupported-language detection — the zero-confidence signal

When asked to translate a language it has no model for (e.g. Finnish on a de/en-only instance), the backend does **not** return a 400 error. The translate endpoint returns the text unchanged with `detectedLanguage: {confidence: 0, language: en}`, and `/api/detect` likewise returns `{confidence: 0, language: en}`.

This is **not a misdetection.** LibreTranslate's detector only knows the languages whose models are installed; for anything else it returns its default (`en`) with **confidence exactly `0`** — an explicit "I have no model for this" signal. Empirically verified against `translate.zocial.social`:

| Input | `/detect` result |
|---|---|
| German sentence | `{confidence: 100, language: de}` |
| English sentence | `{confidence: 100, language: en}` |
| French / Finnish sentence | `{confidence: 0, language: en}` |
| Mixed Finnish + English | `{confidence: 57, language: en}` |

The separation between supported (≈100) and unsupported (≈0) is stark, which makes zero-confidence reliable. `isUnsupportedDetection` treats it as the **primary** unsupported signal and throws `{type: 'unsupportedLanguage'}`, which `translateStatus`'s `.catch` surfaces as the "translateUnsupportedLanguage" UI message. This signal is self-contained — it does **not** depend on the instance's supported-language list, so it works even for users who have never opened Settings.

**Two-detector redundancy:** both endpoints carry the signal — `/api/detect` and the translate response's `detectedLanguage` (exposed as `result.detected` + `result.detectedConfidence`). The code prefers `/api/detect` (cleaner input) but falls back to the translate endpoint's own detection if `/api/detect` fails, so an unsupported language is still caught when `/api/detect` is unavailable.

**Secondary check (`supportedSourceCodes`):** a confidently detected language (`≥ 50`) that is not in `translationLanguages[currentInstance]` is also treated as unsupported. This is a backup for the theoretical case where a backend's detector knows more languages than its translator can handle. On instances where detector and translator share the same model set (like ours), the zero-confidence signal already covers everything and this check is redundant but harmless.

### `/api/detect` input cleaning

CLD3 (the underlying detector) is pulled toward English by ASCII tokens that survive HTML tag-stripping. The text sent to `/api/detect` therefore removes, in order:

1. HTML tags
2. URLs (`https?://…`)
3. Mentions — both `@user@domain` and bare `@username` (local mentions without a domain part, e.g. `@rolle`, are NOT caught by the `@user@domain` regex and pull CLD3 toward English)
4. Hashtags (`#word`)
5. HTML entities (`&amp;`, `&#123;`, …)

The cleaned result is capped at 500 chars; if fewer than 10 chars of real text remain, detection is skipped (returns `null`).

### Same-language detection — three layers

Detecting "this post is already in my language" is hard because the translate response's `detectedLanguage` is unreliable on HTML input, and CLD3 misfires on ASCII noise. Three layers of defense:

1. **Trusted detection (`≥ 50`)** — if the detected language (preferring `/api/detect`) equals the target, it's the same language.
2. **Translate-endpoint fallback** — when no trusted detection is available, fall back to `result.detected === target`.
3. **Text-similarity fallback** — if the translated HTML, after tag-stripping, is identical to the input, LibreTranslate performed a no-op; treated as same language regardless of what the detectors said.

Any layer returning "same language" short-circuits: no translation panel is shown, the button collapses silently.

**Check ordering matters:** the unsupported-language check must run **before** the same-language and text-similarity checks. The backend returns the source text unchanged for a language it can't translate, which the text-similarity fallback would otherwise mistake for "already in your language".

### Display label

When `/api/detect` returns a trusted result, it overrides `result.detected` so the "Translated from X" label in the toolbar is as accurate as possible (the translate endpoint's own detection runs on raw HTML and is less reliable). Unknown language codes fall back to the raw code in the label rather than showing `undefined`.

### Language preference & fetch lifecycle

Three store keys are involved, with different persistence behaviour:

| Key | Persisted | Content |
|---|---|---|
| `translationTargetLanguage` | ✅ yes | user's chosen target language, e.g. `'de'` |
| `translationLanguages[instance]` | ✅ yes | supported language list fetched from `/api/languages` |
| `translationLanguagesFetched[instance]` | ❌ no | session-only guard: "already fetched this page load" |

**Target language on page load:** `translationTargetLanguage` is loaded immediately from persisted storage. `getDefaultLanguage()` uses `(translationTargetLanguage || navigator.language).split('-')[0]` — so the user's preference is active from the very first translation, without any network request.

**Fetch is Settings-only:** `fetchTranslationLanguages()` is called only from Settings → General. It checks `translationLanguagesFetched[instance]` first; because that key is non-persisted, it fires once per page load on the first Settings → General visit, refreshing `translationLanguages[instance]`. The list is only needed for (a) the target-language dropdown in Settings and (b) the secondary supported-codes check — both of which only matter once the user is in Settings. The zero-confidence signal handles unsupported detection without it.

**Preference is never overwritten by the fetch — with one exception:** if the previously selected language is no longer in the freshly fetched list (e.g. the admin removed it from the instance), `fetchTranslationLanguages()` sets `translationTargetLanguage = null`, and `getDefaultLanguage()` falls back to `navigator.language` automatically:

```js
if (translationTargetLanguage && !langs.find(l => l.code === translationTargetLanguage)) {
  update.translationTargetLanguage = null
}
```

**Adding a language to the instance** takes effect after the user reloads the page and opens Settings → General (triggering a fresh fetch).

---

## 14. Svelte 2 Template Syntax Constraints

Svelte 2's parser runs **before** Babel/webpack. This means `.html` template files cannot use JavaScript syntax that the Svelte parser doesn't understand, even though the same syntax works fine in `.js` or `.ts` files.

### Forbidden in `.html` files

| Syntax | Error | Workaround |
|---|---|---|
| `obj?.prop` | ParseError: unexpected token | `obj && obj.prop` |
| `obj?.method?.()` | ParseError | `obj && obj.method && obj.method()` |
| `{:else if condition}` | ParseError | `{:else}{#if condition}…{/if}{/if}` |
| `60_000` (numeric separator) | ParseError | `60000` |

These restrictions apply **only** to `.html` files. `.js` and `.ts` files go through Babel/esbuild and support full ES2021+.

### Computed properties

Svelte 2 computed properties are defined in the `<script>` block's `computed` object. They re-run whenever their dependencies change. A crash inside a computed (e.g. a `TypeError`) blanks the entire component without a visible error in production.

---

## 15. Internationalization

**Source of truth:** `src/intl/en-US.js`

### Adding a new string

1. Add the key to `src/intl/en-US.js`.
2. Add translations to `de.js`, `fr.js`, `es.js`, `ru-RU.js`, and any other active locale files. If no translation exists, the English fallback is used automatically.
3. Use in templates:
   - No parameters: `{'intl.myKey'}` — compiles to a plain string at build time.
   - With parameters: `{formatIntl('intl.myKey', { param: value })}` — compiles to an AST at build time.

### `svelte-intl-loader` + `formatIntl` rule

The webpack loader transforms `'intl.KEY'` at build time:
- **No `{param}`** → plain string. Do **not** wrap in `formatIntl()`. It expects an AST object; passing a plain string crashes the computed and blanks the entire component.
- **With `{param}`** → AST object. Must be wrapped in `formatIntl({ param: value })`.

```html
<!-- Correct -->
<p>{'intl.generalSettings'}</p>
<p>{formatIntl('intl.rebloggedBy', { account: name })}</p>

<!-- WRONG — blanks the component -->
<p>{formatIntl('intl.generalSettings')}</p>
```

---

## 16. Service Worker & Offline

**File:** `src/service-worker.js`

### Caching strategy

- **Pre-cache at install** — All webpack-emitted assets (`WEBPACK_ASSETS`) and static files (`ASSETS`) are cached with a version timestamp. Old caches are deleted on activate.
- **Cache-first for static assets** — `.woff2` fonts, Tesseract worker, KaTeX files.
- **Network-first for everything else** — API calls, HTML pages.

### Offline behaviour

When the network is unavailable:
- Static assets are served from cache.
- API calls fail; the app detects `navigator.onLine === false` and shows cached timeline content (see §12).
- The `online` store key tracks connectivity in real time via `window` online/offline events.

### Push notifications

The service worker handles Web Push messages. `pushSubscription.js` manages registration with the instance's push endpoint. Desktop notifications are dispatched from the SW's `push` event handler.

---

## 17. Quote Posts

### Design decision: URL-in-text, not FEP-e232

Quoted posts are shared as plain URLs embedded in the post text. The server generates a link preview (card) for the URL. This approach is universal — it works with every Fediverse server regardless of quote-post support.

FEP-e232 (the ActivityPub quote extension) was considered but rejected because it requires server-side implementation. At the time of this decision, server support was fragmented and implementation would have only worked for a subset of users.

**Tradeoff:** On servers that don't natively support the `quote` field, there is no inline rendering — the quote appears only as a link preview card.

### Inline rendering (where supported)

Where the server returns a `quote` field (e.g. Akkoma, some Mastodon forks), `Status.html` renders it inline using `<svelte:self status={originalQuote} quotedBy={uuid}>`. This is a recursive self-reference — a Status component renders another Status inside it.

### Null-safety

Some servers (Friendica, some Mastodon federations) return a `quote` object where `account` is `null` — the quoted post is from a remote server not yet fully fetched. All computed properties that access `originalAccount` have explicit null guards:

- `showQuote` — requires `originalQuote && originalQuote.account` before rendering
- `originalAccountId`, `originalAccountDisplayName`, `originalAccountEmojis` — all guard `originalAccount && …`

Without these guards, accessing `originalAccount.id` throws a `TypeError` that crashes the entire timeline.

---

## 18. Notification System

There are **three distinct concepts** here that look similar in the UI but are technically unrelated. Keeping them apart is the key to understanding this system.

| Concept | What it is | Where it lives |
|---|---|---|
| **In-app notifications** | Which activity types appear in the in-app **Notifications tab** (and feed the unread badge) | client-side display filter |
| **Foreground sound** | The in-app audio cue (`boop.mp3`) played when a notification streams in while the app is open | `showDesktopNotification.js` |
| **OS push** (Web Push) | An OS notification delivered by the **service worker** from a server push message — the *only* OS-level notification mechanism | `service-worker.js` push handler |

In-app notifications are a *display filter*; the foreground sound is an in-app cue; OS push is the single OS-level delivery mechanism.

> **Historical note (≤ v1.8.2):** there used to be a third mechanism, "System A" — a foreground `Notification()` **popup** raised by the open page as a fallback for servers without Web Push. It was removed (v1.8.3): conflating it with push under one toggle made the master switch dishonest (it stayed "on" when push silently failed), and the popup's unique value was niche (it only fired when the tab was backgrounded-but-alive on a no-push server; Mastodon's push suppressed it via dedup, so it almost never fired). OS notifications are now **push-only**; the page side keeps only the sound. References to "System A / System B" below are retained only where they clarify the history.

### In-app notifications (the Notifications tab)

The Notifications tab is a timeline filtered by per-type toggles (`NotificationFilterSettings` → `instanceSettings`). All types **default to on** — `get(instanceSettings, [currentInstance, key], true)` in `timelineFilterComputations.js`. `numberOfNotifications` (the badge) is derived from `filteredTimelineNotificationItemSummaries`, so unchecking a type both hides it from the list and removes it from the badge. This concept has nothing to do with OS notifications.

### Foreground sound

`showDesktopNotification.js` plays the in-app sound (`boop.mp3`) for a live streamed notification.

- **Trigger:** the streaming `notification` event (`processMessage.js` → `showDesktopNotification(instanceName, payload)`), so it plays exactly once per live notification (not per count delta, so no burst on gap-fill).
- **In-app filter gate:** before playing, it checks the **in-app notification filter** (`instanceSettings`, same per-type toggles as the notifications tab) via `isAllowedByInAppFilter`. A type the user hid from the notifications tab makes **no sound** — the foreground experience matches the tab and the badge. Types without a toggle (`follow_request`, `admin.*`, `update`, `reaction`) are always allowed, exactly as the tab treats them.
- **Gating:** in-app filter allows the type + `disableNotificationSound` is false. Independent of `enableDesktopNotifications` and of push — the sound is its own concern with its own toggle.
- **Limitation:** the streaming WebSocket is **paused when the tab freezes** (`TimelineStream.js`, Page Lifecycle API), so the sound only plays while the tab is alive. (Function name `showDesktopNotification` is legacy — it no longer raises any popup.)

### OS push — Web Push (the only OS-level mechanism)

The first-class system: the server sends a push message, the service worker wakes up and shows the notification **even with the tab closed or on a mobile PWA**.

- **Subscription:** registered with the instance via `_actions/pushSubscription.js` (`updateAlerts`). Mastodon's API doesn't expose the VAPID `applicationServerKey` as a constant, so we subscribe once with a dummy key, POST it, read back the real `server_key`, then re-subscribe with it (Mastodon issue #8785). Per-type alert flags (`follow`/`favourite`/`reblog`/`mention`/`poll`/`status`) are stored in the subscription. `disablePushForInstance` fully unsubscribes (browser + backend + store).
- **VAPID key rotation:** on each sync, `updatePushSubscriptionForInstance` compares the backend's current `server_key` against the browser subscription's `applicationServerKey` and re-subscribes if they differ. The comparison is byte-for-byte (`binaryKeysEqual`) — an earlier `btoa(arrayBuffer)` form was a silent no-op (every `ArrayBuffer` stringifies to `"[object ArrayBuffer]"`), so a rotated server key was never detected.
- **Rendering:** `service-worker.js`'s `push` handler builds **rich, type-specific** notifications (`showRichNotification`) — deep-link `data.url` per type, and `reblog`/`favourite` action buttons on mentions handled by the `notificationclick` handler.
- **Server dependency:** requires server-side Web Push. Mastodon has it; **GoToSocial only since v0.18**; older servers can't do System B at all.
- **Self-healing subscription (`canSilentlyReregister`):** Browser push subscriptions are occasionally lost without warning — typically after a service worker update or the browser clearing storage. Previously this left the UI in an inconsistent state: the master "Notify me on this device" toggle showed ON (persisted), but all per-type checkboxes showed unchecked (subscription null → early return). On every page load, `updatePushSubscriptionForInstance` (called via `instanceObservers` as an idle task) now detects a null subscription and, when `enableDesktopNotifications === true` + `Notification.permission === 'granted'`, silently re-registers via `updateAlerts` — no Settings visit required. This is gated by `canSilentlyReregister()` to prevent unexpected permission prompts.
- **Per-type preference preservation (`lastPushAlerts`):** Re-registration previously used `ALL_PUSH_ALERTS`, discarding the user's saved per-type choices. Now `updateAlerts` saves the alert config to `lastPushAlerts[instanceName]` in persisted store after every successful registration. The self-healing path reads back `getSavedAlerts(instanceName)` so the user's configuration is restored exactly.
- **Permission-revoked reconciliation:** `updatePushSubscriptionForInstance` runs on every page load. If `Notification.permission === 'denied'`, it reconciles state and returns early — nothing useful can be synced. It clears `enableDesktopNotifications` **and** drops any stored subscription (`pushSubscriptions[instance] = null`, best-effort browser `unsubscribe()`), so the master toggle no longer shows "on" via the `enabled` computed (`enableDesktopNotifications || hasSubscription`). The cleanup is guarded so it only writes once — subsequent denied loads find nothing to reconcile and no-op. The settings UI additionally surfaces a "denied" alert via the `notificationPermission` observer. End state: master toggle off + denied alert.
- **Failure detection — honest "off" when push is permanently broken:** because the toggle is push-only, "on" should mean push actually works. Two layers decide when to give up:
  - **Enable time** (`enableOSNotificationsForInstance`): the intent flag `enableDesktopNotifications` is set **only** on a successful registration. A failure returns `{ pushError }` (or `{ pushUnsupported: true }` when the browser has no Web Push) and leaves the flag off, so the master toggle reverts to off + a toast instead of falsely showing "on".
  - **Runtime circuit breaker** (`recordPushFailure` + persisted `pushFailureCount[instance]`): the self-healing path tolerates transient failures but counts consecutive ones. A permanent error (`NotSupportedError`) gives up immediately; otherwise after `PUSH_FAILURE_THRESHOLD` (3) consecutive failed loads, `markPushUnavailable` drops the subscription + clears the intent flag (toggle → off) and best-effort unsubscribes. Any successful (re-)registration resets the counter via `savePushAlerts`, so genuine transient blips (a flaky load, a brief network drop) heal without ever flipping the toggle. This is the fix for the old behaviour where a dead push service left the toggle stuck "on" forever (silent retry never concluded "broken").

### Dedup: don't pop while the app is in view

With OS notifications now push-only, there's a single dedup point — the **service worker `push` handler**. Before showing any OS notification it checks whether a window client is currently visible:

```js
const windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
if (windowClients.some(c => c.visibilityState === 'visible')) return
```

If the app is open and in focus, the streaming connection already delivers the notification in-app (sound + notification list), so a push popup would be redundant and disruptive — the SW skips `showNotification()`. Industry-standard PWA pattern; `WindowClient.visibilityState` degrades safely — if `undefined` (old Safari), the expression is `false` and the push fires anyway.

**Result — two cases:**

| State | OS popup (push) | Sound |
|---|---|---|
| Tab visible | ✗ (suppressed) | ✓ (streaming) |
| Tab hidden / app closed | ✓ | ✓ if streaming still alive |

**Known edge case:** if the tab is visible but the streaming connection is momentarily reconnecting, a push arrives and the SW suppresses it (tab visible). The notification still appears in the notifications tab once streaming reconnects, but no sound plays in that brief window. Accepted limitation, shared by all PWAs using this pattern.

### Settings UI

`DeviceNotificationSettings.html` is one master switch, **"Enable OS push notifications on this device"** — push-only (`enableDesktopNotifications` is the push-intent flag; despite its legacy name it no longer gates any foreground popup):

- **On:** requests `Notification` permission, then registers Web Push with all alert types. The intent flag is set **only after** registration succeeds (see Failure detection). If the browser can't do Web Push (`pushUnsupported`) or registration fails (`pushError`), the toggle stays **off** with an explanation/toast — it never falsely shows "on". On success the per-type sub-component (`PushNotificationSettings`) mounts against an already-existing subscription and reflects the real all-on state.
- **Off:** clears `enableDesktopNotifications` and calls `disablePushForInstance` (browser + backend + store).
- The per-type checkboxes reflect reality: with no subscription they render **unchecked**, and ticking one actually subscribes.

The **In-App Notifications** section (per-type filter for the notifications tab + badge) and the **Notification Sounds** section are independent of this toggle — turning OS push off does **not** affect what shows in the app or the sound.

A dedicated **Notification Sound** section sits below In-App Notifications in the Notifications block. It has its own on/off toggle (default on) and is intentionally separate from Wellness — sound is a notification preference, not a wellness tool. `disableNotificationSound` was previously included in the Wellness "Enable All" toggle; removing it makes "Enable All" refer purely to wellness metrics and immediacy settings.

### Login prompt & defaults

- **In-app notifications: default ON.** OS notifications (A and B): **default OFF.**
- `maybePromptForOSNotifications` shows a **one-time, per-account** dialog at login asking whether to enable OS notifications. On *Enable* → permission request + push registration; on *Not now* / permission denied / platform unsupported / any error → stays **off** (the default).
- Gated by the persisted `osNotificationPrompted[instance]` flag (asked at most once per account *per login*). Idle-scheduled from `instanceObservers` on `currentInstance`, so it covers both fresh logins and existing accounts on first load after the update. If showing the dialog itself throws, the flag is *not* set, so it retries next login. If the OS permission is already decided (`granted`/`denied`), the prompt is skipped and the flag set.
- **Re-login behaviour.** The flag is cleared on logout (see Persistence), so re-login can prompt again — but a dialog only actually appears when `Notification.permission === 'default'`. The three cases:
  - **`default`** (genuinely fresh, e.g. a new browser or permission never decided): the prompt shows → true first-login experience, push stays off until the user opts in.
  - **`granted`** (same browser, permission survives logout): prompt skipped + flag re-set. The logout dropped the push subscription, but the global `enableDesktopNotifications` is still on, so `updatePushSubscriptionForInstance`'s self-healing path silently re-registers push on load — push comes back automatically, no nag.
  - **`denied`**: prompt skipped; the permission-revoked reconciliation keeps everything off.

### Behaviour summary (UX view)

The settings expose three **independent layers**. Only Push depends on the browser permission (and server support); the other two always work, even when Push is blocked.

| Layer | Needs browser permission? | Default | What it does |
|---|---|---|---|
| **In-App Notifications** | no | all on | what shows in the notifications tab + badge |
| **Notification Sounds** | no | on | plays a sound on a new notification (also gated by the in-app filter — a type hidden from the tab makes no sound) |
| **Push Notifications** | yes | off | OS popup even when the tab is closed/hidden |

How they behave across the lifecycle:

- **First login:** In-app on, sound on (work immediately). Push off, with a one-time opt-in prompt. *Enable* → permission request → if granted, Push on with all types. *Not now* / dismiss / deny → stays off.
- **Re-login (same browser)** — determined solely by the browser permission:
  - `default` (never decided) → like first login: prompt shows again, Push off until opt-in.
  - `granted` → no prompt (no nag); Push silently re-registers on load (all types) — convenient restore. (The global `enableDesktopNotifications` survives logout, so the self-healing path brings it back.)
  - `denied` → no prompt; Push stays off with the "blocked" hint.
- **Browser permission revoked:** on the next load the "Enable OS push notifications" master toggle flips to **off**, the subscription is cleaned up, and the settings show the "blocked" hint. In-app notifications and sound keep working untouched.
- **Push service permanently fails** (e.g. a server without Web Push, or a browser push service that never works): the toggle won't stick on a false "on". Enable-time failures keep it off with a toast; a push that worked then breaks is given up on after 3 consecutive failed loads (or immediately on `NotSupportedError`) and the toggle flips off. Transient blips just retry and heal. In-app notifications and sound are unaffected.

The deliberate compromise: on re-login with permission already `granted`, Push returns automatically rather than re-asking — because the intent flag is global across accounts and can't be reset per-account on logout. This is convenience, not breakage: the user already granted permission in this browser. Net effect — OS push is the only layer that can fail/be blocked, and when it does the user falls back cleanly to in-app + sound, with **no toggle ever falsely showing "on"**.

### Persistence

All notification settings persist (`persistedState` in `store.js`): `enableDesktopNotifications` (push-intent flag), `pushSubscriptions` (also server-backed), `osNotificationPrompted`, `lastPushAlerts` (per-instance alert config, used for self-healing re-registration), `pushFailureCount` (per-instance consecutive-failure counter for the circuit breaker), `disableNotificationSound`, `disableNotificationBadge`, and the in-app filters in `instanceSettings`.

The per-instance keys (`pushSubscriptions`, `lastPushAlerts`, `pushFailureCount`, `osNotificationPrompted`) are cleared for an instance on logout (`logOutOfInstance` in `_actions/instances.js`), alongside the other per-instance objects, so the account's **push subscription** is dropped. Clearing `osNotificationPrompted` lets the one-time opt-in prompt run again on re-login. Note what is **not** per-instance and therefore survives logout: the global `enableDesktopNotifications` flag (shared across accounts, so it can't be safely cleared on a single-account logout), the global sound/badge prefs, the per-instance in-app filters (`instanceSettings`, which default to all-on anyway), and the browser-level `Notification.permission` (per-origin). See "Login prompt & defaults" for how these combine on re-login.

### Files

`_actions/showDesktopNotification.js` (foreground sound only — legacy name), `_actions/stream/processMessage.js`, `_actions/pushSubscription.js` (registration, self-healing, circuit breaker), `_actions/promptForOSNotifications.js`, `_store/observers/notificationObservers.js` (favicon only now), `_components/settings/instance/DeviceNotificationSettings.html` + `PushNotificationSettings.html` + `NotificationFilterSettings.html`, `service-worker.js` (push / notificationclick). (`notificationContent.js` was removed with the foreground popup.)

---

## 19. Log System

**File:** `src/routes/_utils/console/hook.ts`

### What is captured

All `console.*` calls, unhandled promise rejections, and global errors are intercepted and stored in an in-memory ring buffer (max 100 entries). The buffer evicts `log`/`info` entries first when full, preserving `error`/`warn` entries.

### Persistence

Logs are written to `localStorage` on `pagehide` and read back on startup, so they survive browser reloads. This is intentional: Ctrl+R is often the first response to seeing an error, and flushing logs on reload would destroy the very evidence needed to debug.

### Viewing logs

**Settings → Logs** shows the captured log entries. "Copy logs" exports them including the app version banner for support context. The `showAllLogs` preference (persisted) toggles between showing only `error`/`warn` (default) and all log levels.

### Network / expected-condition severity

Infrastructure noise — failed fetches, request timeouts, non-2xx responses — is logged as `warn`, not `error`, so genuine bugs stay visually distinct (`⛔`) in the log viewer.

**Shared classifier:** `src/routes/_utils/isNetworkError.js` exports `isNetworkNoiseError(err)`. A failed fetch surfaces with a different message per engine, so the classifier matches all three:

| Engine | Message |
|---|---|
| Chrome | `Failed to fetch` |
| Firefox | `NetworkError when attempting to fetch resource` |
| Safari | `Load failed` |

It also matches our own ajax layer's `Timed out after N seconds` and `Request failed: NNN`. The fetch-failed wording is only treated as noise for genuine `TypeError`s, so a custom message that merely contains "failed to fetch …" isn't misclassified; timeouts/HTTP errors come from our ajax layer with any Error type and are matched unconditionally.

**Where it's applied:**
- `console/hook.ts` — the global `unhandledrejection` handler downgrades network-noise rejections to `warn`.
- `_actions/timeline.js` — every branch of the timeline-fetch `catch` handles the failure gracefully (cached content / empty list / offline toast), so network noise there is logged as `warn`; genuine exceptions stay at `error`.

**Other expected conditions, not just network:** the same "don't log handled outcomes as errors" principle applies elsewhere — e.g. the notification sound's `play()` rejection (autoplay blocked before a user gesture) is swallowed, and `translateStatus` logs only genuine translation failures, not the classified `unsupportedLanguage` / `rateLimit` outcomes.

**Log the readable message, not the bare `Error`.** `stringifyValue` in `hook.ts` renders an `Error` argument as its `.stack` — which in a production/dev build is **minified and unreadable** (e.g. a timeout surfaced in the log viewer as `7638/i/r</s<@…1481.js:1:800`). So for handled network-noise warnings, pass `e.message` rather than the bare error: `console.warn('timeline fetch failed:', e.message || e)` shows the actionable `Timed out after 20 seconds` instead of a minified frame. (`console.error(e)` for genuine bugs deliberately keeps the full stack — there, a deminified trace via the source map is worth the noise; see the dev-environment note below.)

**Resolving a minified frame:** the dev deployment (`dev.zocial.social`) serves the built client chunks **and** their source maps (`*.js.map`). A frame like `…/client/<chunk>.<hash>.js:1:<col>` can be mapped back to source by fetching the chunk (its tail has `//# sourceMappingURL=…`) and its `.map` (whose `sources` array lists the original files) — no local build required.

---

## 20. Design Decisions Log

This section captures significant design decisions, feature choices, and architectural tradeoffs as they are made. Add a new entry whenever a non-obvious or deliberate choice is made — during feature implementations, bug fixes, or API compatibility work. **Convention for future decisions: briefly discuss with the user whether the decision is worth documenting here before moving on.**

---

### [v1.1.0] Profile posting stats bar

**Decision:** Add a visual bar on profile pages showing the ratio of original posts, replies, and boosts for an account.

**Rationale:** Gives readers a quick signal about posting style (broadcaster vs. conversationalist vs. curator) without needing to scroll through the full timeline. Stats are cached per `instance/accountId` in non-persisted store state so switching between account tabs doesn't refetch.

---

### [v1.3.0] In-app profile editing

**Decision:** Implement profile editing (display name, bio, metadata fields, avatar/header upload) inside Zocial rather than directing users to the instance web UI.

**Rationale:** Minimising the need to leave the client improves the self-contained app experience. The Mastodon `PATCH /api/v1/accounts/update_credentials` endpoint is standard across all supported backends.

---

### [v1.3.0] Local-only posting

**Decision:** Add a "local-only" toggle in the compose toolbar. The button is greyed out (but visible) on instances that don't support it.

**Rationale:** Local-only posts are a Mastodon/Pleroma extension widely used on community instances. Surfacing the feature in the UI makes Zocial usable for communities that rely on it. Showing it as disabled (rather than hidden) on unsupported instances makes the feature discoverable.

---

### [v1.4.0] List management from within the app

**Decision:** Add "Manage lists" to the profile "···" menu, and allow creating lists directly in the app.

**Rationale:** GoToSocial users had no other way to manage list memberships — the official Mastodon web UI was unavailable to them. This was the primary driver. The feature was built generically so it works across all backends.

---

### [v1.5.0] Quote post implementation: URL-in-text over FEP-e232

**Decision:** Embed quoted posts as plain URLs in the post body. The server provides a link-preview card.

**Rationale:** FEP-e232 requires server-side support that was not broadly available at the time. A URL-in-text approach works on every Fediverse implementation immediately, with no server cooperation required.

**Tradeoff:** No inline rendering on servers that don't expose a `quote` field. Accepted — broad compatibility outweighs rich rendering for a minority of users.

**Files:** `_actions/quote.js`, `Status.html` (computed `showQuote`, `originalAccount*`)

---

### [v1.5.0] IndexedDB writes moved to background for timeline rendering

**Decision:** After fetching timeline items from the network, render them immediately and write to IndexedDB in the background (`/* no await */ storeFreshTimelineItemsInDatabase(...)`).

**Rationale:** IndexedDB writes are only for offline caching. Waiting for them before rendering added latency users could feel. The worst case if a write fails is that the offline cache is slightly stale — acceptable.

---

### [v1.6.0] Translation backend: LibreTranslate over SimplyTranslate/Google

**Decision:** Replaced SimplyTranslate (Google Translate proxy) with LibreTranslate — a fully open-source engine. Default backend is `translate.zocial.social` (self-hosted). Configurable via `TRANSLATE_API` environment variable. Requests route through nginx so no CORS configuration is needed on the backend.

**Rationale:** SimplyTranslate/Google dependency was non-open-source and fragile. LibreTranslate is fully self-hostable, API-stable, and keeps user content off third-party servers by default.

**Status:** Backend is live but only updated manually. Will reconsider if `libretranslate.com` reopens free public access.

---

### [v1.6.1 / v1.7.1] Unsupported-language detection via zero-confidence signal

**Decision:** Treat a language-detection `confidence` of ≈ 0 as the primary "unsupported language" signal, rather than relying on the backend to return an HTTP 400 or on the instance's supported-language list.

**Rationale:** A self-hosted LibreTranslate instance only loads detection models for the languages it supports. For anything else its detector returns its default (`en`) with confidence exactly `0` — an explicit "no model" signal, not a misdetection. The backend gives no 400 for these; it returns the text unchanged. Keying on the zero-confidence signal is reliable and self-contained — it needs no supported-language list, so it works even for users who never opened Settings.

**Tradeoff:** The check ordering is load-bearing (unsupported must be checked before same-language/text-similarity, or an untranslated post reads as "already in your language"). The supported-language list is kept only as a secondary check and to populate the Settings dropdown.

**Files:** `_actions/translate.js`, `_utils/libreTranslate.js`, `_utils/libreTranslateHTML.js`, `_actions/fetchTranslationLanguages.js` — full mechanics in §13.

---

### [v1.7.0] List timeline errors: silent cache fallback instead of toast

**Decision:** Non-HTTP errors (timeouts, network blips) on `list/*` timelines fall back to cached content silently — no "internet connection problems" toast.

**Rationale:** List timelines re-fetch every ~60 s (no permanent background stream). This means far more fetch attempts than home/notifications, so transient server-side hiccups were generating repeated noisy toasts even when the user's connection was fine. HTTP errors (e.g. GoToSocial's 422 for empty lists) are still surfaced as empty-timeline state, not toasts.

---

### [v1.7.0] 60 s poll: gated on `mountedTimelines > 0`

**Decision:** The 60 s fallback poll only fires when at least one `Timeline` component is mounted (`mountedTimelines > 0`).

**Rationale:** Without this guard the poll would continue firing in the background when the user navigates to settings, a profile page, etc. — wasting requests and potentially surfacing stale errors. `mountedTimelines` is a counter (not a boolean) so it stays correct during route transitions where a new Timeline mounts before the old one destroys.

---

### [v1.7.0] Log persistence: survive reloads, manual clear only

**Decision:** Captured logs persist across browser reloads. Only cleared explicitly via the "Clear logs" button (with a confirmation dialog added in v1.1.0).

**Rationale:** Ctrl+R is a reflex action after seeing an error. Flushing on reload would destroy the evidence needed to diagnose the problem. The confirmation dialog prevents accidental loss.

---

### [v1.7.0] `alwaysStreaming` flag: store-layer optimisation only

**Decision:** The `alwaysStreaming` flag (true only for `home` and `notifications`) controls whether `setupTimeline` may skip a network fetch when the cache is warm. It has no relation to whether a WebSocket stream is currently active.

**Rationale:** Home and notifications have a permanent background stream (instanceObservers) that keeps the cache perpetually fresh. Skipping the fetch avoids redundant requests on every visit. Other timelines cannot use this because their stream stops when you navigate away — their cache goes stale.

---

### [v1.7.1] Log expected conditions as warnings, not errors

**Decision:** Handled/expected runtime conditions are logged as `warn` (or swallowed), reserving `error` (`⛔`) for genuine, unclassified bugs. Network noise (failed fetch, timeout, non-2xx) is classified via a shared `isNetworkNoiseError` helper covering Chrome/Firefox/Safari wording.

**Rationale:** Transient network failures, autoplay-blocked notification sounds, and classified translation outcomes (`unsupportedLanguage`, `rateLimit`) are all handled gracefully and surfaced in the UI — logging them as errors trained users to ignore `⛔`, hiding real bugs.

**Tradeoff:** A regex on error messages is engine-specific and must be kept current as browsers reword fetch failures. Centralising it in one helper limits the blast radius.

**Files:** `_utils/isNetworkError.js`, `_utils/console/hook.ts`, `_actions/timeline.js`, `_store/observers/notificationObservers.js` — full mechanics in §19.

---

### [v1.8.0] Unified device notifications with Web Push as the primary system

**Decision:** Treat Web Push (service worker, "System B") as the primary OS-notification mechanism and the page-context `Notification` ("System A") as a foreground-only fallback. Collapse the two separate settings blocks into one "Notify me on this device" master toggle, and make System A descriptive + event-driven (off the streaming `notification` event). In-app notifications default **on**; OS notifications default **off** behind a one-time login prompt.

**Rationale:** The page-context notification can't fire when the tab is frozen/closed or on a mobile PWA (streaming pauses on freeze), and only ever showed a generic count. Web Push covers all those cases with rich, type-specific content but needs server support and an explicit subscription. Two near-identical settings blocks (in-app filters vs push alerts) plus a third desktop toggle were genuinely confusing, so the UI was unified to one switch with the per-type list underneath.

**Tradeoff:** A push subscription means System A defers entirely (no per-type foreground exceptions) — acceptable, since the per-type intent already lives in the push alerts. OS notifications depend on the server: no Web Push on GoToSocial < 0.18, where only the foreground fallback works.

**Files:** see §18.

---

### [v1.8.1] Two-layer dedup: no OS popup when the app tab is visible

**Decision:** Suppress OS notifications entirely when the user is actively looking at the app. Sound still plays (via streaming), the notification list updates, and the favicon badge increments — no popup interrupts the session. Two-layer implementation: (1) `showDesktopNotification` skips the `Notification()` constructor when `visibilityState === 'visible'`; (2) the service worker `push` handler bails out early when any window client reports `visibilityState === 'visible'` (`clients.matchAll({ type: 'window', includeUncontrolled: true })`).

**Rationale:** This is the standard PWA pattern used by Twitter/X, Slack, and others. An OS popup while the app is open and visible is disruptive and redundant — the user can already see the notification arriving. The previous `isHidden && currentPushSubscription` guard (introduced in the v1.8.0 crash fix commit) caused double-notification (System A popup + System B push) when the tab was visible.

**Tradeoff:** If the streaming connection is momentarily reconnecting while the tab is visible, a push notification arrives and is suppressed by the service worker. The notification is not lost — it appears in the notification list on reconnect — but no sound plays during that window. Accepted; all competing PWAs with this pattern share the same limitation. `WindowClient.visibilityState` degrades safely on older Safari (undefined → expression is false → push fires).

**Files:** `_actions/showDesktopNotification.js`, `src/service-worker.js` — full mechanics in §18.

---

### [v1.8.2] Push subscription self-healing with per-type preference restoration

**Decision:** When a push subscription is lost silently (SW update, browser storage clear, any DOMException during sync), the system re-registers automatically on the next page load if the user had notifications enabled and permission is still granted. The re-registration uses the last saved per-type alert configuration (`lastPushAlerts[instance]`) rather than always defaulting to all-alerts-on.

**Rationale:** Before this change, a lost subscription left the UI in an inconsistent state: master toggle ON, all per-type checkboxes unchecked — with no visible indication that push had stopped working. Users had to notice, open Settings, and manually re-enable. The self-healing path runs silently on every page load via `instanceObservers` (idle task), so recovery is invisible and reliable. `lastPushAlerts` ensures the restored subscription matches what the user had configured, not a reset to defaults.

**Tradeoff:** If permission is revoked at the OS level, `updatePushSubscriptionForInstance` reconciles and returns early on the next load — it clears `enableDesktopNotifications` and drops the stored subscription (best-effort browser `unsubscribe()`), so the master toggle reflects reality rather than staying "on" while nothing delivers. `canSilentlyReregister()` (`Notification.permission !== 'granted'`) is the second line of defence: even if reconciliation were skipped, no re-registration is attempted while permission is denied. Silent re-registration only triggers when conditions indicate the user still wants notifications.

**Files:** `_actions/pushSubscription.js` (`canSilentlyReregister`, `getSavedAlerts`, `savePushAlerts`, permission-denied reconciliation), `_store/store.js` (`lastPushAlerts` persisted key).

---

### [v1.8.2] Foreground notifications (System A) respect the in-app filter

**Decision:** The foreground sound and popup (System A) now check the same per-type in-app notification filter (`instanceSettings`) that governs the notifications tab. A type the user hid from the tab produces no sound and no popup.

**Rationale:** Previously the sound played for every streamed notification regardless of the in-app filter — a user who hid "favourites" from their notifications tab (and badge) still heard a boop on every favourite. That's an inconsistency: the in-app filter is the user's statement of "what I care about in this app," and the foreground cue should honour it. The push `alerts` config (System B) stays deliberately separate — it governs server-side push delivery, a different axis.

**Tradeoff:** Two filters now influence what the user perceives (in-app filter for the foreground path, push alerts for background push). This is intentional — they answer different questions ("what shows in-app" vs. "what the server pushes") — but means a fully-muted foreground still requires unchecking the type in the in-app filter, not just disabling sound.

**Files:** `_actions/showDesktopNotification.js` (`isAllowedByInAppFilter`, `TYPE_TO_FILTER_KEY`) — full mechanics in §18.

---

### [v1.8.2] VAPID key comparison fixed from no-op to byte-for-byte

**Decision:** Replace the `btoa(arrayBuffer)` equality check for detecting a rotated VAPID server key with a real byte-for-byte comparison (`binaryKeysEqual`).

**Rationale:** `btoa()` expects a string; passing an `ArrayBuffer` stringifies it to the constant `"[object ArrayBuffer]"`, so the old comparison was always "equal" and the re-subscribe path never ran. If an instance rotated its VAPID key, existing subscriptions would silently stop receiving pushes with no recovery. The helper normalises `ArrayBuffer`/`TypedArray`/null inputs and compares bytes. Inherited latent bug from the upstream Pinafore code.

**Files:** `_actions/pushSubscription.js` (`binaryKeysEqual`, `updatePushSubscriptionForInstance`).

---

### [v1.8.2] Notification Sound moved from Wellness to Notifications

**Decision:** `disableNotificationSound` was removed from the Wellness "Enable All" toggle and given its own section ("Notification Sound") in the Notifications settings block, directly below "In-App Notifications".

**Rationale:** Sound is a notification delivery preference, not a wellness/digital-health setting. Including it in Wellness "Enable All" semantically conflated two unrelated concerns — a user who wants to reduce social metrics shouldn't automatically silence their notifications. The dedicated section makes the option discoverable in the right context.

**Tradeoff:** Existing users who had enabled all Wellness settings (including sound-off) will keep their saved preference; only the UI placement changed. The `disableNotificationSound` store key and default are unchanged.

**Files:** `_pages/settings/general.html`, `_intl/en-US.js`, `_intl/de.js`.

---

### [v1.8.2] Re-prompt for OS notifications after logout

**Decision:** Clear the per-instance `osNotificationPrompted` flag on logout (alongside `pushSubscriptions` and `lastPushAlerts`), so logging back into the same account re-shows the one-time OS-notification opt-in prompt.

**Rationale:** Logout drops the account's per-instance push subscription, so a returning user with a never-decided browser permission (`default`) would otherwise be silently left with notifications off and never offered the opt-in again. Clearing the flag lets them be asked again. The prompt only actually shows a dialog when `Notification.permission === 'default'`; if the browser-level permission was already granted or denied (that decision survives logout, being per-origin), the prompt is skipped and the flag re-set — so users who already decided aren't nagged. In the already-`granted` case the global `enableDesktopNotifications` flag (not per-instance, so not reset on logout) means push silently re-registers on re-login anyway — convenient restore rather than a fresh prompt. A fully "first-login"-identical reset isn't cleanly achievable because `enableDesktopNotifications` is global and shared across accounts; the current behaviour was judged good UX (no nag, automatic restore in the same browser, real prompt only when genuinely fresh).

**Files:** `_actions/instances.js` (`logOutOfInstance`), `_actions/promptForOSNotifications.js`.

---

### [v1.8.2] Word filter shortcut in status context menu

**Decision:** Added "Add word filter" as a context menu entry on every status (after mute conversation, before report). Tapping it opens `showWordFilterDialog` pre-populated for the current instance.

**Rationale:** Previously, adding a word filter required navigating to Settings → Filters — a multi-step journey from a timeline. The context menu shortcut makes the action discoverable exactly when the user encounters a post they want to filter. Positioning after mute conversation (same "suppress this content" family) and before report (formal action) matches the natural UX escalation path.

**Implementation note:** All icons used in context menus must be registered in `bin/svgs.js`. The `#fa-filter` icon was added there pointing to `font-awesome-svg-png/white/svg/filter.svg`.

**Files:** `_components/dialog/components/StatusOptionsDialog.html`, `bin/svgs.js`, `_intl/en-US.js`, `_intl/de.js`.

---

### [v1.8.3] OS notifications made push-only; foreground popup (System A) removed

**Decision:** Make the device-notification toggle mean **only** Web Push (System B), rename it "Enable OS push notifications on this device", and **remove** the foreground `Notification()` popup (the old "System A"). The page side keeps only the sound. The toggle now honestly reflects push state: it goes **off** when push fails (enable-time failure, or a runtime circuit breaker after 3 consecutive silent-reregister failures / immediately on `NotSupportedError`), and a successful registration resets the counter so transient blips heal.

**Rationale:** One toggle was driving two delivery mechanisms (foreground popup + push), so it stayed "on" even when push silently failed — the user couldn't tell push was broken. Splitting honestly required deciding what to do with the foreground popup. It was removed rather than given its own toggle because its unique value was niche: it only fired when the tab was backgrounded-but-alive on a server without Web Push (Mastodon's push suppressed it via dedup, so for most users it never fired), and the "alert me while the app is open" need is already covered by the sound. Net result: each user-facing control maps to one thing — in-app filter (tab/badge), sound, and OS push — and OS push can't show a misleading "on".

**Tradeoff:** users on servers without Web Push (e.g. GoToSocial < 0.18) lose the foreground OS popup entirely (they still get in-app notifications + sound). Accepted deliberately in favour of a clear, honest single-purpose toggle.

**Files:** `_actions/showDesktopNotification.js` (popup removed), `_actions/pushSubscription.js` (`enableOSNotificationsForInstance` push-only, `recordPushFailure`/`markPushUnavailable`/`isPermanentPushError` circuit breaker), `_store/store.js` (`pushFailureCount`), `_actions/instances.js` (logout cleanup), `_components/settings/instance/DeviceNotificationSettings.html`, `_intl/en-US.js` + `de.js`; `notificationContent.js` deleted. Full mechanics in §18.

---

### [v1.8.3] List timeline reliability: longer timeout, cache-first, smaller batch

**Decision:** Make `list/*` (and `tag/*`) timelines reliable against frequent timeouts with three list-scoped mitigations: a longer read timeout (`SLOW_READ_TIMEOUT` 40 s vs 20 s), cache-first rendering on cold load (prefill from IndexedDB, then still fetch in the background), and a smaller fetch batch for lists (`LIST_BATCH_SIZE` 10 vs 20). Fast timelines (local/federated/home) are untouched.

**Rationale:** List and federated timelines are handled identically client-side; the only difference is the server endpoint — `timelines/list/:id` is assembled per-list (heavy on GoToSocial / on Mastodon feed regeneration) and regularly takes >20 s, so it timed out even on a stable connection. We can't change the server, so we (1) give the slow read more headroom, (2) stop blocking the user on it by showing cached content first, and (3) shrink the query so it returns faster. This generalises the previously-deferred "cache-first" idea (see [[project_timeline_cachefirst_deferred]]) but **only** for the slow timelines, where the tradeoff clearly pays off — the fast timelines stay net-first.

**Tradeoff:** lists show briefly-stale cached content before the refresh lands (acceptable — it's a list you've seen, and the refresh merges in via the streaming buffer), and a smaller first page means infinite scroll triggers slightly sooner. The cache-first prefill required clearing the stale marker after a successful refresh, which also fixes a latent case where a recovered-from-offline timeline kept bypassing the 30 s fetch throttle.

**Files:** `_utils/ajax.js` (`SLOW_READ_TIMEOUT`), `_api/timelines.js` (per-timeline timeout), `_static/timelines.js` (`LIST_BATCH_SIZE`), `_actions/timeline.js` (`isCacheFirstTimeline`, `prefillCurrentTimelineFromCache`, stale-clear). Full mechanics in §12.

---

## 21. Version History

Brief changelog for understanding when features and architectural choices were introduced. Full release notes: https://git.ztfr.eu/Dome/Zocial/releases

| Version | Date | Highlights |
|---|---|---|
| **1.0.0** | 2026-06-06 | Initial release — Enafore fork renamed to Zocial |
| **1.1.0** | 2026-06-06 | Profile posting-stats bar, account join date, confirmation dialog for clearing logs |
| **1.2.0** | 2026-06-08 | Redesigned landing page, scroll-to-top button in threads |
| **1.3.0** | 2026-06-08 | In-app profile editing, local-only posting, revoked-token cleanup, API error classification by status code |
| **1.4.0** | 2026-06-09 | List membership management from profile menu, create-list-in-app (GoToSocial), false "offline" toast fix for empty lists, GoToSocial timeline crash fix (missing URLs) |
| **1.5.0** | 2026-06-09 | Quote posts (URL-in-text), keyboard shortcut "t" for translation, accessibility for link-preview cards, IndexedDB writes moved to background for immediate timeline rendering |
| **1.6.0** | 2026-06-09 | Migrated translation from SimplyTranslate/Google to LibreTranslate; `TRANSLATE_API` env var; nginx proxy (no CORS) |
| **1.6.1** | 2026-06-10 | Same-language detection with parallel detect/translate; language code normalisation (Hebrew, Javanese, Chinese); backend-unreachable crash fix |
| **1.7.0** | 2026-06-10 | Translation target language selector in settings, per-instance language caching, 60 s poll fallback, list error handling (silent fallback vs. toast) |
| **1.7.1** | 2026-06-11 | Reliable unsupported-language detection (zero-confidence signal); expected conditions (network noise, blocked autoplay sound) logged as warnings instead of errors |
| **1.8.0** | 2026-06-11 | New notification system: Web Push as the primary mechanism (rich, type-specific, works with the tab closed / on a mobile PWA); descriptive event-driven foreground notifications; unified "Notify me on this device" settings with a one-time login prompt and hover explanations. In-app notifications default on, OS notifications default off |
| **1.8.1** | 2026-06-12 | Two-layer OS-notification dedup: no popup when app tab is visible (sound still plays); service worker skips `showNotification()` when any window client is visible; crash fix for `this.observe` on destroyed `PushNotificationSettings` component |
| **1.8.2** | 2026-06-12 | Push subscription self-healing (`canSilentlyReregister`): auto-reregisters on page load after silent subscription loss, restoring saved per-type prefs via `lastPushAlerts`; permission-revoked reconciliation clears the master toggle; foreground sound/popup now respect the in-app notification filter; VAPID key-rotation detection fixed (was a no-op); `describeDOMException` export fixes blank DOMException error toasts; "Add word filter" context menu entry on status posts; Notification Sound moved from Wellness to its own section under Notifications |
| **1.8.3** | 2026-06-12 | OS notifications made push-only: master toggle renamed "Enable OS push notifications on this device" and now reflects push state honestly (goes off on enable failure or after a runtime circuit breaker concludes push is dead); foreground `Notification()` popup (System A) removed — page side keeps only the sound; in-app notifications + sound fully independent of the push toggle; `notificationContent.js` deleted. List timeline reliability: longer read timeout (40 s), cache-first rendering on cold load, and smaller fetch batch for lists — far fewer timeouts on slow per-list endpoints (esp. GoToSocial) |
