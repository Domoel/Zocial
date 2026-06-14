export const TIMELINE_BATCH_SIZE = 20
// Smaller batch for list timelines: the server assembles a per-list feed, so fewer items = a
// cheaper, faster query (especially on GoToSocial). Infinite scroll + streaming fill the rest in,
// so the smaller first page is barely noticeable. Tune up toward TIMELINE_BATCH_SIZE if it feels
// sparse.
export const LIST_BATCH_SIZE = 10

// `label` holds the i18n message KEY (without `intl.` prefix), resolved at render time via
// $messages so it follows the live UI language instead of freezing at the boot locale.
export const timelines = {
  home: { name: 'home', label: 'home' },
  local: { name: 'local', label: 'local' },
  bubble: { name: 'bubble', label: 'bubble' },
  federated: { name: 'federated', label: 'federated' }
}
