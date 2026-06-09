import getLibreTranslateHTML from './libreTranslateHTML.js'
/*

to regenerate, fetch https://libretranslate.com/languages and map the resulting JSON:

```js
const langs = await (await fetch('https://libretranslate.com/languages')).json()
const names = Object.fromEntries(langs.map(l => [l.code, l.name]))
console.log(JSON.stringify(names, null, 2))
```

*/
const sharedLanguageNames = {
  af: 'Afrikaans',
  sq: 'Albanian',
  am: 'Amharic',
  ar: 'Arabic',
  hy: 'Armenian',
  as: 'Assamese',
  ay: 'Aymara',
  az: 'Azerbaijani',
  bm: 'Bambara',
  eu: 'Basque',
  be: 'Belarusian',
  bn: 'Bengali',
  bho: 'Bhojpuri',
  bs: 'Bosnian',
  bg: 'Bulgarian',
  ca: 'Catalan',
  ceb: 'Cebuano',
  ny: 'Chichewa',
  co: 'Corsican',
  hr: 'Croatian',
  cs: 'Czech',
  da: 'Danish',
  dv: 'Dhivehi',
  doi: 'Dogri',
  nl: 'Dutch',
  en: 'English',
  eo: 'Esperanto',
  et: 'Estonian',
  ee: 'Ewe',
  tl: 'Filipino',
  fi: 'Finnish',
  fr: 'French',
  fy: 'Frisian',
  gl: 'Galician',
  ka: 'Georgian',
  de: 'German',
  el: 'Greek',
  gn: 'Guarani',
  gu: 'Gujarati',
  ht: 'Haitian Creole',
  ha: 'Hausa',
  haw: 'Hawaiian',
  iw: 'Hebrew',
  hi: 'Hindi',
  hmn: 'Hmong',
  hu: 'Hungarian',
  is: 'Icelandic',
  ig: 'Igbo',
  ilo: 'Ilocano',
  id: 'Indonesian',
  ga: 'Irish',
  it: 'Italian',
  ja: 'Japanese',
  jw: 'Javanese',
  kn: 'Kannada',
  kk: 'Kazakh',
  km: 'Khmer',
  rw: 'Kinyarwanda',
  gom: 'Konkani',
  ko: 'Korean',
  kri: 'Krio',
  ku: 'Kurdish (Kurmanji)',
  ckb: 'Kurdish (Sorani)',
  ky: 'Kyrgyz',
  lo: 'Lao',
  la: 'Latin',
  lv: 'Latvian',
  ln: 'Lingala',
  lt: 'Lithuanian',
  lg: 'Luganda',
  lb: 'Luxembourgish',
  mk: 'Macedonian',
  mai: 'Maithili',
  mg: 'Malagasy',
  ms: 'Malay',
  ml: 'Malayalam',
  mt: 'Maltese',
  mi: 'Maori',
  mr: 'Marathi',
  'mni-Mtei': 'Meiteilon (Manipuri)',
  lus: 'Mizo',
  mn: 'Mongolian',
  my: 'Myanmar (Burmese)',
  ne: 'Nepali',
  no: 'Norwegian',
  or: 'Odia (Oriya)',
  om: 'Oromo',
  ps: 'Pashto',
  fa: 'Persian',
  pl: 'Polish',
  pt: 'Portuguese',
  pa: 'Punjabi',
  qu: 'Quechua',
  ro: 'Romanian',
  ru: 'Russian',
  sm: 'Samoan',
  sa: 'Sanskrit',
  gd: 'Scots Gaelic',
  nso: 'Sepedi',
  sr: 'Serbian',
  st: 'Sesotho',
  sn: 'Shona',
  sd: 'Sindhi',
  si: 'Sinhala',
  sk: 'Slovak',
  sl: 'Slovenian',
  so: 'Somali',
  es: 'Spanish',
  su: 'Sundanese',
  sw: 'Swahili',
  sv: 'Swedish',
  tg: 'Tajik',
  ta: 'Tamil',
  tt: 'Tatar',
  te: 'Telugu',
  th: 'Thai',
  ti: 'Tigrinya',
  ts: 'Tsonga',
  tr: 'Turkish',
  tk: 'Turkmen',
  ak: 'Twi',
  uk: 'Ukrainian',
  ur: 'Urdu',
  ug: 'Uyghur',
  uz: 'Uzbek',
  vi: 'Vietnamese',
  cy: 'Welsh',
  xh: 'Xhosa',
  yi: 'Yiddish',
  yo: 'Yoruba',
  zu: 'Zulu'
}
export const sourceLanguageNames = {
  ...sharedLanguageNames,
  auto: 'Detect language',
  'zh-CN': 'Chinese',
  // LibreTranslate uses different codes for a few languages than Google Translate did
  he: 'Hebrew',
  jv: 'Javanese',
  zh: 'Chinese'
}
export const targetLanguageNames = {
  ...sharedLanguageNames,
  'zh-CN': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  he: 'Hebrew',
  jv: 'Javanese',
  zh: 'Chinese (Simplified)'
}
export const translate = getLibreTranslateHTML(async function translate (text, to, from) {
  const resp = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text, source: from, target: to })
  })
  const raw = await resp.text()
  let data
  try {
    data = JSON.parse(raw)
  } catch {
    throw new Error(`Translation backend returned non-JSON (HTTP ${resp.status}): ${raw.slice(0, 200)}`)
  }
  if (!resp.ok) {
    throw new Error(data.error || `Translation failed: ${resp.status}`)
  }
  // LibreTranslate includes detectedLanguage in the translate response when source is 'auto'
  const detected = (from === 'auto' && data.detectedLanguage && data.detectedLanguage.language) || null
  return {
    detected,
    text: data.translatedText,
    to,
    from
  }
})
