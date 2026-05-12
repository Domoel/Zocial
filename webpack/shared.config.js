import svgs from '../bin/svgs.js'
import { execSync } from 'child_process'
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

// --- Git metadata (safe fallback for Docker/CI environments) ---
let commitCount = '0'
let commitHash = 'dev'

try {
  commitCount = process.env.GIT_COMMIT_COUNT ||
    execSync('git rev-list --count HEAD').toString().trim()

  commitHash = process.env.GIT_COMMIT_HASH ||
    execSync('git rev-parse --short HEAD').toString().trim()
} catch (e) {
  // No git available (e.g. Docker build without .git)
  // Fallback values already set above
}

export const version = 'v' + commitCount + '-' + commitHash

export const inlineThemeColors = Object.fromEntries(
  themes.map(_ => ([_.name, _.color]))
)

export const isUpstream =
  process.env.GITHUB_REPOSITORY === 'enafore/enafore'
