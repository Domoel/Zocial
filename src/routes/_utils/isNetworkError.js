// Network/HTTP failures (failed fetch, timeouts, non-2xx responses) are infrastructure noise,
// not code bugs. Callers use this to log them as warnings instead of errors so that genuine
// bugs stay visually distinct.
//
// A failed fetch surfaces with a different message per engine:
//   Chrome  "Failed to fetch"
//   Firefox "NetworkError when attempting to fetch resource"
//   Safari  "Load failed"
const FETCH_FAILED = /failed to fetch|networkerror when attempting to fetch|load failed/i
// Our own ajax layer: request timeouts and non-2xx responses.
const OTHER_NETWORK = /timed out after|request failed:\s*\d{3}/i

// A failed fetch is reported by the browser as a TypeError. We only treat the fetch-failed
// wording as noise for genuine TypeErrors, so a custom error message that merely contains
// e.g. "failed to fetch …" isn't misclassified. Timeouts / HTTP errors come from our own
// ajax layer with any Error type, so they're matched unconditionally.
export function isNetworkNoiseError (err) {
  if (!err) {
    return false
  }
  const message = String(err.message || err)
  if (err instanceof TypeError && FETCH_FAILED.test(message)) {
    return true
  }
  return OTHER_NETWORK.test(message)
}
