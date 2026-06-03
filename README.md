<p align="center">
  <a href="https://ztfr.eu/matrix">
    <img src="/static/icons/favicon.avif" alt="Join Zeitfresser Matrix Community" height="70" />
  </a>
</p>

<h1 align="center">
Zocial
</h1>

<h4 align="center">
A beautifully refined fediverse client — built for the edges of the Mastodon ecosystem.
</h4>

<h6 align="center">
  <a href="https://zocial.ztfr.eu">🌐 Live Instance</a>
  ·
  <a href="https://ztfr.eu">🏰 Website</a>
  ·
  <a href="https://ztfr.eu/matrix">📰 Matrix Community</a>
  ·
  <a href="https://social.ztfr.eu/@dome">🐘 Mastodon</a>
  ·
  <a href="https://look.ztfr.eu/#/#support:ztfr.eu">💬 Support</a>
</h6>

<br>

## ✨ Introduction

Zocial is a fork of [Enafore](https://github.com/enafore/enafore), itself born from the legendary Pinafore. Where Enafore focuses on broad compatibility, Zocial goes a step further — polishing the rough edges, adding quality-of-life features, and tuning the experience for servers running **Akkoma**, **glitch-soc**, and **Iceshrimp**. It's fast, keyboard-friendly, and works beautifully on both desktop and mobile.

## 🚀 What makes Zocial different

### A fresh look

Zocial ships with its own dark theme as the default — carefully considered colours, subtle contrast, and a visual identity that feels at home on modern displays. The focused post in a thread is marked with a delicate accent-coloured ring around the avatar instead of a jarring background flash. On mobile, @handles are hidden to let display names breathe.

### A smarter timeline

Timelines in Zocial tell you more at a glance. Reply, boost, and favourite counts appear as small, muted numbers beside their respective icons — informative without being loud. They respect your wellness settings: hide boost counts, hide favourite counts, hide reply counts — all individually controllable. In thread view, these numbers step back and let the full detail panel do its job.

Post headers work harder too. When a post is a reply, the header tells you exactly who it's replying to — inline and in the same visual language as boost headers, keeping the language consistent throughout.

### Thread bundles

Self-reply threads are automatically collapsed into a single bundle. The oldest post is shown at the top with a `1/N` position counter in the header, middle posts are hidden, and the newest post closes the bundle — keeping your timeline clean without losing context. Only same-author chains are bundled, so no other person's posts are ever hidden.

### Hashtags, first-class

Followed hashtags get their own header in the timeline — a subtle tag indicator that confirms why a post is appearing in your feed. Tapping that header takes you straight to the hashtag timeline. A long-press or right-click opens a context menu for follow, unfollow, and more.

### Links that stay in the app

Clicking a link to another Mastodon post or profile no longer kicks you out to a browser tab. Zocial recognises fediverse URLs and opens them inside the app wherever possible, with rich preview cards for links that don't resolve to known profiles or threads.

### Bookmarks, with personality

The bookmark action lives directly in the reaction bar with a satisfying animation and a persistent indicator — so you always know which posts you've saved, without hunting through the overflow menu.

### Navigation that bends to you

The navigation bar is fully reorderable — drag items on desktop, or long-press on mobile, into whatever sequence makes sense for how you actually use the app. You get two independent pin slots for your most-visited pages, and the Community tab has been folded into Settings to keep the nav clean.

### Long posts, tamed

Set a character threshold at which long posts collapse with a "show more" toggle — useful on Akkoma instances where post length limits are often lifted entirely.

### A settings panel that makes sense

The settings panel has been reorganised and extended — related controls are grouped together, and adjustments that felt buried or out of place have been moved to where you'd actually look for them.

### Two custom pin slots

The navigation bar has room for two fully customisable pin slots, sitting right alongside the fixed tabs. Pin any timeline, hashtag, or list you visit regularly and it's always one tap away — making full use of the space the nav bar offers.

### Manage followed hashtags

A dedicated section in Settings lets you view, follow, and unfollow hashtags without leaving the app — no more navigating to a hashtag timeline first. Manage all your tag subscriptions in one place.

### Desktop notifications

Fine-grained control over which interactions trigger a desktop or browser notification. Choose exactly which events you want to be alerted about — mentions, boosts, follows, favourites, or all of the above.

---

## 📦 Deployment

Zocial is distributed as a Docker image and can be deployed in minutes.

### Docker Compose

```bash
cp .env.example .env
# edit .env — set SINGLE_INSTANCE=your.server.com to lock to one instance,
# or leave it empty to let users log in to any server
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
git clone https://git.ztfr.eu/Dome/Enafore
cd Enafore
npm install
npm run build        # output lands in __sapper__/export/
```

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `SINGLE_INSTANCE` | *(unset)* | Lock the client to a specific instance hostname |
| `PORT` | `80` | Host port exposed by the Docker container |
| `LOCALE` | `en-US` | UI locale baked in at build time (`de`, `es`, `fr`, `ru-RU`) |

---

## 🛠 Development & Support

```bash
npm install
npm run dev          # dev server at http://localhost:4002
```

Refer to the [user guide](docs/User-Guide.md) for general usage, and the [admin guide](docs/Admin-Guide.md) if your instance has trouble connecting.

If you need support or want to participate in development, join the <a href="https://ztfr.eu/matrix">Zeitfresser Matrix Community</a> or the <a href="https://look.ztfr.eu/#/#support:ztfr.eu">Development & Support Channel</a> on Matrix.

---

## 📜 License

Zocial is free software, released under the [GNU Affero General Public License v3](LICENSE).
