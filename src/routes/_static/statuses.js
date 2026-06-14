// `label` holds the i18n message KEY (without the `intl.` prefix), resolved at render time by
// consumers via $messages / getMessage so it follows the live UI language. (Storing 'intl.x' here
// would make the loader inline it once at module load, freezing it at the boot locale.)
export const POST_PRIVACY_OPTIONS = [
  {
    label: 'public',
    key: 'public',
    icon: '#fa-globe'
  },
  {
    label: 'unlisted',
    key: 'unlisted',
    icon: '#fa-unlock'
  },
  {
    label: 'followersOnly',
    key: 'private',
    icon: '#fa-lock'
  },
  {
    label: 'direct',
    key: 'direct',
    icon: '#fa-envelope'
  }
]

export const KNOWN_CONTENT_TYPES = {
  default: {
    label: 'Default',
    icon: '#fa-file'
  },
  'text/plain': {
    label: 'Text',
    icon: '#fa-file-text'
  },
  'text/html': {
    label: 'HTML',
    icon: '#fa-code'
  },
  'text/markdown': {
    label: 'Markdown',
    icon: '#fa-markdown'
  },
  'text/x.misskeymarkdown': {
    label: 'Misskey Flavored Markdown',
    icon: '#misskey-logo'
  },
  'text/bbcode': {
    label: 'BBCode',
    icon: '#fa-bold'
  }
}

export const LONG_POST_LENGTH = 1024
// i18n message KEYS (without `intl.` prefix), resolved at render time via $messages so they follow
// the live UI language instead of freezing at the boot locale.
export const LONG_POST_TEXT = 'longPost'
// Shown as the spoiler/warning text for posts matching a "hide with a warning" word filter.
export const FILTERED_TEXT = 'filtered'

export const MAX_STATUS_CHARS = 500
export const MAX_STATUS_MEDIA_ATTACHMENTS = 4
export const MAX_STATUS_POLL_OPTIONS = 4
