import { createRegexFromFilters } from '../../_utils/createRegexFromFilters.js'
import { WORD_FILTER_CONTEXTS } from '../../_static/wordFilters.js'

export function wordFilterComputations (store) {
  // unexpiredInstanceFilters is calculated based on `now` and `instanceFilters`,
  // but it's computed with observers rather than compute() to avoid excessive recalcs
  store.compute(
    'currentFilters',
    ['unexpiredInstanceFilters', 'currentInstance'],
    (unexpiredInstanceFilters, currentInstance) => unexpiredInstanceFilters[currentInstance] || []
  )

  // Build per-context regexes, split by filter action (Mastodon v1 filters API):
  //  - `irreversible: true`  → "Drop"               → matching posts are removed from the timeline
  //  - `irreversible: false` → "Hide with a warning" → matching posts are shown behind a "Filtered" warning
  // Unknown/missing `irreversible` defaults to the *warn* bucket, so we never silently drop a post.
  function buildContextRegexes (unexpiredInstanceFilters, predicate) {
    return Object.fromEntries(Object.entries(unexpiredInstanceFilters).map(([instanceName, filters]) => {
      const contextsToRegex = Object.fromEntries(WORD_FILTER_CONTEXTS.map(context => {
        const filtersForThisContext = filters.filter(_ => predicate(_) && _.context.includes(context))
        if (!filtersForThisContext.length) {
          return undefined // don't bother even adding it to the map
        }
        const regex = createRegexFromFilters(filtersForThisContext)
        return [context, regex]
      }).filter(Boolean))
      return [instanceName, contextsToRegex]
    }))
  }

  // NOTE: this map now contains ONLY "hide"/irreversible filters. It feeds filterContexts
  // (see timelineItemToSummary.ts) which drives the drop logic in createFilterFunction.js.
  store.compute('unexpiredInstanceFilterRegexes', ['unexpiredInstanceFilters'], unexpiredInstanceFilters => {
    return buildContextRegexes(unexpiredInstanceFilters, filter => !!filter.irreversible)
  })

  // "warn"/non-irreversible filters. Matching posts are kept and collapsed behind a
  // "Filtered" spoiler warning (see Status.html → filterWarning / computedSpoilerText).
  store.compute('unexpiredInstanceFilterWarnRegexes', ['unexpiredInstanceFilters'], unexpiredInstanceFilters => {
    return buildContextRegexes(unexpiredInstanceFilters, filter => !filter.irreversible)
  })
}
