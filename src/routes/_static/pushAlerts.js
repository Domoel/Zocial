// Single source of truth for the Web Push alert types — the Mastodon
// `/api/v1/push/subscription` alert keys plus their settings labels. Used by the push settings
// UI and by the actions that register a subscription, so the list never drifts between them.
export const PUSH_ALERT_OPTIONS = [
  { key: 'follow', label: 'intl.newFollowers' },
  { key: 'favourite', label: 'intl.favorites' },
  { key: 'reblog', label: 'intl.reblogs' },
  { key: 'mention', label: 'intl.mentions' },
  { key: 'poll', label: 'intl.pollResults' },
  { key: 'status', label: 'intl.subscriptions' }
]

// { follow: true, favourite: true, … } — every alert type enabled, for first-time registration.
export const ALL_PUSH_ALERTS = PUSH_ALERT_OPTIONS.reduce((acc, opt) => {
  acc[opt.key] = true
  return acc
}, {})
