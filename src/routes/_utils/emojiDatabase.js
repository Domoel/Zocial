import Database from 'emoji-picker-element/database.js'
import { lifecycle } from './lifecycle.ts'
import { emojiPickerLocale, emojiPickerDataSource } from '../_static/emojiPickerIntl.js'

let database
let databaseFailedAt = 0 // when the current instance's initial load failed (0 = healthy)
let customEmojiList

// After a failed first load, wait this long before re-creating the instance (and re-downloading the
// emoji JSON) — lookups in between fail fast, so an outage doesn't turn into a request storm.
const RETRY_AFTER_FAILURE_MS = 30000

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

// emoji-picker-element loads its data from `emojiPickerDataSource`; a brief failure there (a non-2xx
// mid-deploy, a flaky connection) must neither surface as an uncaught rejection nor stick:
//  - returning visit (data already in IDB): the library runs its ETag update check (a HEAD on the
//    data source) as a fire-and-forget promise it only awaits on close, so no caller can catch it →
//    attach a handler once ready (the check simply re-runs on the next page load);
//  - first visit (empty IDB): ready() itself rejects and the library caches that rejection → mark
//    the instance failed so init() starts fresh after RETRY_AFTER_FAILURE_MS (self-heals).
const guardedLazyUpdates = new WeakSet()

async function whenReady (db) {
  try {
    await db.ready()
  } catch (err) {
    if (database === db && !databaseFailedAt) {
      databaseFailedAt = Date.now()
    }
    throw err
  }
  const lazyUpdate = db._lazyUpdate // library-internal; tolerate it being absent/renamed
  if (lazyUpdate && typeof lazyUpdate.catch === 'function' && !guardedLazyUpdates.has(lazyUpdate)) {
    guardedLazyUpdates.add(lazyUpdate)
    lazyUpdate.catch(err => console.warn('emoji data update check failed', (err && err.message) || err))
  }
  return db
}

// <emoji-picker> creates its own Database instance, whose update check needs the same guard. A failed
// ready() there is the picker's to handle (it shows its network-error message).
export function guardPickerDatabase (db) {
  /* no await */ whenReady(db).catch(() => {})
}

export function init () {
  if (!database || (databaseFailedAt && Date.now() - databaseFailedAt > RETRY_AFTER_FAILURE_MS)) {
    databaseFailedAt = 0
    database = new Database({
      locale: emojiPickerLocale,
      dataSource: emojiPickerDataSource
    })
    if (customEmojiList) {
      database.customEmoji = customEmojiList
    }
    // loading starts in the constructor — observe it so a failure is handled even if no lookup follows
    /* no await */ whenReady(database).catch(() => {})
  }
  return database
}

export function setCustomEmoji (customEmoji) {
  customEmojiList = customEmoji // kept so a re-created instance (see whenReady) gets them too
  init().customEmoji = customEmoji
}

export async function findByUnicodeOrName (unicodeOrName) {
  try {
    const db = await whenReady(init())
    const variants = [unicodeOrName.replace(/\ufe0f$/, '')]
    variants.push(variants[0] + '\ufe0f')
    // Promise.all rather than awaiting one by one: if both reject, the second must not go unhandled
    const results = await Promise.all(variants.map((variant) => db.getEmojiByUnicodeOrName(variant)))
    return results.find(Boolean)
  } catch (err) {
    // emoji data source briefly unavailable — degrade gracefully; self-heals on a later call
    console.warn('emoji lookup failed', (err && err.message) || err)
  }
}

export async function findBySearchQuery (query) {
  try {
    const db = await whenReady(init())
    const [emojis, skinTone] = await Promise.all([
      db.getEmojiBySearchQuery(query),
      db.getPreferredSkinTone()
    ])
    return emojis.map(emoji => applySkinToneToEmoji(emoji, skinTone))
  } catch (err) {
    // see findByUnicodeOrName: tolerate a transient emoji-data-source failure
    console.warn('emoji search failed', (err && err.message) || err)
    return []
  }
}

if (ZOCIAL_IS_BROWSER) {
  lifecycle.addEventListener('statechange', event => {
    if (event.newState === 'frozen' && database) { // page is frozen, close IDB connections
      // close() awaits ready() first, which rejects if the data never loaded — don't let that go uncaught
      database.close().catch(err => console.warn('emoji database close failed', (err && err.message) || err))
    }
  })
}
