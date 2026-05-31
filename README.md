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

## Configuration

### Single instance mode

Zocial is built with a default instance (`social.ztfr.eu`). On the login screen no instance field is shown — the user is logged in to the configured instance directly.

To build for a **different instance**, pass `SINGLE_INSTANCE` at build time:

```bash
SINGLE_INSTANCE=mastodon.example.com npm run build
```

To build in **multi-instance mode** (show the instance input field so users can log in to any server), set the variable to an empty string:

```bash
SINGLE_INSTANCE= npm run build
```

### Other environment variables

| Variable | Description |
|---|---|
| `SINGLE_INSTANCE` | Hostname of the instance to lock the client to. Defaults to `social.ztfr.eu`. Set to empty string for multi-instance mode. |
| `LOCALE` | UI locale (default: `en-US`) |
| `UPSTREAM` | Set to any truthy value when building the canonical upstream instance |

---

## Development

```bash
npm install
npm run dev        # dev server on http://localhost:4002
npm run build      # production build
```

See the [user guide](https://git.ztfr.eu/Dome/Enafore/src/branch/main/docs/User-Guide.md) for usage instructions. See the [admin guide](https://git.ztfr.eu/Dome/Enafore/src/branch/main/docs/Admin-Guide.md) if Zocial cannot connect to your instance.

---

## License

[GNU Affero General Public License v3](https://git.ztfr.eu/Dome/Enafore/src/branch/main/LICENSE)
