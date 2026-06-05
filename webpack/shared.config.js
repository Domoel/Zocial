import svgs from '../bin/svgs.js'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { themes } from '../src/routes/_static/themes.js'

export const inlineSvgs = svgs.filter(_ => _.inline).map(_ => `#${_.id}`)
export const mode = process.env.NODE_ENV || 'production'
export const dev = mode === 'development'

export const resolve = {
  extensions: ['.js', '.json', '.html'],
  mainFields: ['svelte', 'module', 'browser', 'main'],
  alias: {
    // All browsers we target support Intl.PluralRules (or it's polyfilled).
    // So format-message-interpret can fall back to that. This file is pretty big (9.83kB) and it's not needed.
    './plurals': 'lodash-es/noop.js',
    'lookup-closest-locale': 'lodash-es/noop.js',
    'svelte/store.umd.js': 'svelte/store.js'
  }
}

// --- App version (manually bumped in package.json; always available, even in Docker) ---
let appVersion = '0.0.0'
try {
  // Read relative to the build's working directory (repo root). We can't rely on
  // import.meta.url here because this file is bundled into webpack.config.cjs (CJS).
  appVersion = JSON.parse(readFileSync('package.json', 'utf8')).version || appVersion
} catch (e) { /* keep fallback */ }

export const version = appVersion

// --- Release channel: 'prod' for the main branch, 'dev' otherwise ---
// ZOCIAL_CHANNEL is injected by the Docker build (build-arg, set by CI from the branch).
// Outside Docker we fall back to the current git branch, then to 'dev'.
let branch = process.env.ZOCIAL_CHANNEL
if (!branch) {
  try {
    branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
  } catch (e) { /* no git available */ }
}
export const channel =
  (branch === 'main' || branch === 'prod' || branch === 'stable') ? 'prod' : 'dev'

export const inlineThemeColors = Object.fromEntries(
  themes.map(_ => ([_.name, _.color]))
)

export const isUpstream =
  process.env.GITHUB_REPOSITORY === 'enafore/enafore'
