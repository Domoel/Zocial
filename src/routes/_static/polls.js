// Someday we can maybe replace this with Intl.DurationFormat
// https://github.com/tc39/proposal-intl-duration-format
// `label` holds the i18n message KEY (without `intl.` prefix), resolved at render time via
// $messages so it follows the live UI language instead of freezing at the boot locale.
export const POLL_EXPIRY_OPTIONS = [
  {
    value: 300,
    label: 'fiveMinutes'
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
    value: 86400,
    label: 'oneDay'
  },
  {
    value: 259200,
    label: 'threeDays'
  },
  {
    value: 604800,
    label: 'sevenDays'
  },
  {
    value: 1209600,
    label: 'fourteenDays'
  },
  {
    value: 2592000,
    label: 'thirtyDays'
  },
  {
    value: 31536000,
    label: 'oneYear'
  }
]
