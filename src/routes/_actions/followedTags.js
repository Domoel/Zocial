import { store } from '../_store/store.js'
import { getFollowedTags, followTag, unfollowTag } from '../_api/followedTags.js'

export async function setupFollowedHashtagsForInstance (instanceName) {
  return store.runIfLoggedIn(instanceName, async ({ loggedInInstances, instanceFollowedHashtags }) => {
    if (instanceFollowedHashtags[instanceName]) return // already loaded
    const accessToken = loggedInInstances[instanceName].access_token
    try {
      const tags = await getFollowedTags(instanceName, accessToken)
      store.runIfLoggedIn(instanceName, ({ instanceFollowedHashtags: current }) => {
        current[instanceName] = tags
        store.set({ instanceFollowedHashtags: current })
      })
    } catch (e) {
      // silently fail — hashtag headers just won't show
    }
  })
}

export async function refreshFollowedHashtagsForInstance (instanceName) {
  return store.runIfLoggedIn(instanceName, async ({ loggedInInstances }) => {
    const accessToken = loggedInInstances[instanceName].access_token
    const tags = await getFollowedTags(instanceName, accessToken)
    store.runIfLoggedIn(instanceName, ({ instanceFollowedHashtags }) => {
      instanceFollowedHashtags[instanceName] = tags
      store.set({ instanceFollowedHashtags })
    })
  })
}

export async function followHashtag (instanceName, tagName) {
  return store.runIfLoggedIn(instanceName, async ({ loggedInInstances }) => {
    const accessToken = loggedInInstances[instanceName].access_token
    await followTag(instanceName, accessToken, tagName)
    await refreshFollowedHashtagsForInstance(instanceName)
  })
}

export async function unfollowHashtag (instanceName, tagName) {
  return store.runIfLoggedIn(instanceName, async ({ loggedInInstances }) => {
    const accessToken = loggedInInstances[instanceName].access_token
    await unfollowTag(instanceName, accessToken, tagName)
    store.runIfLoggedIn(instanceName, ({ instanceFollowedHashtags }) => {
      instanceFollowedHashtags[instanceName] = (instanceFollowedHashtags[instanceName] || [])
        .filter(t => t.name.toLowerCase() !== tagName.toLowerCase())
      store.set({ instanceFollowedHashtags })
    })
  })
}
