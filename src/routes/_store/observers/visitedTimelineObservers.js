// Every visited thread, profile, list and tag keeps its posts in memory until logout, so a tab left
// open for days collects a few MB and slows the scans that run across all timelines (thread
// updates, filter changes). Keep the most recently visited ones plus the always-streamed ones;
// revisiting an evicted timeline simply loads it again (the virtual list only remembers 10 anyway).
export const MAX_KEPT_TIMELINES = 30
const ALWAYS_KEPT = new Set(['home', 'notifications', 'notifications/mentions'])

// instance -> timeline names, least recently visited first
const visited = {}

const accountIdOf = timelineName => {
  const match = /^account\/([^/]+)/.exec(timelineName)
  return match && match[1]
}

export function recordVisitedTimeline (store, instanceName, timelineName) {
  if (!instanceName || !timelineName || ALWAYS_KEPT.has(timelineName)) {
    return
  }
  const list = (visited[instanceName] || []).filter(name => name !== timelineName)
  list.push(timelineName)
  const evicted = list.length > MAX_KEPT_TIMELINES ? list.splice(0, list.length - MAX_KEPT_TIMELINES) : []
  visited[instanceName] = list
  if (!evicted.length) {
    return
  }
  store.clearTimelineData(instanceName, evicted)
  // pinned posts are loaded per profile; drop those of profiles no kept timeline shows
  const { pinnedStatuses } = store.get()
  const keptAccounts = new Set(list.map(accountIdOf).filter(Boolean))
  const instancePinned = pinnedStatuses && pinnedStatuses[instanceName]
  if (instancePinned) {
    let changed = false
    for (const accountId of evicted.map(accountIdOf).filter(Boolean)) {
      if (!keptAccounts.has(accountId) && accountId in instancePinned) {
        delete instancePinned[accountId]
        changed = true
      }
    }
    if (changed) {
      store.set({ pinnedStatuses })
    }
  }
}

export function visitedTimelineObservers (store) {
  store.observe('currentTimeline', currentTimeline => {
    recordVisitedTimeline(store, store.get().currentInstance, currentTimeline)
  })
}
