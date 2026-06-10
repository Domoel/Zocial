# Architecture

This document describes some things about the codebase that are worth knowing if you're trying to contribute.
Basically think of it as a "lay of the land" as well as "weird unusual stuff that may surprise you."

## Overview

Zocial uses [SvelteJS](https://svelte.technology) v2 and [SapperJS](https://sapper.svelte.technology). Most of it is a fairly typical Svelte/Sapper project, but there
are some quirks, which are described below. This list of quirks is non-exhaustive.

## Why Svelte v2 / Sapper ?

There is [no upgrade path from Svelte v2 to v3](https://github.com/sveltejs/svelte/issues/2462). Doing so would require manually migrating every component over. And in the end, it would probably not change the UX (user experience) of Zocial – only the DX (developer experience).

Similarly, [Sapper would need to be migrated to SvelteKit](https://kit.svelte.dev/docs/migrating). Since Zocial generates static files, there is probably not much benefit in moving from Sapper to SvelteKit.

For this reason, Zocial has been stuck on Svelte v2 and Sapper for a long time. Migrating it is not something I've considered. The [v2 Svelte docs](https://v2.svelte.dev/) are still online, and share many similarities with Svelte v3.

## Prebuild process

The `template.html` is itself templated. The "template template" has some inline scripts, CSS, and SVGs
injected into it during the build process. SCSS is used for global CSS and themed CSS, but inside of the
components themselves, it's just vanilla CSS because I couldn't figure out how to get Svelte to run a SCSS
preprocessor.

## Lots of small files

Highly modular, highly functional, lots of single-function files. Tends to help with tree-shaking and
code-splitting, as well as avoiding circular dependencies.

## emoji-picker-element is loaded as a third-party bundle

`emoji-picker-element` uses Svelte 3, whereas we use Svelte 2. So it's just imported
as a bundled custom element, not as a Svelte component.

## Some third-party code is bundled

For various reasons, `autosize`, and `timeago` are forked and bundled into the source code.
This was either because something needed to be tweaked or fixed, or I was trimming unused code and didn't
see much value in contributing it back, because it was too Zocial-specific.

## Every Sapper page is "duplicated"

To get a nice animation on the nav bar when you switch columns, every page is lazy-loaded as `LazyPage.html`.
This "lazy page" is merely delayed a few frames to let the animation run. Therefore there is a duplication
between `src/routes` and `src/routes/_pages`. The "lazy page" is in the former, and the actual page is in the
latter. One imports the other.

## There are multiple stores

Originally I conceived of separating out the virtual list into a separate npm package, so I gave it its
own Svelte store (`virtualListStore.js`). This never happened, but it still has its own store. This is useful
anyway, because each store has its state maintained in an LRU cache that allows us to keep the scroll position
in the virtual list e.g. when the user hits the back button.

Also, the main `store.js` store is explicitly
loaded by every component that uses it. So there's no `store` inheritance; every component just declares
whatever store it uses. The main `store.js` is the primary one.

## There is a global event bus

It's in `eventBus.ts`. This is useful for some stuff that is hard to do with standard Svelte or DOM events.

---

## Svelte 2 template syntax constraints

Svelte 2's parser runs **before** Babel/webpack, so `.html` template files have stricter syntax than plain `.js` files.

| Construct | Workaround |
|---|---|
| Optional chaining `?.` | `obj && obj.prop` |
| `{:else if ...}` | nested `{#if}{:else}{#if}...{/if}{/if}` |
| Numeric separators `60_000` | plain `60000` (only in `.html`; `.js`/`.ts` are fine) |

### `svelte-intl-loader` and `formatIntl`

The loader transforms `'intl.KEY'` strings at build time.

- Keys **without** `{param}` → compiled to a plain string. Do **not** wrap in `formatIntl()` — it expects an AST object and crashes on a plain string, blanking the entire component.
- Keys **with** `{param}` → compiled to an AST. Must be wrapped in `formatIntl({ param: value })`.

```html
<!-- Correct — no params -->
<p>{'intl.generalSettings'}</p>

<!-- Correct — with params -->
<p>{formatIntl('intl.rebloggedByAccount', { account: name })}</p>

<!-- WRONG — crashes the component -->
<p>{formatIntl('intl.generalSettings')}</p>
```

---

## Intl / Translation system

### Adding a new string

1. Add the key to `src/intl/en-US.js` as the source of truth.
2. Add translations to `de.js`, `fr.js`, `es.js`, `ru-RU.js` (and any other active locale files).
3. Use in templates as `{'intl.myNewKey'}` (no params) or `{formatIntl('intl.myNewKey', { x })}` (with params).

### Translation feature (LibreTranslate)

**Files:** `src/routes/_actions/translate.js`, `src/routes/_utils/libreTranslate.js`

Default backend: `translate.zocial.social` (self-hosted). Configurable in General Settings.

#### Same-language detection — three layers

When `source=auto`, translation and detection run in parallel to save a round-trip. Detecting "this post is already in my language" is non-trivial:

1. **`/api/translate` response** includes `detectedLanguage`. Checked first.
2. **Parallel `/api/detect` call** on plain text (HTML stripped + URLs/mentions/hashtags removed). More reliable than the translate endpoint's detection which sees HTML-wrapped input. Only trusted when confidence ≥ 50% and ≥ 10 chars of real text remain.
3. **Text-similarity fallback**: if the translated output is identical to the input (after stripping HTML), LibreTranslate performed a no-op — treat as same language.

Any of the three layers returning "same language" short-circuits and shows no translation.

---

## Timeline system

### Timeline types and streaming behaviour

| Timeline | WebSocket stream | Background activity | `alwaysStreaming` flag |
|---|---|---|---|
| `home` | Permanent, background | Always active | `true` |
| `notifications` / `notifications/mentions` | Permanent, background | Always active | `true` |
| `local`, `federated`, `direct` | While page is active | 60 s poll fallback | `false` |
| `list/*` | While page is active | 60 s poll fallback | `false` |
| `tag/*` | While page is active | 60 s poll fallback | `false` |
| `status/*` (thread) | None | Navigate only | `false` |
| `favorites`, `bookmarks` | None | Paged fetch only | `false` |

The `alwaysStreaming` flag is **not** about WebSocket support — it only controls whether `setupTimeline` may skip a network fetch when the cache is warm. Home/notifications skip because their background stream keeps the cache permanently fresh. Other timelines cannot skip because their stream is stopped when you navigate away.

### Home and notifications: permanent background streaming

**File:** `src/routes/_store/observers/instanceObservers.js`

A single WebSocket is opened for both `home` and `notifications` on instance login. It runs in the background regardless of which page the user is on, and reconnects automatically. It is only torn down on instance switch.

Because the stream continuously delivers new posts, `hasFreshCache` stays `true` for home/notifications and `setupTimeline` almost never issues a network fetch:

```
!hasFreshCache || (!alwaysStreaming && !fetchedRecently)
= false         || (false           && ...)
= false  → no fetch
```

### Active-only timelines: stream + 60 s poll

**File:** `src/routes/_store/observers/timelineObservers.js`

`shouldObserveTimeline` returns `true` for `local`, `federated`, `direct`, `list/*`, `tag/*`. Returns `false` for `home`, `notifications`, `status/*`, `account/*`.

On every `currentTimeline` change the previous stream is closed and a new one is opened if `shouldObserveTimeline` returns true. The stream therefore only runs while that timeline is visible.

The 60 s poll fires when `mountedTimelines > 0 && currentTimeline`. `mountedTimelines` is incremented in Timeline.html `oncreate` and decremented in `ondestroy`, so the poll is silenced on non-timeline pages.

### `setupTimeline`: when does a fetch happen?

**File:** `src/routes/_actions/timeline.js`

```javascript
const hasFreshCache   = timelineItemSummaries && !timelineItemSummariesAreStale
const alwaysStreaming = currentTimeline === 'home' || currentTimeline.startsWith('notifications')
const fetchedRecently = lastFetchedAt && (Date.now() - lastFetchedAt < 30_000)

if (!hasFreshCache || (!alwaysStreaming && !fetchedRecently)) {
  // fetch
}
```

The **30 s throttle** prevents redundant requests when the user navigates rapidly between timelines or when the 60 s poll fires shortly after a navigate.

### Fresh fetch vs. pagination (`max_id`)

- `fresh=true` → `maxId=null` → no `max_id` in request → API returns newest posts
- `fresh=false/undefined` → `maxId=undefined` → falls back to `lastTimelineItemId` → older posts

### Sort order and ID helpers

`compareTimelineItemSummaries` is an **ascending** comparator (smaller/older ID first). `mergeArrays` calls it with arguments swapped, inverting the result. The stored `timelineItemSummaries` array is therefore **descending** (newest at index 0).

```
timelineItemSummaries[0]          → newest → firstTimelineItemId  (streaming anchor)
timelineItemSummaries[length - 1] → oldest → lastTimelineItemId   (max_id for pagination)
```

`showMoreItemsForTimeline` does `.sort(compareTimelineItemSummaries).reverse()` before merging — the `.reverse()` converts ascending → descending to match what `mergeArrays` expects.

### New-post buffer and scroll awareness

New posts from streaming or a fresh-fetch re-navigate go into `timelineItemSummariesToAdd`. Timeline.html inserts them immediately if `scrollTop === 0`, otherwise shows a "Show X more" button. This prevents scroll-position jumps when new posts arrive while the user is scrolled down.

The buffer path is used when `fresh && !stale && existingSummaries.length > 0`. Direct insert is used for initial loads, offline fallback, or empty timelines.

### List timeline error handling

List timelines re-fetch every ~60 s, producing more fetch attempts than home/notifications. To avoid noisy "offline" toasts from transient server-side failures:

- HTTP error on `list/*` → empty timeline (e.g. GoToSocial 422 for empty lists)
- Non-HTTP error on `list/*` → silent cache fallback, no toast
- Any error on other timelines → "showing offline content" toast + cache fallback

---

## Quote posts

**Design decision:** URL-in-text approach rather than FEP-e232.

Quoted posts are embedded as plain URLs in the post text. The server generates a link preview (card) for the URL. This works universally across all Fediverse server implementations, unlike FEP-e232 which requires server-side support.

Where the server returns a `quote` field (e.g. Akkoma), `Status.html` renders it inline via `<svelte:self status={originalQuote}>`. Some servers (Friendica, some Mastodon federations) return a `quote` field where `account` is `null` for remote posts not yet fully fetched — all computed properties that access `originalAccount` have null guards.

---

## Log system

**File:** `src/routes/_utils/console/hook.ts`

- All `console.*` calls, unhandled promise rejections, and global errors are captured into an in-memory ring buffer (max 100 entries).
- Logs are persisted to `localStorage` on `pagehide` and survive browser reloads.
- The eviction strategy preserves `error`/`warn` entries over `log`/`info` when the buffer is full.
- Logs are viewable at **Settings → Logs**. Manual clear available via "Clear logs" button.
