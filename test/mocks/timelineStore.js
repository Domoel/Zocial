// The store surface the timeline actions use: per-timeline data, threads, instance data.
export const data = { timelineItemSummaries: {}, timelineItemSummariesToAdd: {}, freshUpdates: {} }
export const threads = {}
export const store = {
  get: () => ({ unexpiredInstanceFilterRegexes: {} }),
  getAllTimelineData: (instance, key) => data[key] || {},
  getForTimeline: (instance, timeline, key) => (data[key] || {})[timeline],
  setForTimeline (instance, timeline, obj) {
    for (const key of Object.keys(obj)) {
      (data[key] = data[key] || {})[timeline] = obj[key]
    }
  },
  getThreads: () => threads,
  getInstanceData: () => Promise.resolve()
}
