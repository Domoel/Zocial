/**
 * Detects consecutive self-thread chains in a timeline (newest-first order)
 * and marks each item with a threadPosition.
 *
 * A self-thread: same author, each post replies directly to the previous one.
 * Timeline is newest-first, so for chain [D, C, B, A]:
 *   summaries[i].replyId === summaries[i+1].id (D replies to C, etc.)
 *
 * threadPosition values:
 *   'top'    — newest post in chain (shown fully, connecting line below avatar)
 *   'middle' — hidden posts between top and bottom
 *   'bottom' — oldest post / thread starter (shown fully, connecting line above avatar)
 *   null     — not part of a thread chain
 */
export function markThreadBundles (summaries) {
  const result = summaries.map(s => s.threadPosition ? { ...s, threadPosition: null, threadChainLength: undefined } : s)

  let i = 0
  while (i < result.length) {
    const curr = result[i]

    // Skip boosts, notifications, and items already in own-thread view
    if (curr.reblogId || curr.type) {
      i++
      continue
    }

    // Walk forward to find the extent of a consecutive same-author reply chain
    let j = i + 1
    while (
      j < result.length &&
      !result[j].reblogId &&
      !result[j].type &&
      result[j - 1].replyId === result[j].id &&
      result[j].accountId === result[i].accountId
    ) {
      j++
    }

    const chainLength = j - i

    if (chainLength >= 2) {
      const len = chainLength
      result[i] = { ...result[i], threadPosition: 'top', threadChainLength: len }
      for (let k = i + 1; k < j - 1; k++) {
        result[k] = { ...result[k], threadPosition: 'middle', threadChainLength: len }
      }
      result[j - 1] = { ...result[j - 1], threadPosition: 'bottom', threadChainLength: len }
      i = j
    } else {
      i++
    }
  }

  return result
}
