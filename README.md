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
  <a href="https://ztfr.eu">🏰 Website</a>
  ·
  <a href="https://ztfr.eu/matrix">📰 Matrix Community</a>
  ·
  <a href="https://social.ztfr.eu/@dome">🐘 Mastodon</a> 
  ·
  <a href="https://look.ztfr.eu/#/#support:ztfr.eu">💬 Support</a> 
</h6>

Zocial is a fork of Zocial is a fork of <a href="https://github.com/enafore/enafore">Enafore</a>,  itself born from the legendary Pinafore. Where Enafore focuses on broad compatibility, Zocial goes a step further — polishing the rough edges, adding quality-of-life features, and tuning the experience for servers running **Akkoma**, **glitch-soc**, and **Iceshrimp**. It's fast, keyboard-friendly, and works beautifully on both desktop and mobile.

---

## What makes Zocial different

### A fresh look

Zocial ships with its own dark theme as the default — carefully considered colours, subtle contrast, and a visual identity that feels at home on modern displays. The settings UI has been rebuilt to feel coherent and intentional, rather than a collection of bolted-on panels. Small details matter: the focused post in a thread is marked with a delicate accent-coloured ring around the avatar instead of a jarring background flash. On mobile, @handles are hidden to let display names breathe.

### A smarter timeline

Timelines in Zocial tell you more at a glance. Reply, boost, and favourite counts appear as small, muted numbers beside their respective icons — informative without being loud. They respect your wellness settings: hide boost counts, hide favourite counts, hide reply counts — all individually controllable. In thread view, these numbers step back and let the full detail panel do its job.

Post headers work harder too. When a post is a reply, the header tells you who it's replying to. When a boost is of a reply, that's indicated distinctly. The logic mirrors how boosts work, keeping the visual language consistent throughout.

### Hashtags, first-class

Followed hashtags get their own header in the timeline — a subtle tag indicator that confirms why a post is appearing in your feed. Tapping that header takes you straight to the hashtag timeline. A long-press or right-click opens a context menu for follow, unfollow, and more. The hashtag header is smart enough to hide itself on subdomain-style tag timelines where it would be redundant.

### Links that stay in the app

Clicking a link to another Mastodon post or profile no longer kicks you out to a browser tab. Zocial recognises fediverse URLs and opens them inside the app wherever possible, with rich preview cards for links that don't resolve to known profiles or threads. Cross-instance navigation feels native, not bolted on.

### Long posts, tamed

Zocial lets you set a character threshold at which long posts collapse with a "show more" toggle. Useful on Akkoma instances where post length limits are often lifted entirely.

### Bookmarks, with personality

The bookmark action comes with a satisfying animation and a persistent indicator in the reaction bar so you always know at a glance which posts you've saved.

### Navigation that bends to you

The navigation bar is fully reorderable — drag items into whatever sequence makes sense for how you actually use the app. You get two independent pin slots for your most-visited pages, and the Community tab has been folded into Settings to keep the nav clean.

---

## Deployment

Zocial is distributed as a Docker image and can be deployed in minutes.

### Docker Compose

Pull the image, create your environment file, and start:

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
| `SINGLE_INSTANCE` | *(unset)* | Lock the client to a specific instance hostname. |
| `PORT` | `80` | Host port exposed by the Docker container. |
| `LOCALE` | `en-US` | UI locale baked in at build time. |

---

## Development

```bash
npm install
npm run dev          # dev server at http://localhost:4002
```

Refer to the [user guide](https://git.ztfr.eu/Dome/Enafore/src/branch/main/docs/User-Guide.md) for general usage, and the [admin guide](https://git.ztfr.eu/Dome/Enafore/src/branch/main/docs/Admin-Guide.md) if your instance has trouble connecting.

---

## License

Zocial is free software, released under the [GNU Affero General Public License v3](https://git.ztfr.eu/Dome/Enafore/src/branch/main/LICENSE).
