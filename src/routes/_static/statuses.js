export const POST_PRIVACY_OPTIONS = [
  {
    label: 'intl.public',
    key: 'public',
    icon: '#fa-globe'
  },
  {
    label: 'intl.unlisted',
    key: 'unlisted',
    icon: '#fa-unlock'
  },
  {
    label: 'intl.followersOnly',
    key: 'private',
    icon: '#fa-lock'
  },
  {
    label: 'intl.direct',
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
export const LONG_POST_TEXT = 'intl.longPost'
// Shown as the spoiler/warning text for posts matching a "hide with a warning" word filter.
export const FILTERED_TEXT = 'intl.filtered'

export const MAX_STATUS_CHARS = 500
export const MAX_STATUS_MEDIA_ATTACHMENTS = 4
export const MAX_STATUS_POLL_OPTIONS = 4
