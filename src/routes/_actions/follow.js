import { store } from '../_store/store.js'
import { followAccount, unfollowAccount, removeFromFollowers } from '../_api/follow.js'
import { toast } from '../_components/toast/toast.js'
import { updateLocalRelationship } from './accounts.js'
import { formatIntl } from '../_utils/formatIntl.js'
import { emit } from '../_utils/eventBus.ts'

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
    if (toastOnSuccess) {
      /* no await */ toast.say(follow ? 'intl.followedAccount' : 'intl.unfollowedAccount')
    }
  } catch (e) {
    console.error(e)
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
    console.error(e)
    if (e && (e.status === 404 || e.status === 501)) {
      /* no await */ toast.say('intl.removeFromFollowersNotSupported')
    } else {
      /* no await */ toast.say(formatIntl('intl.error', { error: (e.message || '') }))
    }
  }
}
