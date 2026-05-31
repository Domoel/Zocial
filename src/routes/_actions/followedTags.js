import { store } from '../_store/store.js'
import { getFollowedTags } from '../_api/followedTags.js'

export async function setupFollowedHashtagsForInstance (instanceName) {
  const { loggedInInstances, instanceFollowedHashtags } = store.get()
  if (instanceFollowedHashtags[instanceName]) {
    return // already loaded
  }
  const accessToken = loggedInInstances[instanceName].access_token
  try {
    const tags = await getFollowedTags(instanceName, accessToken)
    const { instanceFollowedHashtags: current } = store.get()
    current[instanceName] = tags
    store.set({ instanceFollowedHashtags: current })
  } catch (e) {
    // silently fail — hashtag headers just won't show
  }
}
