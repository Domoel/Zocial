export function canonicalStatusUrl (status) {
  // GoToSocial (and some federated edge cases) can return a status whose `url` is null/empty or
  // otherwise not a valid absolute URL. `new URL()` then throws, which — because this runs inside a
  // Status component computed — crashes the component while it's being constructed and cascades into
  // Svelte teardown errors (parentNode/src/emojis of undefined) across the whole timeline. Fall back
  // to the ActivityPub `uri`, and finally to a plain id-only status route, instead of throwing.
  try {
    const fallbackUrl = new URL(status.url || status.uri)
    return `/statuses/${status.id}/${fallbackUrl.hostname}${fallbackUrl.pathname}`
  } catch (e) {
    return `/statuses/${status.id}`
  }
}
