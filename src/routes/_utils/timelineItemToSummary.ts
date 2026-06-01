import { computeFilterContextsForStatusOrNotification } from './computeFilterContextsForStatusOrNotification.js'
import { store } from '../_store/store.js'

export interface TimelineSummary {
  id: string
  accountId: string
  replyId: string | undefined
  reblogId: string | undefined
  quoteId: string | undefined
  statusId: string | undefined
  type: string | undefined
  filterContexts: unknown
  start: boolean
  end: boolean
  replies: undefined
  parent: undefined
  depth: number | undefined
  group: string | undefined
}

export function timelineItemToSummary(
  item: any,
  instanceName: string,
): TimelineSummary {
  // This is admittedly a weird place to do the filtering logic. But there are a few reasons to do it here:
  // 1. Avoid computing html-to-text (expensive) for users who don't have any filters (probably most users)
  // 2. Avoiding keeping the entire html-to-text in memory at all times for all summaries
  // 3. Filters probably change infrequently. When they do, we can just update the summaries
  const { unexpiredInstanceFilterRegexes } = store.get()
  const contextsToRegex = unexpiredInstanceFilterRegexes[instanceName]

  return {
    id: item.id,
    statusId: (item.status && item.status.id) || undefined,
    accountId: item.account.id,
    replyId: item.in_reply_to_id || undefined,
    reblogId: (item.reblog && item.reblog.id) || undefined,
    quoteId: item.quote_id || undefined,
    type: item.type || undefined,
    filterContexts: computeFilterContextsForStatusOrNotification(
      item,
      contextsToRegex,
    ),
    start: false,
    end: false,
    replies: undefined,
    parent: undefined,
    depth: undefined,
    group: undefined,
  }
}
