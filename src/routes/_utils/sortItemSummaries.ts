import { mark, stop } from './marks.js'
import { compareTimelineItemSummaries } from './statusIdSorting.js'
import { TimelineSummary } from './timelineItemToSummary.js'

export function sortItemSummariesForThread(
  _summaries: TimelineSummary[],
  statusId: string,
) {
  mark('sortItemSummariesForThread')
  try {
    type TreeItem = Omit<TimelineSummary, 'replies' | 'parent'> & {
      replies: TreeItem[] | undefined
      parent: TreeItem | undefined
    }
    const summariesById = new Map<string, TreeItem>()
    const summariesByParentId = new Map<string, TreeItem[]>()
    const summaries: TreeItem[] = []
    for (const _summary of _summaries) {
      const summary = { ..._summary } as TreeItem
      summaries.push(summary)
      summary.start = false
      summary.end = false
      summariesById.set(summary.id, summary)
      if (summary.replyId) {
        const array = summariesByParentId.get(summary.replyId)
        if (array) {
          array.push(summary)
        } else {
          summariesByParentId.set(summary.replyId, [summary])
        }
      }
    }

    const status = summariesById.get(statusId)
    if (!status) {
      // bail out, for some reason we can't find the status (should never happen)
      console.warn(`couldn't find status ${statusId} in`, _summaries)
      return _summaries
    }

    let orphans: TreeItem[] = []
    for (const summary of summaries) {
      if (!summariesById.has(summary.replyId!)) {
        orphans.push(summary as unknown as TreeItem)
      }
    }
    const treeify =
      (parent: TreeItem | undefined) =>
      (summary: TreeItem): TreeItem => {
        summary.replies = (
          (summariesByParentId.get(summary.id) || []) as unknown as TreeItem[]
        ).map(treeify(summary))
        summary.parent = parent
        return summary
      }
    orphans = orphans.map(treeify(undefined)).sort(compareTimelineItemSummaries)
    const ancestors: TreeItem[] = []
    let top = status as unknown as TreeItem
    while (top.parent) {
      top = top.parent
      top.depth = 0
      ancestors.unshift(top)
    }
    function flatten(summary: TreeItem): TreeItem[] {
      summary.depth = summary.parent ? summary.parent.depth! + 1 : 0
      return [
        summary,
        ...summary.replies!.sort(compareTimelineItemSummaries).map(flatten),
      ].flat()
    }
    status.start = true
    status.depth = 0
    const subtree = [status, ...status.replies!.map(flatten)].flat()
    subtree[subtree.length - 1]!.end = true
    const newSummaries: TimelineSummary[] = orphans
      .map((summary) =>
        summary.id === top.id
          ? [
              ...ancestors.map((summary, i) => {
                summary.depth = i
                return summary
              }),
              ...subtree,
            ]
          : flatten(summary),
      )
      .flat()
      .map((summary) => {
        summary.parent = undefined
        summary.replies = undefined
        return summary as TimelineSummary
      })
    _summaries = newSummaries
  } catch (e) {
    console.warn('failed to sortItemSummariesForThread', e)
  }
  stop('sortItemSummariesForThread')
  return _summaries
}

export function sortItemSummariesForNotificationBatch(
  summaries: TimelineSummary[],
) {
  mark('sortItemSummariesForNotificationBatch')
  const obj: Record<string, TimelineSummary[]> = {}
  for (const summary of summaries) {
    if (
      summary.statusId &&
      summary.type !== 'mention' &&
      summary.type !== 'status'
    ) {
      const key = 's' + summary.statusId
      summary.group = key
      ;(obj[key] = obj[key] || []).push(summary)
    } else {
      const key = 'n' + summary.id
      summary.group = key
      obj[key] = [summary]
    }
  }
  summaries = Object.values(obj).flat()
  stop('sortItemSummariesForNotificationBatch')
  return summaries
}
