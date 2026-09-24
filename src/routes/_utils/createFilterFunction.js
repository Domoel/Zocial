// create a function for filtering timeline item summaries
import { WORD_FILTER_CONTEXT_HOME, WORD_FILTER_CONTEXT_PUBLIC } from '../_static/wordFilters.js'

export const createFilterFunction = (
  showReblogs, showReplies, showFollows, showFavs, showMentions, showPolls,
  showSubscriptions, wordFilterContext
) => {
  return item => {
    if (item.filterContexts && item.filterContexts.includes(wordFilterContext)) {
      return false
    }
    // A post quoting a muted/blocked account is dropped where a mute hides that account's own posts
    // (home, lists, public/tag timelines) — shown without its quote it would lack its context.
    // Notifications, threads and profiles keep it, like Mastodon's mute semantics.
    if (item.quoteHidden && (wordFilterContext === WORD_FILTER_CONTEXT_HOME || wordFilterContext === WORD_FILTER_CONTEXT_PUBLIC)) {
      return false
    }

    switch (item.type) {
      case 'poll':
        return showPolls
      case 'favourite':
        return showFavs
      case 'reblog':
        return showReblogs
      case 'mention':
        return showMentions
      case 'follow':
        return showFollows
      case 'status':
        return showSubscriptions
    }
    if (item.reblogId) {
      return showReblogs
    } else if (item.replyId) {
      return showReplies
    } else {
      return true
    }
  }
}
