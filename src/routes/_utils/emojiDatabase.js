import Database from 'emoji-picker-element/database.js'
import { lifecycle } from './lifecycle.ts'
import { emojiPickerLocale, emojiPickerDataSource } from '../_static/emojiPickerIntl.js'

let database

function applySkinToneToEmoji (emoji, skinTone) {
  if (!emoji || emoji.url) { // nonexistent or custom emoji
    return emoji
  }
  const res = {
    unicode: emoji.unicode,
    shortcodes: emoji.shortcodes
  }
  if (skinTone > 0 && emoji.skins) { // non-default skin tone
    const tone = emoji.skins.find(_ => _.tone === skinTone)
    if (tone) {
      res.unicode = tone.unicode
    }
  }
  return res
}

export function init () {
  if (!database) {
    database = new Database({
      locale: emojiPickerLocale,
      dataSource: emojiPickerDataSource
    })
  }
}

export function setCustomEmoji (customEmoji) {
  init()
  database.customEmoji = customEmoji
}

export async function findByUnicodeOrName (unicodeOrName) {
  init()
  try {
    const variants = [unicodeOrName.replace(/\ufe0f$/, '')]
    variants.push(variants[0] + '\ufe0f')
    const results = variants.map((variant) => database.getEmojiByUnicodeOrName(variant))
    for (const promise of results) {
      const result = await promise
      if (result) return result
    }
  } catch (err) {
    // emoji data source briefly unavailable (e.g. a non-2xx on /emoji-en-US.json mid-deploy) \u2014
    // degrade gracefully instead of surfacing an uncaught rejection; self-heals on the next call
    console.warn('emoji lookup failed', err && err.message)
  }
}

export async function findBySearchQuery (query) {
  init()
  try {
    const [emojis, skinTone] = await Promise.all([
      database.getEmojiBySearchQuery(query),
      database.getPreferredSkinTone()
    ])
    return emojis.map(emoji => applySkinToneToEmoji(emoji, skinTone))
  } catch (err) {
    // see findByUnicodeOrName: tolerate a transient emoji-data-source failure
    console.warn('emoji search failed', err && err.message)
    return []
  }
}

if (ZOCIAL_IS_BROWSER) {
  lifecycle.addEventListener('statechange', event => {
    if (event.newState === 'frozen' && database) { // page is frozen, close IDB connections
      database.close()
    }
  })
}
