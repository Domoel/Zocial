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
  <a href="https://zocial.social">🌐 Live Instance</a>
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

Zocial is a fork of [Enafore](https://github.com/enafore/enafore), itself born from the legendary Pinafore. Where Enafore focuses on broad compatibility, Zocial goes a step further — polishing the rough edges, adding quality-of-life features, and tuning the experience for servers running **Akkoma**, **glitch-soc**, **Iceshrimp**, and more. It's fast, fully keyboard-navigable, and designed to work well for everyone.

## 🚀 What makes Zocial different

### Accessibility, by design

Zocial continues Enafore's tradition of treating keyboard and screen reader users as first-class citizens — not an afterthought. Every interactive element is reachable by keyboard. Posts in a timeline carry rich, human-readable aria labels that include the author, content, privacy level, timestamp, media descriptions, and now link preview card titles — so navigating with `j`/`k` gives screen readers the full picture.

An optional **Announce link preview descriptions** setting (*Settings → Accessibility*) lets users who want maximum verbosity hear the full card description as well. A comprehensive set of keyboard shortcuts covers every common action — reply, boost, favourite, bookmark, quote, translate, open media, reveal content warnings, and more — with a built-in reference accessible at any time via `h` or `?`.

### A fresh look

Zocial ships with its own dark theme as the default — carefully considered colours, subtle contrast, and a visual identity that feels at home on modern displays. The focused post in a thread is marked with a delicate accent-coloured ring around the avatar instead of a jarring background flash. On mobile, @handles are hidden to let display names breathe.

### A smarter timeline

Timelines in Zocial tell you more at a glance. Reply, boost, and favourite counts appear as small, muted numbers beside their respective icons — informative without being loud. They respect your wellness settings: hide boost counts, hide favourite counts, hide reply counts — all individually controllable. In thread view, these numbers step back and let the full detail panel do its job.

Post headers work harder too. When a post is a reply, the header tells you exactly who it's replying to — inline and in the same visual language as boost headers, keeping the language consistent throughout.

### Thread bundles

Self-reply threads are automatically collapsed into a single bundle. The oldest post is shown at the top with a `1/N` position counter in the header, middle posts are hidden, and the newest post closes the bundle — keeping your timeline clean without losing context. Only same-author chains are bundled, so no other person's posts are ever hidden.

### Scroll to top, always within reach

A floating scroll-to-top button appears whenever you've scrolled down in any timeline — not just thread views. It sits quietly out of the way until you need it, and takes you back to the top in one tap or click.

### Jump to the top of a conversation

Arrive in the middle of a thread via a reply or a boost? A floating button appears as soon as you scroll past the first post and smoothly takes you back to the start of the conversation — so you can always find where it began. It shows only in thread views and otherwise stays out of the way.

### Filters that warn, not vanish

Word filters set to *"hide with a warning"* finally behave as intended: matching posts stay in your timeline behind a collapsible **Filtered** notice you can reveal with a tap, instead of silently disappearing — a quirk inherited all the way from Pinafore. Filters set to *"drop"* still remove matching posts entirely.

### Hashtags, first-class

Followed hashtags get their own header in the timeline — a subtle tag indicator that confirms why a post is appearing in your feed. Tapping that header takes you straight to the hashtag timeline. A long-press or right-click opens a context menu for follow, unfollow, and more.

### Links that stay in the app

Clicking a link to another Mastodon post or profile no longer kicks you out to a browser tab. Zocial recognises fediverse URLs and opens them inside the app wherever possible, with rich preview cards for links that don't resolve to known profiles or threads.

### Quote posts, everywhere

Quote a post from any server with a single action — no special backend support required. Zocial uses a universal URL-in-text approach: the quoted post's URL is appended to your new post, and link preview cards display it inline. The result looks good in every client and works against every server in the Fediverse.

Quote posts are reachable from the context menu (always), from the boost button (optional via *Settings → Composer*), or via the `q` keyboard shortcut. The composer opens with your cursor placed at the very beginning so you can write your take first, with the quoted URL ready at the end.

### Bookmarks, with personality

The bookmark action lives directly in the reaction bar with a satisfying animation and a persistent indicator — so you always know which posts you've saved, without hunting through the overflow menu.

### Scheduled posts

Write now, post later. A clock button in the composer opens a date-and-time picker — set when a post should go out (at least five minutes ahead) and your server takes it from there, publishing it at the chosen moment whether or not the app is open. A dedicated **Scheduled posts** page (under *Settings → Community*) lists everything in the queue, where you can reschedule or cancel any post before it's sent.

### Reply visibility, your way

Optionally default every reply to **unlisted** — handy for keeping back-and-forth conversations out of the public timeline — while never making a reply more public than the post it answers. Flip it on in *Settings → Composer*.

### Local-only posts, by default

On servers that support it, you can default every new post to **local-only** — kept on your own instance and never federated out. The toggle lives in *Settings → Composer*, and politely greys itself out (with a tooltip) on instances that don't support local-only, so you always know whether it applies.

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

### Lists that load on demand

Followers and following, muted and blocked accounts, who-boosted and who-favourited a post, and your scheduled posts all fetch more entries on demand with a **Load more** button — no longer capped at the first page.

### Desktop notifications

Fine-grained control over which interactions trigger a desktop or browser notification. Choose exactly which events you want to be alerted about — mentions, boosts, follows, favourites, or all of the above.

### Profiles at a glance

Every profile shows when the account joined, plus a compact **posting-activity** bar that breaks down their most recent posts into originals, replies, and boosts — a quick read on how someone actually uses the fediverse before you decide to follow. Hover the bar for the full breakdown with percentages. Credits to [phanpy](https://github.com/cheeaun/phanpy) for this awesome idea!

### Edit your profile, in-app

Update your profile without ever leaving Zocial. An **Edit profile** button on your own profile opens a dialog to change your display name, bio, and up to four metadata fields (your links), and to upload a new avatar and header image with a live preview. Changes save through the standard Mastodon API and appear instantly — no page reload, no detour to the web UI.

### Built-in logs

A **Logs** page (under *Settings*) captures the app's console output for troubleshooting — errors and warnings by default, with a toggle to show everything. Logs survive a reload, can be copied to the clipboard in a single tap (handy for bug reports), and are cleared on logout so nothing is left behind on shared devices.

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
| `LOCALE` | `en-US` | UI locale baked in at build time (`de`, `es`, `fr`, `ru-RU`) |
| `TRANSLATE_API` | `https://libretranslate.com` | Base URL of a [LibreTranslate](https://libretranslate.com)-compatible translation backend |

### Post translation

Zocial routes translation requests through the nginx container so no credentials are ever exposed to the browser and no CORS headers are required on the backend. The translation feature uses the [LibreTranslate](https://libretranslate.com) API — open-source, no Google dependency.

The default backend (`libretranslate.com`) works out of the box for casual use but is rate-limited (roughly 10 requests per minute without an API key). For a production deployment we recommend self-hosting your own LibreTranslate instance:

```yaml
# docker-compose.yaml
services:
  zocial:
    image: domoel/enafore:latest
    env_file: .env
    environment:
      - TRANSLATE_API=https://libretranslate.your-domain.com
```

Any LibreTranslate-compatible instance works — the client uses the standard `POST /translate` and `POST /detect` endpoints. LibreTranslate instances with `--req-limit 0` (no rate limit) or a configured API key are suitable; add `LIBRETRANSLATE_API_KEY` handling if your instance requires it.

---

## 🛠 Support

Refer to the [user guide](docs/User-Guide.md) for general usage, and the [admin guide](docs/Admin-Guide.md) if your instance has trouble connecting.

If you need further support or want to participate in development, join the <a href="https://ztfr.eu/matrix">Zeitfresser Matrix Community</a> or the <a href="https://look.ztfr.eu/#/#support:ztfr.eu">Development & Support Channel</a> on Matrix.

Zocial is a non-profit project and free to use — if you'd like to help cover the running costs of the public instance (domain and hosting), [donations](https://www.paypal.com/donate/?hosted_button_id=QMWFH4FDXN66C) are entirely optional but always appreciated.

---

## 📜 License

Zocial is free software, released under the [GNU Affero General Public License v3](LICENSE).
