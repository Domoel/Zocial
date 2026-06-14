import { getPoll as getPollApi, voteOnPoll as voteOnPollApi } from '../_api/polls.js'
import { store } from '../_store/store.js'
import { toast } from '../_components/toast/toast.js'
import { formatIntl } from '../_utils/formatIntl.js'
import { logActionError } from '../_utils/isNetworkError.js'

export async function getPoll (pollId) {
  const { currentInstance, accessToken } = store.get()
  try {
    const poll = await getPollApi(currentInstance, accessToken, pollId)
    return poll
  } catch (e) {
    logActionError('refresh poll', e)
    /* no await */ toast.say(formatIntl('intl.unableToRefreshPoll', { error: (e.message || '') }))
  }
}

export async function voteOnPoll (pollId, choices) {
  const { currentInstance, accessToken } = store.get()
  try {
    const poll = await voteOnPollApi(currentInstance, accessToken, pollId, choices.map(_ => _.toString()))
    return poll
  } catch (e) {
    logActionError('vote on poll', e)
    /* no await */ toast.say(formatIntl('intl.unableToVoteInPoll', { error: (e.message || '') }))
  }
}
