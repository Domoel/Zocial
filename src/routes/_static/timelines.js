export const TIMELINE_BATCH_SIZE = 20
// Smaller batch for list timelines: the server assembles a per-list feed, so fewer items = a
// cheaper, faster query (especially on GoToSocial). Infinite scroll + streaming fill the rest in,
// so the smaller first page is barely noticeable. Tune up toward TIMELINE_BATCH_SIZE if it feels
// sparse.
export const LIST_BATCH_SIZE = 10

export const timelines = {
  home: { name: 'home', label: 'intl.home' },
  local: { name: 'local', label: 'intl.local' },
  bubble: { name: 'bubble', label: 'intl.bubble' },
  federated: { name: 'federated', label: 'intl.federated' }
}
