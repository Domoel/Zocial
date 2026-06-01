/**
 * Timeline types where consecutive self-thread chains should be bundled.
 * Intentionally a whitelist — new special timelines (favorites, bookmarks,
 * direct, account/media, etc.) are excluded by default.
 */
export const BUNDLEABLE_TIMELINE_TYPES = new Set(['home', 'local', 'federated', 'tag', 'list'])

/**
 * Detects consecutive self-thread chains in a timeline (newest-first order)
 * and marks each item with a threadPosition.
 *
 * A self-thread: same author, each post replies directly to the previous one.
 * Timeline is newest-first, so for chain [D, C, B, A]:
 *   summaries[i].replyId === summaries[i+1].id (D replies to C, etc.)
 *
 * Single-pass: reads from the input array for chain detection, writes results
 * to a new array. Items are only object-spread when their position changes or
 * stale values need clearing — no double-spread for chain items.
 *
 * threadPosition values:
 *   'top'    — newest post in chain (shown fully, connecting line below avatar)
 *   'middle' — hidden posts between top and bottom
 *   'bottom' — oldest post / thread starter (shown fully, connecting line above avatar)
 *   null     — not part of a thread chain
 */
export function markThreadBundles (summaries) {
  const n = summaries.length
  const result = new Array(n)

  let i = 0
  while (i < n) {
    const s = summaries[i]

    // Skip boosts and notifications — pass through, clearing any stale values
    if (s.reblogId || s.type) {
      result[i] = clearIfStale(s)
      i++
      continue
    }

    // Walk forward using the original summaries to detect a same-author reply chain
    let j = i + 1
    while (
      j < n &&
      !summaries[j].reblogId &&
      !summaries[j].type &&
      summaries[j - 1].replyId === summaries[j].id &&
      summaries[j].accountId === s.accountId
    ) {
      j++
    }

    const chainLength = j - i

    if (chainLength >= 2) {
      // Spread each item exactly once — directly into its final position
      result[i] = { ...s, threadPosition: 'top', threadChainLength: chainLength }
      for (let k = i + 1; k < j - 1; k++) {
        result[k] = { ...summaries[k], threadPosition: 'middle', threadChainLength: chainLength }
      }
      result[j - 1] = { ...summaries[j - 1], threadPosition: 'bottom', threadChainLength: chainLength }
      i = j
    } else {
      // Not a chain — pass through, clearing any stale values from a previous run
      result[i] = clearIfStale(s)
      i++
    }
  }

  return result
}

function clearIfStale (s) {
  return (s.threadPosition != null || s.threadChainLength != null)
    ? { ...s, threadPosition: null, threadChainLength: undefined }
    : s
}
