import { reactStatus, unreactStatus } from '../_api/react.js'
import { store } from '../_store/store.js'
import { toast } from '../_components/toast/toast.js'
import { formatIntl } from '../_utils/formatIntl.js'
import { logActionError } from '../_utils/isNetworkError.js'
import { importShowEmojiDialog } from '../_components/dialog/asyncDialogs/importShowEmojiDialog.js'
import { updateCustomEmojiForInstance } from './emoji.js'
import { updateStatus } from './timeline.js'
import { scheduleIdleTask } from '../_utils/scheduleIdleTask.js'

export async function setReacted (statusId, reacting, reaction, apiVersion) {
  if (reaction.extern && !apiVersion.externReactions) {
    /* no await */ toast.say('Your instance doesn\'t allow reacting with remote custom emojis')
    return false
  }
  const { online } = store.get()
  if (!online) {
    /* no await */ toast.say(reacting ? 'intl.cannotFavoriteOffline' : 'intl.cannotUnfavoriteOffline')
    return false
  }
  const { currentInstance, accessToken } = store.get()
  const networkPromise = reacting
    ? reactStatus(currentInstance, accessToken, statusId, reaction.name, apiVersion)
    : unreactStatus(currentInstance, accessToken, statusId, reaction.name, apiVersion)
  try {
    await networkPromise
    return true
  } catch (e) {
    logActionError('react', e)
    /* no await */ toast.say(reacting
      ? formatIntl('intl.unableToFavorite', { error: (e.message || '') })
      : formatIntl('intl.unableToUnfavorite', { error: (e.message || '') })
    )
    return false
  }
}

export async function pickEmojiReaction (status) {
  const { currentInstance, accessToken, currentReactionApi } = store.get()
  const [showEmojiDialog] = await Promise.all([
    importShowEmojiDialog(),
    updateCustomEmojiForInstance(currentInstance)
  ])
  showEmojiDialog(async pickedEmoji => {
    const didReact = await setReacted(status.id, true, { name: pickedEmoji.name || pickedEmoji.unicode }, currentReactionApi)
    if (didReact) {
      scheduleIdleTask(() => {
        updateStatus(currentInstance, accessToken, status.id)
      })
    }
  })
}
