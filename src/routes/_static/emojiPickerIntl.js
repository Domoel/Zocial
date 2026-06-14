// The emoji picker ships English data/labels. The UI language is switched at runtime, but the emoji
// picker (a separate web component with its own i18n + IndexedDB cache) is not yet runtime-localised
// — that's a deliberate, separate enhancement. See Architecture.md §20.
export const emojiPickerDataSource = '/emoji-en-US.json'

// undefined → emoji-picker-element uses its built-in English labels.
export const emojiPickerI18n = process.env.EMOJI_PICKER_I18N

// Reuse emoji-picker-element's default "en" IndexedDB database (avoids a stale extra DB).
export const emojiPickerLocale = 'en'
