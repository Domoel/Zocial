import { store } from '../_store/store.js'
import { getFollowedTags, followTag, unfollowTag } from '../_api/followedTags.js'

export async function setupFollowedHashtagsForInstance (instanceName) {
  const { loggedInInstances, instanceFollowedHashtags } = store.get()
  if (!loggedInInstances[instanceName]) return
  if (instanceFollowedHashtags[instanceName]) return // already loaded
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

export async function refreshFollowedHashtagsForInstance (instanceName) {
  const { loggedInInstances } = store.get()
  if (!loggedInInstances[instanceName]) return
  const accessToken = loggedInInstances[instanceName].access_token
  const tags = await getFollowedTags(instanceName, accessToken)
  const { instanceFollowedHashtags } = store.get()
  instanceFollowedHashtags[instanceName] = tags
  store.set({ instanceFollowedHashtags })
}

export async function followHashtag (instanceName, tagName) {
  const { loggedInInstances } = store.get()
  const accessToken = loggedInInstances[instanceName].access_token
  await followTag(instanceName, accessToken, tagName)
  await refreshFollowedHashtagsForInstance(instanceName)
}

export async function unfollowHashtag (instanceName, tagName) {
  const { loggedInInstances } = store.get()
  const accessToken = loggedInInstances[instanceName].access_token
  await unfollowTag(instanceName, accessToken, tagName)
  const { instanceFollowedHashtags } = store.get()
  instanceFollowedHashtags[instanceName] = (instanceFollowedHashtags[instanceName] || [])
    .filter(t => t.name.toLowerCase() !== tagName.toLowerCase())
  store.set({ instanceFollowedHashtags })
}
