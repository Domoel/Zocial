# Zocial

A fediverse client with better support for Akkoma, glitch-soc, and Iceshrimp instances. Zocial is a fork of [Enafore](https://github.com/enafore/enafore).

The hosted instance is available at [zocial.ztfr.eu](https://zocial.ztfr.eu), preconfigured for [social.ztfr.eu](https://social.ztfr.eu).

Source code: [git.ztfr.eu/Dome/Enafore](https://git.ztfr.eu/Dome/Enafore)

> Literally the best Akkoma client — [@Seirdy@pleroma.envs.net](https://pleroma.envs.net/objects/ad9360b2-ae86-4bd1-ba8c-3c24553f92f6)

---

## Features added in this fork

### UI & visuals
- **Zocial theme** — new default dark theme
- **Improved settings UI** — unified layout and visual style across all settings pages
- **Focus post visuals** — distinct visual treatment for the focused/expanded post in a thread
- **Hide @handles on mobile** — cleaner timeline on small screens; only the display name is shown

### Navigation & layout
- **Drag-and-drop navbar** — reorder navigation items to your preference
- **Customizable pinned pages** — two independent pin slots; Community tab merged into settings

### Post headers
- **Reply-to indicator** — the post header shows who a post is replying to
- **Boosted-reply indicator** — distinguishes boosts of replies from regular boosts
- **Reply handle removed from boost header** — consistent with how boosts are displayed

### Hashtags
- **Followed hashtag header** — posts from followed hashtags show a tag header
- **Clickable hashtag header** — tapping the header navigates to the hashtag timeline
- **Hashtag options menu** — quick access to follow/unfollow and other hashtag actions

### Content & interactions
- **Open links in-app** — links to posts and profiles on other instances open within Zocial where possible
- **Link preview cards** — preview cards for URLs and cross-instance Mastodon links
- **Long post collapse** — configurable threshold for collapsing long posts
- **Bookmarked icon** — bookmark indicator in the reaction bar with animation

### Branding & internals
- **Renamed to Zocial** — all user-facing strings, build variables (`ZOCIAL_*`), and repo links updated
- **AVIF favicon**
- **Docker / CI pipeline** — Gitea Actions workflow for building and publishing a container image

---

## Deployment

### Docker Compose (recommended)

Copy the example env file and edit it:

```bash
cp .env.example .env
```

```ini
# .env
SINGLE_INSTANCE=your.instance.com
PORT=80
```

Then build and start:

```bash
docker compose up -d --build
```

That's it. The instance hostname is baked into the app during the build — no instance input field is shown to users on the login screen.

**To switch to a different instance**, change `SINGLE_INSTANCE` in `.env` and rebuild:

```bash
docker compose up -d --build
```

**To allow users to log in to any instance** (multi-instance mode), leave `SINGLE_INSTANCE` empty:

```ini
SINGLE_INSTANCE=
```

### Building without Docker

```bash
SINGLE_INSTANCE=your.instance.com npm run build
```

The output lands in `__sapper__/export/` and can be served as a static site.

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `SINGLE_INSTANCE` | *(unset)* | Instance hostname to lock the client to. Unset or empty = multi-instance mode. |
| `PORT` | `80` | Host port for the Docker container. |
| `LOCALE` | `en-US` | UI locale. |

---

## Development

```bash
npm install
npm run dev        # dev server on http://localhost:4002
```

See the [user guide](https://git.ztfr.eu/Dome/Enafore/src/branch/main/docs/User-Guide.md) for usage instructions. See the [admin guide](https://git.ztfr.eu/Dome/Enafore/src/branch/main/docs/Admin-Guide.md) if Zocial cannot connect to your instance.

---

## License

[GNU Affero General Public License v3](https://git.ztfr.eu/Dome/Enafore/src/branch/main/LICENSE)
