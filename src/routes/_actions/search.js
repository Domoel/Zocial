import { store } from '../_store/store.js'
import { toast } from '../_components/toast/toast.js'
import { search } from '../_api/search.js'
import { formatIntl } from '../_utils/formatIntl.js'
import { logActionError } from '../_utils/isNetworkError.js'
import { rehydrateStatusOrNotification } from './rehydrateStatusOrNotification.js'

export async function doSearch () {
  const { currentInstance, accessToken, queryInSearch } = store.get()
  store.set({ searchLoading: true })
  try {
    const results = await search(currentInstance, accessToken, queryInSearch)
    const { queryInSearch: newQueryInSearch } = store.get() // avoid race conditions
    await Promise.all(
      results.statuses.map(status => rehydrateStatusOrNotification({ status }))
    )
    if (newQueryInSearch === queryInSearch) {
      store.set({
        searchResultsForQuery: queryInSearch,
        searchResults: results
      })
    }
  } catch (e) {
    /* no await */ toast.say(
      formatIntl('intl.searchError', { error: e.message || String(e) })
    )
    logActionError('search', e)
  } finally {
    store.set({ searchLoading: false })
  }
}
