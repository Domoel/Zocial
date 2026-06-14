// Single source of truth for the Web Push alert types — the Mastodon
// `/api/v1/push/subscription` alert keys plus their settings labels. Used by the push settings
// UI and by the actions that register a subscription, so the list never drifts between them.
// `label` holds the i18n message KEY (without `intl.` prefix), resolved at render time via
// $messages so it follows the live UI language instead of freezing at the boot locale.
export const PUSH_ALERT_OPTIONS = [
  { key: 'follow', label: 'newFollowers' },
  { key: 'favourite', label: 'favorites' },
  { key: 'reblog', label: 'reblogs' },
  { key: 'mention', label: 'mentions' },
  { key: 'poll', label: 'pollResults' },
  { key: 'status', label: 'subscriptions' }
]

// { follow: true, favourite: true, … } — every alert type enabled, for first-time registration.
export const ALL_PUSH_ALERTS = PUSH_ALERT_OPTIONS.reduce((acc, opt) => {
  acc[opt.key] = true
  return acc
}, {})
