import { favoriteStatus, unfavoriteStatus } from '../_api/favorite.js'
import { store } from '../_store/store.js'
import { toast } from '../_components/toast/toast.js'
import { database } from '../_database/database.js'
import { formatIntl } from '../_utils/formatIntl.js'
import { logActionError } from '../_utils/isNetworkError.js'

export async function setFavorited (statusId, favorited) {
  const { online } = store.get()
  if (!online) {
    /* no await */ toast.say(favorited ? 'intl.cannotFavoriteOffline' : 'intl.cannotUnfavoriteOffline')
    return
  }
  const { currentInstance, accessToken } = store.get()
  const networkPromise = favorited
    ? favoriteStatus(currentInstance, accessToken, statusId)
    : unfavoriteStatus(currentInstance, accessToken, statusId)
  store.setStatusFavorited(currentInstance, statusId, favorited) // optimistic update
  try {
    await networkPromise
  } catch (e) {
    logActionError('favorite', e)
    /* no await */ toast.say(favorited
      ? formatIntl('intl.unableToFavorite', { error: (e.message || '') })
      : formatIntl('intl.unableToUnfavorite', { error: (e.message || '') })
    )
    store.setStatusFavorited(currentInstance, statusId, !favorited) // undo optimistic update
    return
  }
  // The server accepted it: a failed local write must not undo the optimistic update or show an error.
  try {
    await database.setStatusFavorited(currentInstance, statusId, favorited)
  } catch (e) {
    console.warn('failed to store favorite:', (e && e.message) || e)
  }
}
