import { store } from '../_store/store.js'
import { followAccount, unfollowAccount, removeFromFollowers } from '../_api/follow.js'
import { toast } from '../_components/toast/toast.js'
import { updateLocalRelationship } from './accounts.js'
import { formatIntl } from '../_utils/formatIntl.js'
import { emit } from '../_utils/eventBus.ts'
import { removeAccountFromFollowGatedTimelines } from './timeline.js'
import { isNetworkNoiseError } from '../_utils/isNetworkError.js'

export async function setAccountFollowed (accountId, follow, toastOnSuccess) {
  const { currentInstance, accessToken } = store.get()
  try {
    let relationship
    if (follow) {
      relationship = await followAccount(currentInstance, accessToken, accountId)
    } else {
      relationship = await unfollowAccount(currentInstance, accessToken, accountId)
    }
    await updateLocalRelationship(currentInstance, accountId, relationship)
    if (!follow) {
      // Unfollow: purge their already-cached posts from the follow-gated timelines (home + your
      // lists — unfollowing removes them from lists server-side too). The server unmerges them, but
      // our union-only cache would otherwise keep the old ones around.
      /* no await */ removeAccountFromFollowGatedTimelines(currentInstance, accountId)
    }
    if (toastOnSuccess) {
      /* no await */ toast.say(follow ? 'intl.followedAccount' : 'intl.unfollowedAccount')
    }
  } catch (e) {
    // Transient network failures are infrastructure noise, not bugs — log as warn (matching the
    // timeline path) so they don't show as a red error; the user still gets a toast.
    if (isNetworkNoiseError(e)) {
      console.warn(`${follow ? 'follow' : 'unfollow'} failed:`, (e.message || e))
    } else {
      console.error(e)
    }
    /* no await */ toast.say(follow
      ? formatIntl('intl.unableToFollow', { error: (e.message || '') })
      : formatIntl('intl.unableToUnfollow', { error: (e.message || '') })
    )
  }
}

// Remove an account from your followers. Unlike block/mute this is only reversible by the *other*
// person (they'd have to re-follow), so the caller confirms first. Backends that don't implement
// the endpoint answer 404/501 → show a clear "not supported" message instead of a raw error.
export async function removeAccountFromFollowers (accountId) {
  const { currentInstance, accessToken } = store.get()
  try {
    const relationship = await removeFromFollowers(currentInstance, accessToken, accountId)
    await updateLocalRelationship(currentInstance, accountId, relationship)
    emit('refreshAccountsList')
    /* no await */ toast.say('intl.removedFollower')
  } catch (e) {
    if (e && (e.status === 404 || e.status === 501)) {
      // Expected on backends that don't implement the endpoint — the toast informs the user, so
      // this is not an error and must NOT be logged as one (it would show as a red ⛔ in the logs).
      /* no await */ toast.say('intl.removeFromFollowersNotSupported')
    } else {
      // Network noise → warn (not a red error); genuine/unexpected failures → error.
      if (isNetworkNoiseError(e)) {
        console.warn('remove from followers failed:', (e.message || e))
      } else {
        console.error(e)
      }
      /* no await */ toast.say(formatIntl('intl.error', { error: (e.message || '') }))
    }
  }
}
