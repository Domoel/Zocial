import { store } from '../_store/store.js'
import { blockAccount, unblockAccount } from '../_api/block.js'
import { toast } from '../_components/toast/toast.js'
import { updateLocalRelationship } from './accounts.js'
import { emit } from '../_utils/eventBus.ts'
import { formatIntl } from '../_utils/formatIntl.js'
import { removeAccountFromAllTimelines } from './timeline.js'
import { isNetworkNoiseError } from '../_utils/isNetworkError.js'

export async function setAccountBlocked (accountId, block, toastOnSuccess) {
  const { currentInstance, accessToken } = store.get()
  try {
    let relationship
    if (block) {
      relationship = await blockAccount(currentInstance, accessToken, accountId)
    } else {
      relationship = await unblockAccount(currentInstance, accessToken, accountId)
    }
    await updateLocalRelationship(currentInstance, accountId, relationship)
    if (block) {
      // Block means "nothing from them anywhere" — purge their cached posts from ALL timelines
      // (home/local/federated/tag/list/account + open threads), not just home. The server hides
      // blocked content, but our union-only cache would otherwise keep the old ones around.
      /* no await */ removeAccountFromAllTimelines(currentInstance, accountId)
    }
    if (toastOnSuccess) {
      if (block) {
        /* no await */ toast.say('intl.blockedAccount')
      } else {
        /* no await */ toast.say('intl.unblockedAccount')
      }
    }
    emit('refreshAccountsList')
  } catch (e) {
    // Transient network failures are infrastructure noise, not bugs — log as warn so they don't
    // show as a red error; the user still gets a toast.
    if (isNetworkNoiseError(e)) {
      console.warn(`${block ? 'block' : 'unblock'} failed:`, (e.message || e))
    } else {
      console.error(e)
    }
    /* no await */ toast.say(block
      ? formatIntl('intl.unableToBlock', { block: !!block, error: (e.message || '') })
      : formatIntl('intl.unableToUnblock', { error: (e.message || '') })
    )
  }
}
