<p align="center">
  <a href="https://ztfr.eu/matrix">
    <img src="/static/icons/favicon.avif" alt="Zocial" height="80" />
  </a>
</p>

<h1 align="center">Zocial</h1>

<h4 align="center">
A beautifully refined fediverse client — built for the edges of the Mastodon ecosystem.
</h4>

<p align="center">
  <a href="https://zocial.social">🌐 Live Instance</a>
  ·
  <a href="https://ztfr.eu">🏰 Website</a>
  ·
  <a href="https://ztfr.eu/matrix">📰 Matrix Community</a>
  ·
  <a href="https://social.ztfr.eu/@dome">🐘 Mastodon</a>
  ·
  <a href="https://look.ztfr.eu/#/#support:ztfr.eu">💬 Support</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.8.1-blue?style=flat-square" alt="Version">
  <img src="https://img.shields.io/badge/license-AGPL--v3-green?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/PWA-ready-purple?style=flat-square" alt="PWA">
  <img src="https://img.shields.io/badge/GoToSocial-supported-orange?style=flat-square" alt="GoToSocial">
</p>

<br>

## ✨ What is Zocial?

Zocial is a fork of [Enafore](https://github.com/enafore/enafore), itself born from the legendary Pinafore. Where Enafore focuses on broad compatibility, Zocial goes further — polishing rough edges, adding quality-of-life features, and tuning the experience for servers running **GoToSocial**, **Akkoma**, **glitch-soc**, **Iceshrimp**, and more.

It's fast, fully keyboard-navigable, installable as a PWA, and designed to feel native on both desktop and mobile.

<br>

## 🚀 Feature highlights

| | |
|---|---|
| 🔔 **Web Push notifications** | OS notifications even with the tab closed or on a mobile PWA |
| 💬 **Quote posts** | Universal, works against every server — no special backend needed |
| 🌍 **Privacy-first translation** | LibreTranslate, routed server-side — no browser API calls |
| 🧵 **Thread bundles** | Self-reply threads collapse into a clean single bundle |
| ♿ **Accessibility first** | Full keyboard nav, rich aria labels, screen reader optimised |
| 🎨 **Custom dark theme** | Carefully considered colours, feels at home on modern displays |
| 📱 **PWA-ready** | Install on Android and iOS home screen |
| ⚡ **Real-time everything** | Live streaming, instant filter updates, no page reloads |

<br>

---

## Feature Descriptions

### 🔔 Notifications that just work

Zocial ships a fully redesigned notification system built around **Web Push** — the same technology that powers native app notifications.

### OS notifications
A single **"Notify me on this device"** toggle in Settings handles everything: it requests browser permission, registers a Web Push subscription, and remembers your choice — no cryptic technical menus. When you first log in, Zocial asks once (and only once) whether you'd like to enable notifications.

- **Works with the tab closed** — push messages are delivered by the service worker even when Zocial isn't open
- **Works as a mobile PWA** — install Zocial on your home screen and get notifications like a native app
- **Per-type granularity** — independently toggle notifications for follows, mentions, boosts, favourites, polls, and subscriptions
- **Smart dedup** — when you're actively using the app, Zocial plays a sound and updates the notification tab without interrupting you with a popup. OS notifications only appear when you're away.

### In-app notifications
The Notifications tab is always on by default. Rich, descriptive content — *"Alice boosted your post"*, the first line of a mention — is generated from the live stream, so you see real context, not generic counts.

### ♿ Accessibility, by design

Zocial continues Enafore's tradition of treating keyboard and screen reader users as first-class citizens — not an afterthought. Every interactive element is reachable by keyboard. Posts carry rich, human-readable aria labels: author, content, privacy level, timestamp, media descriptions, and link preview card titles — navigating with `j`/`k` gives screen readers the full picture.

An optional **Announce link preview descriptions** setting (*Settings → Accessibility*) lets users who want maximum verbosity hear the full card description too. A comprehensive set of keyboard shortcuts covers every common action — reply, boost, favourite, bookmark, quote, translate, open media, reveal content warnings, and more — with a built-in cheatsheet at any time via `h` or `?`.

### 🎨 A fresh look

Zocial ships with its own dark theme as the default — carefully considered colours, subtle contrast, and a visual identity that feels at home on modern displays. The focused post in a thread is marked with a delicate accent-coloured ring around the avatar. On mobile, @handles are hidden to let display names breathe.

### ⚡ A smarter timeline

Timelines tell you more at a glance. Reply, boost, and favourite counts appear as small, muted numbers beside their icons — informative without being loud. They respect your Wellness settings: hide boost counts, hide favourite counts, hide reply counts — all individually controllable.

Post headers work harder too. When a post is a reply, the header shows exactly who it's replying to — inline and consistent with boost headers throughout.

### 🧵 Thread bundles

Self-reply threads are automatically collapsed into a single bundle. The oldest post sits at the top with a `1/N` position counter, middle posts are hidden, and the newest post closes the bundle — keeping your timeline clean without losing context. Only same-author chains are bundled.

### ⬆️ Scroll to top, always within reach

A floating scroll-to-top button appears whenever you've scrolled down in any timeline — sits quietly out of the way until you need it, and takes you back in one tap.

## 🔝 Jump to the top of a conversation

Arrive in the middle of a thread via a reply or boost? A floating button takes you back to the start of the conversation. Shows only in thread views, otherwise stays out of the way.

### 🔇 Filters that warn, not vanish

Word filters set to *"hide with a warning"* behave as intended: matching posts stay in your timeline behind a collapsible **Filtered** notice you can reveal with a tap, instead of silently disappearing.

### Quick filter from any post
The three-dot context menu on every post includes an **Add filter** shortcut — open the word filter dialog without leaving the timeline. Filters apply instantly to all loaded posts, no refresh needed.

### #️⃣ Hashtags, first-class

Followed hashtags get their own header in the timeline — a subtle tag indicator confirming why a post appears in your feed. Tapping it takes you to the hashtag timeline. A long-press or right-click opens a context menu for follow/unfollow and more. A dedicated section in Settings lets you view and manage all your tag subscriptions in one place.

### 🔗 Links that stay in the app

Clicking a link to another Mastodon post or profile no longer kicks you out to a browser tab. Zocial recognises fediverse URLs and opens them inside the app wherever possible, with rich preview cards for links that don't resolve to known profiles or threads.

### 💬 Quote posts, everywhere

Quote any post from any server — no special backend required. Zocial uses a universal URL-in-text approach: the quoted post's URL is appended to your new post, and link preview cards display it inline. Works in every client, against every server.

Reachable from the context menu, the boost button (*Settings → Composer*), or the `q` keyboard shortcut. The composer opens with your cursor at the beginning so you can write your take first.

### 🌍 Post translation, privacy-first

Translate any post with a tap, via the context menu, or with the `t` keyboard shortcut. Zocial uses [LibreTranslate](https://libretranslate.com) — open-source, no Google dependency. Requests are routed server-side through nginx: no translation API ever called from the browser, no CORS workarounds, no third-party requests from your device.

The target language comes from your browser's language setting. If a post is already in your language, Zocial detects it and skips the request entirely. Admins can point Zocial at their own LibreTranslate instance via `TRANSLATE_API` in `.env`.

### 🔖 Bookmarks, with personality

The bookmark action lives directly in the reaction bar with a satisfying animation and a persistent indicator — so you always know which posts you've saved.

### ⏱️ Scheduled posts

Write now, post later. A clock button in the composer opens a date-and-time picker. A dedicated **Scheduled posts** page (under *Settings → Community*) lists everything in the queue, where you can reschedule or cancel before it's sent.

### 👤 Profiles at a glance

Every profile shows when the account joined, plus a compact **posting-activity bar** breaking down recent posts into originals, replies, and boosts — a quick read on how someone uses the fediverse before you follow. Hover for the full breakdown with percentages. *(Credits: [phanpy](https://github.com/cheeaun/phanpy))*

### ✏️ Edit your profile, in-app

Change your display name, bio, up to four metadata fields, avatar, and header image — all without leaving Zocial. Changes save via the standard Mastodon API and appear instantly.

### 👥 List management

Create and manage lists directly from within Zocial (GoToSocial support included). Add or remove accounts from a list via their profile menu — no detour to the server's web UI.

### 🗂️ Reply visibility & local-only posts

- **Unlisted replies** — optionally default every reply to unlisted, keeping conversations out of the public timeline (*Settings → Composer*)
- **Local-only posts** — on supported servers, default new posts to stay on your instance and never federate. The toggle greys out with a tooltip on unsupported instances.

### 🧭 Navigation that bends to you

The navigation bar is fully reorderable — drag on desktop, long-press on mobile. Two independent pin slots let you keep your most-visited pages always one tap away.

### 📏 Long posts, tamed

Set a character threshold at which long posts collapse with a "show more" toggle — essential on Akkoma instances where post length limits are lifted.

### 🛠️ Built-in logs

A **Logs** page (*Settings*) captures console output for troubleshooting. Logs survive a reload, can be copied to the clipboard in one tap, and are cleared on logout.

---

## 📦 Deployment

Zocial ships as a Docker image and can be deployed in minutes.

### Docker Compose

```yaml
# docker-compose.yaml
services:
  zocial:
    image: domoel/zocial:latest
    container_name: Zocial
    env_file: .env
    ports:
      - "6666:80"
```

```bash
cp .env.example .env
# edit .env — set SINGLE_INSTANCE=your.server.com to lock to one instance,
# or leave it empty to let users log in to any server.
docker compose up -d
```

The instance hostname is injected at container startup — **no rebuild required** to switch instances. Change `.env`, restart, done.

### Single-instance vs. multi-instance

| Mode | `.env` setting | Behaviour |
|---|---|---|
| Single-instance | `SINGLE_INSTANCE=your.server.com` | Login screen shows a direct button; no hostname input |
| Multi-instance | `SINGLE_INSTANCE=` *(empty or unset)* | Users can enter any instance hostname |

### Building from source

```bash
git clone https://git.ztfr.eu/Dome/Zocial
cd Enafore
npm install
npm run build        # output lands in __sapper__/export/
```

### Development

```bash
npm install
npm run dev          # dev server at http://localhost:4002
```

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `SINGLE_INSTANCE` | *(unset)* | Lock the client to a specific instance hostname |
| `PORT` | `80` | Host port exposed by the Docker container |
| `LOCALE` | `en-US` | UI locale baked in at build time (`de`, `es`, `fr`) |
| `TRANSLATE_API` | `https://translate.zocial.social` | Base URL of a [LibreTranslate](https://libretranslate.com)-compatible translation backend |

### Post translation

Zocial routes translation requests through the nginx container so no credentials are ever exposed to the browser and no CORS headers are required. **Default backend:** a self-hosted LibreTranslate instance operated by Zocial, available to users of [zocial.social](https://zocial.social). Admins running their own deployment should point `TRANSLATE_API` at their own LibreTranslate instance — see `.env.example` for details.

---

## 🛟 Support

See the [user guide](docs/User-Guide.md) for general usage and the [admin guide](docs/Admin-Guide.md) if your instance has trouble connecting.

For further support or to participate in development, join the [Zeitfresser Matrix Community](https://ztfr.eu/matrix) or the [Development & Support Channel](https://look.ztfr.eu/#/#support:ztfr.eu).

Zocial is a non-profit project and free to use — [donations](https://www.paypal.com/donate/?hosted_button_id=QMWFH4FDXN66C) are entirely optional but always appreciated. 💙

---

## 📜 License

Zocial is free software, released under the [GNU Affero General Public License v3](LICENSE).
