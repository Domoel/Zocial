export const WORD_FILTER_CONTEXT_HOME = 'home'
export const WORD_FILTER_CONTEXT_NOTIFICATIONS = 'notifications'
export const WORD_FILTER_CONTEXT_PUBLIC = 'public'
export const WORD_FILTER_CONTEXT_THREAD = 'thread'
export const WORD_FILTER_CONTEXT_ACCOUNT = 'account'

export const WORD_FILTER_CONTEXTS = [
  WORD_FILTER_CONTEXT_HOME,
  WORD_FILTER_CONTEXT_NOTIFICATIONS,
  WORD_FILTER_CONTEXT_PUBLIC,
  WORD_FILTER_CONTEXT_THREAD,
  WORD_FILTER_CONTEXT_ACCOUNT
]

// Someday we can maybe replace this with Intl.DurationFormat
// https://github.com/tc39/proposal-intl-duration-format
// `label` holds the i18n message KEY (without `intl.` prefix), resolved at render time via
// $messages so it follows the live UI language instead of freezing at the boot locale.
export const WORD_FILTER_EXPIRY_OPTIONS = [
  {
    value: 0,
    label: 'never'
  },
  {
    value: 1800,
    label: 'thirtyMinutes'
  },
  {
    value: 3600,
    label: 'oneHour'
  },
  {
    value: 21600,
    label: 'sixHours'
  },
  {
    value: 43200,
    label: 'twelveHours'
  },
  {
    value: 86400,
    label: 'oneDay'
  },
  {
    value: 604800,
    label: 'sevenDays'
  }
]

export const WORD_FILTER_EXPIRY_DEFAULT = 0
