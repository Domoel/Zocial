// `label` holds the i18n message KEY (without `intl.` prefix), resolved at render time via
// $messages so theme names follow the live UI language instead of freezing at the boot locale.
const themes = [
  {
    name: 'default',
    label: 'themeRoyal',
    dark: false,
    color: 'royalblue'
  },
  {
    name: 'scarlet',
    label: 'themeScarlet',
    dark: false,
    color: '#e04e41'
  },
  {
    name: 'seafoam',
    label: 'themeSeafoam',
    dark: false,
    color: '#177380'
  },
  {
    name: 'hotpants',
    label: 'themeHotpants',
    dark: false,
    color: 'hotpink'
  },
  {
    name: 'tangerine',
    label: 'themeTangerine',
    dark: false,
    color: '#df5815'
  },
  {
    name: 'oaken',
    label: 'themeOaken',
    dark: false,
    color: 'saddlebrown'
  },
  {
    name: 'majesty',
    label: 'themeMajesty',
    dark: false,
    color: 'blueviolet'
  },
  {
    name: 'gecko',
    label: 'themeGecko',
    dark: false,
    color: '#4ab92f'
  },
  {
    name: 'grayscale',
    label: 'themeGrayscale',
    dark: false,
    color: '#999999'
  },
  {
    name: 'zocial',
    label: 'themeZocial',
    dark: true,
    color: '#bd93f9'
  },
  {
    name: 'ozark',
    label: 'themeOzark',
    dark: true,
    color: '#5263af'
  },
  {
    name: 'cobalt',
    label: 'themeCobalt',
    dark: true,
    color: '#08439b'
  },
  {
    name: 'sorcery',
    label: 'themeSorcery',
    dark: true,
    color: '#ae91e8'
  },
  {
    name: 'punk',
    label: 'themePunk',
    dark: true,
    color: '#ff5050'
  },
  {
    name: 'ember',
    label: 'themeEmber',
    dark: true,
    color: '#f76522'
  },
  {
    name: 'riot',
    label: 'themeRiot',
    dark: true,
    color: 'hotpink'
  },
  {
    name: 'hacker',
    label: 'themeHacker',
    dark: true,
    color: '#4ab92f'
  },
  {
    name: 'mastodon',
    label: 'themeMastodon',
    dark: true,
    color: '#282C37'
  },
  {
    name: 'pitchblack',
    label: 'themePitchBlack',
    dark: true,
    color: '#000'
  },
  {
    name: 'dark-grayscale',
    label: 'themeDarkGrayscale',
    dark: true,
    color: '#666'
  },
  {
    name: 'cohost_light',
    label: 'themeCohostLight',
    dark: false,
    color: '#83254F'
  }
]

export { themes }
