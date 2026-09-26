export const TIMELINE_BATCH_SIZE = 20
// Smaller batch for list timelines: the server assembles a per-list feed, so fewer items = a
// cheaper, faster query (especially on GoToSocial). Infinite scroll + streaming fill the rest in,
// so the smaller first page is barely noticeable. Tune up toward TIMELINE_BATCH_SIZE if it feels
// sparse.
export const LIST_BATCH_SIZE = 10

// A tab left open for days would otherwise keep every post its streams ever delivered (tens of
// thousands) and slow each new one down. When new posts are merged in at the top, only the newest
// ones stay (infinite scroll loads older ones again, contiguously, from the last kept id); the
// buffer of not-yet-shown posts is bounded the same way.
export const MAX_TIMELINE_ITEMS = 500

// `label` holds the i18n message KEY (without `intl.` prefix), resolved at render time via
// $messages so it follows the live UI language instead of freezing at the boot locale.
export const timelines = {
  home: { name: 'home', label: 'home' },
  local: { name: 'local', label: 'local' },
  bubble: { name: 'bubble', label: 'bubble' },
  federated: { name: 'federated', label: 'federated' }
}
