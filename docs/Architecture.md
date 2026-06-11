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
18. [Log System](#18-log-system)
19. [Design Decisions Log](#19-design-decisions-log)
20. [Version History](#20-version-history)

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

---

## 13. Translation System

**Files:** `src/routes/_actions/translate.js`, `src/routes/_utils/libreTranslate.js`, `src/routes/_utils/libreTranslateHTML.js`, `src/routes/_actions/fetchTranslationLanguages.js`, `src/routes/_components/status/StatusTranslateToolbar.html`

The design rationale for the choices below is summarised in §19; this section is the working reference for *how* it behaves.

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

## 18. Log System

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

---

## 19. Design Decisions Log

This section captures significant design decisions, feature choices, and architectural tradeoffs as they are made. Add a new entry whenever a non-obvious or deliberate choice is made — during feature implementations, bug fixes, or API compatibility work. **Convention for future decisions: briefly discuss with the user whether the decision is worth documenting here before moving on.**

---

### [v1.5.0] Quote post implementation: URL-in-text over FEP-e232

**Decision:** Embed quoted posts as plain URLs in the post body. The server provides a link-preview card.

**Rationale:** FEP-e232 requires server-side support that was not broadly available at the time. A URL-in-text approach works on every Fediverse implementation immediately, with no server cooperation required.

**Tradeoff:** No inline rendering on servers that don't expose a `quote` field. Accepted — broad compatibility outweighs rich rendering for a minority of users.

**Files:** `_actions/quote.js`, `Status.html` (computed `showQuote`, `originalAccount*`)

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

### [v1.7.1] Log expected conditions as warnings, not errors

**Decision:** Handled/expected runtime conditions are logged as `warn` (or swallowed), reserving `error` (`⛔`) for genuine, unclassified bugs. Network noise (failed fetch, timeout, non-2xx) is classified via a shared `isNetworkNoiseError` helper covering Chrome/Firefox/Safari wording.

**Rationale:** Transient network failures, autoplay-blocked notification sounds, and classified translation outcomes (`unsupportedLanguage`, `rateLimit`) are all handled gracefully and surfaced in the UI — logging them as errors trained users to ignore `⛔`, hiding real bugs.

**Tradeoff:** A regex on error messages is engine-specific and must be kept current as browsers reword fetch failures. Centralising it in one helper limits the blast radius.

**Files:** `_utils/isNetworkError.js`, `_utils/console/hook.ts`, `_actions/timeline.js`, `_store/observers/notificationObservers.js` — full mechanics in §18.

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

### [v1.4.0] List management from within the app

**Decision:** Add "Manage lists" to the profile "···" menu, and allow creating lists directly in the app.

**Rationale:** GoToSocial users had no other way to manage list memberships — the official Mastodon web UI was unavailable to them. This was the primary driver. The feature was built generically so it works across all backends.

---

### [v1.3.0] In-app profile editing

**Decision:** Implement profile editing (display name, bio, metadata fields, avatar/header upload) inside Zocial rather than directing users to the instance web UI.

**Rationale:** Minimising the need to leave the client improves the self-contained app experience. The Mastodon `PATCH /api/v1/accounts/update_credentials` endpoint is standard across all supported backends.

---

### [v1.3.0] Local-only posting

**Decision:** Add a "local-only" toggle in the compose toolbar. The button is greyed out (but visible) on instances that don't support it.

**Rationale:** Local-only posts are a Mastodon/Pleroma extension widely used on community instances. Surfacing the feature in the UI makes Zocial usable for communities that rely on it. Showing it as disabled (rather than hidden) on unsupported instances makes the feature discoverable.

---

### [v1.5.0] IndexedDB writes moved to background for timeline rendering

**Decision:** After fetching timeline items from the network, render them immediately and write to IndexedDB in the background (`/* no await */ storeFreshTimelineItemsInDatabase(...)`).

**Rationale:** IndexedDB writes are only for offline caching. Waiting for them before rendering added latency users could feel. The worst case if a write fails is that the offline cache is slightly stale — acceptable.

---

### [v1.1.0] Profile posting stats bar

**Decision:** Add a visual bar on profile pages showing the ratio of original posts, replies, and boosts for an account.

**Rationale:** Gives readers a quick signal about posting style (broadcaster vs. conversationalist vs. curator) without needing to scroll through the full timeline. Stats are cached per `instance/accountId` in non-persisted store state so switching between account tabs doesn't refetch.

---

## 20. Version History

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
