import { mapBy } from './maps.js'

/**
 * Timeline types where consecutive self-thread chains should be bundled.
 * Intentionally a whitelist — new special timelines (favorites, bookmarks,
 * direct, account/media, etc.) are excluded by default.
 */
export const BUNDLEABLE_TIMELINE_TYPES = new Set(['home', 'local', 'federated', 'tag', 'list'])

/**
 * Detects consecutive self-thread chains in a timeline (newest-first order)
 * and marks each item with a threadPosition and threadIndex.
 *
 * A self-thread: same author, each post replies directly to the previous one.
 * Timeline is newest-first, so for chain [D, C, B, A]:
 *   summaries[i].replyId === summaries[i+1].id (D replies to C, etc.)
 *
 * Only bundles when ALL posts are by the same author (self-reply thread).
 * This matches Phanpy's approach: a thread is a deliberate, coherent chain
 * by one person. Mixed-author conversations are left unbundled so no other
 * user's context post is hidden.
 *
 * threadPosition values:
 *   'top'    — oldest post / thread starter (shown first, has header)
 *   'middle' — hidden posts between top and bottom
 *   'bottom' — newest post in chain (shown last)
 *   null     — not part of a thread chain
 *
 * threadIndex: 1-based chronological position within the chain
 */
export function markThreadBundles (summaries, prevBundled) {
  const n = summaries.length

  // Opt 1: quick scan — if no adjacent same-author reply pair exists, return the
  // same array reference so downstream computeds and the virtual list skip remeasurement.
  let hasCandidate = false
  for (let i = 0; i < n - 1; i++) {
    const s = summaries[i]
    const next = summaries[i + 1]
    if (
      !s.reblogId && !s.type && s.replyId &&
      !next.reblogId && !next.type &&
      s.replyId === next.id &&
      s.accountId === next.accountId
    ) {
      hasCandidate = true
      break
    }
  }
  if (!hasCandidate) return summaries

  // Opt 2: build a lookup of the previous bundled result keyed by item id so
  // that items whose threadPosition, chainLength and threadIndex are unchanged
  // can reuse their old object reference — prevents the virtual list from
  // treating them as changed items and triggering unnecessary height remeasurement.
  const prevById = prevBundled ? mapBy(prevBundled, s => s.id) : null

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

    // Walk forward: detect a same-author reply chain
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
      // Reverse the physical order: oldest post (summaries[j-1]) goes to result[i] as 'top'
      // so it renders first (visually at top) with the thread header.
      // Newest post (summaries[i]) goes to result[j-1] as 'bottom'.
      // threadIndex is the 1-based chronological position (top = 1, bottom = chainLength).
      result[i] = stableRef(prevById, summaries[j - 1], 'top', chainLength, 1)
      for (let k = i + 1; k < j - 1; k++) {
        const threadIndex = k - i + 1
        result[k] = stableRef(prevById, summaries[j - 1 - (k - i)], 'middle', chainLength, threadIndex)
      }
      result[j - 1] = stableRef(prevById, summaries[i], 'bottom', chainLength, chainLength)
      i = j
    } else {
      // Not a chain — pass through, clearing any stale values from a previous run
      result[i] = clearIfStale(s)
      i++
    }
  }

  return result
}

function stableRef (prevById, source, position, chainLength, threadIndex) {
  if (prevById) {
    const prev = prevById.get(source.id)
    if (
      prev &&
      prev.threadPosition === position &&
      prev.threadChainLength === chainLength &&
      prev.threadIndex === threadIndex
    ) {
      return prev
    }
  }
  return { ...source, threadPosition: position, threadChainLength: chainLength, threadIndex }
}

function clearIfStale (s) {
  return (s.threadPosition != null || s.threadChainLength != null || s.threadIndex != null)
    ? { ...s, threadPosition: null, threadChainLength: null, threadIndex: null }
    : s
}
