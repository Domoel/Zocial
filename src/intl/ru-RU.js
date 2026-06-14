export default {
  // Home page, basic <title> and <description>
  appName: 'Zocial',
  appDescription: 'Минималистичный веб-клиент Mastodon со своим видением интерфейса.',
  homeDescription: `
    <p>
      Минималистичный веб-клиент Mastodon со своим видением интерфейса.
    </p>`,
  logIn: 'Войти',
  footer: `
    <p>
      Powered by <a rel="noopener" target="_blank" href="https://ztfr.eu">Zeitfresser</a> · <a href="/settings/about#donations" rel="prefetch">Donations</a> · <a href="/settings/about#privacy-policy" rel="prefetch">Privacy Policy</a> · Zocial v{version}
    </p>
  `,
  // Manifest
  newStatus: 'Новая запись',
  // Generic UI
  loading: 'Загрузка',
  okay: 'OK',
  cancel: 'Отмена',
  alert: 'Оповещение',
  close: 'Закрыть',
  error: 'Ошибка: {error}',
  errorShort: 'Ошибка:',
  // Relative timestamps
  justNow: 'только что',
  // Navigation, page titles
  navItemLabel: `
    {label} {selected, select,
      true {(current page)}
      other {}
    } {name, select,
      notifications {{count, plural,
        =0 {}
        one {(1 notification)}
        other {({count} notifications)}
      }}
      community {{count, plural,
        =0 {}
        one {(1 follow request)}
        other {({count} follow requests)}
      }}
      other {}
    }
  `,
  blockedUsers: 'Заблокированные пользователи',
  bookmarks: 'Закладки',
  directMessages: 'Личные сообщения',
  favorites: 'Избранное',
  federated: 'Федеративное',
  home: 'Главная',
  local: 'Локальная',
  notifications: 'Уведомления',
  mutedUsers: 'Игнорируемые пользователи',
  pinnedStatuses: 'Закрепленные записи',
  followRequests: 'Запросы на подписку',
  followRequestsLabel: `Запросы на подписку {hasFollowRequests, select,
    true {({count})}
    other {}
  }`,
  list: 'Список',
  search: 'Поиск',
  pageHeader: 'Заголовок страницы',
  goBack: 'Вернуться назад',
  back: 'Назад',
  profile: 'Профиль',
  federatedTimeline: 'Глобальная лента',
  localTimeline: 'Локальная лента',
  // community page
  community: 'Сообщество',
  pinnableTimelines: 'Закрепляемые ленты',
  timelines: 'Ленты',
  lists: 'Списки',
  instanceSettings: 'Настройки инстанса',
  notificationMentions: 'Уведомление упоминаний',
  profileWithMedia: 'Профиль с медиа',
  profileWithReplies: 'Профиль с ответами',
  hashtag: 'Хэштег',
  // not logged in
  profileNotLoggedIn: 'При входе в систему здесь появится лента пользователя.',
  bookmarksNotLoggedIn: 'Ваши закладки появятся здесь после входа в систему.',
  directMessagesNotLoggedIn: 'Ваши личные сообщения будут отображаться здесь после входа в систему.',
  favoritesNotLoggedIn: 'Ваше избранное появится здесь после входа в систему.',
  federatedTimelineNotLoggedIn: 'Ваша глобальная лента появится здесь после входа в систему.',
  localTimelineNotLoggedIn: 'Ваша локальная лента появится здесь после входа в систему.',
  searchNotLoggedIn: 'Вы можете выполнять поиск после входа в инстанс.',
  communityNotLoggedIn: 'Параметры сообщества появится здесь при входе в систему.',
  listNotLoggedIn: 'Список появится здесь после входа в систему.',
  notificationsNotLoggedIn: 'Ваши уведомления будут отображаться здесь после входа в систему.',
  notificationMentionsNotLoggedIn: 'Ваши уведомления с упоминаниями будут отображаться здесь после входа в систему.',
  statusNotLoggedIn: 'При входе в систему здесь появится тред сообщений.',
  tagNotLoggedIn: 'При входе в систему здесь появится лента с хэштегом.',
  // Notification subpages
  filters: 'Фильтры',
  all: 'Все',
  mentions: 'Упоминания',
  // Follow requests
  approve: 'Одобрить',
  reject: 'Отклонить',
  // Hotkeys
  hotkeys: 'Горячие клавиши',
  global: 'Глобальная',
  timeline: 'Лента',
  media: 'Медиа',
  globalHotkeys: `
    {leftRightChangesFocus, select,
      true {
        <li><kbd>→</kbd> перейти к следующему элементу</li>
        <li><kbd>←</kbd> перейти к предыдущему элементу</li>
      }
      other {}
    }
    <li>
      <kbd>1</kbd> - <kbd>6</kbd>
      {leftRightChangesFocus, select,
        true {}
        other {или <kbd>←</kbd>/<kbd>→</kbd>}
      }
      переключение столбцов
    </li>
    <li><kbd>7</kbd> или <kbd>c</kbd> создать запись</li>
    <li><kbd>s</kbd> или <kbd>/</kbd> искать</li>
    <li><kbd>g</kbd> + <kbd>h</kbd> главная</li>
    <li><kbd>g</kbd> + <kbd>n</kbd> уведомления</li>
    <li><kbd>g</kbd> + <kbd>l</kbd> локальная лента</li>
    <li><kbd>g</kbd> + <kbd>b</kbd> лента «Пузырь»</li>
    <li><kbd>g</kbd> + <kbd>t</kbd> глобальная лента</li>
    <li><kbd>g</kbd> + <kbd>c</kbd> сообщество</li>
    <li><kbd>g</kbd> + <kbd>d</kbd> личные сообщения</li>
    <li><kbd>g</kbd> + <kbd>i</kbd> страница инстансов</li>
    <li><kbd>h</kbd> или <kbd>?</kbd> диалог справки</li>
    <li><kbd>Backspace</kbd> закрыть диалог, чтобы вернуться назад</li>
  `,
  timelineHotkeys: `
    <li><kbd>j</kbd> или <kbd>↓</kbd> следующая запись</li>
    <li><kbd>k</kbd> или <kbd>↑</kbd> предыдущая запись</li>
    <li><kbd>.</kbd> показать больше и прокрутить вверх</li>
    <li><kbd>o</kbd> открыть</li>
    <li><kbd>f</kbd> в избранное</li>
    <li><kbd>b</kbd> продвинуть</li>
    <li><kbd>r</kbd> ответить</li>
    <li><kbd>e</kbd> редактировать свои записи</li>
    <li><kbd>q</kbd> цитировать запись, если поддерживается</li>
    <li><kbd>Escape</kbd> закрыть ответ</li>
    <li><kbd>a</kbd> в закладки</li>
    <li><kbd>i</kbd> открыть изображения, видео или аудио</li>
    <li><kbd>y</kbd> показать или скрыть деликатное медиа</li>
    <li><kbd>m</kbd> упомянуть автора</li>
    <li><kbd>p</kbd> открыть профиль автора</li>
    <li><kbd>l</kbd> открыть ссылку карточки в новой вкладке</li>
    <li><kbd>x</kbd> показать или скрыть текст за предупреждением о содержимом</li>
    <li><kbd>z</kbd> показать или скрыть все предупреждения о содержимом в треде</li>
    <li><kbd>t</kbd> перевести запись</li>
  `,
  mediaHotkeys: `
    <li><kbd>←</kbd> / <kbd>→</kbd> перейти к следующему или предыдущему</li>
  `,
  // Community page, tabs
  tabLabel: `{label} {current, select,
    true {(Current)}
    other {}
  }`,
  pageTitle: `
    {hasNotifications, select,
      true {({count})}
      other {}
    }
    {showInstanceName, select,
      true {{instanceName}}
      other {Zocial}
    }
    ·
    {name}
  `,
  pinLabel: `{label} {pinnable, select,
    true {
      {pinned, select,
        true {(Pinned page)}
        other {(Unpinned page)}
      }
    }
    other {}
  }`,
  pinPage: 'Закрепить {label}',
  // Status composition
  composeStatus: 'Создать запись',
  postStatus: 'Опубликовать!',
  contentWarning: 'Предупреждение о содержимом',
  dropToUpload: 'Перетащите для загрузки',
  invalidFileType: 'Неверный тип файла',
  composeLabel: 'О чем Вы думаете?',
  autocompleteDescription: 'Когда результаты автозаполнения доступны, нажмите стрелки вверх или вниз и нажмите Enter, чтобы выбрать.',
  mediaUploads: 'Загрузка медиа',
  edit: 'Редактировать',
  delete: 'Удалить',
  description: 'Описание',
  descriptionLabel: 'Добавьте описание для слабовидящих (изображение, видео) или слабослышащих (аудио, видео)',
  markAsSensitive: 'Отметить медиа как деликатное',
  // Polls
  createPoll: 'Создать опрос',
  removePollChoice: 'Удалить вариант {index}',
  pollChoiceLabel: 'Вариант {index}',
  multipleChoice: 'Несколько вариантов',
  pollDuration: 'Продолжительность опроса',
  fiveMinutes: '5 минут',
  thirtyMinutes: '30 минут',
  oneHour: '1 час',
  sixHours: '6 часов',
  twelveHours: '12 часов',
  oneDay: '1 день',
  threeDays: '3 дня',
  sevenDays: '7 дней',
  never: 'Никогда',
  addEmoji: 'Вставить эмодзи',
  addMedia: 'Добавить медиа (изображения, видео, аудио)',
  addPoll: 'Добавить опрос',
  removePoll: 'Удалить опрос',
  postPrivacyLabel: 'Настройка конфиденциальности (на данный момент {label})',
  addContentWarning: 'Добавить предупреждение о содержимом',
  removeContentWarning: 'Удалить предупреждение о содержимом',
  altLabel: 'Описание для слабовидящих',
  extractText: 'Извлечь текст из изображения',
  extractingText: 'Извлечение текста…',
  extractingTextCompletion: 'Извлечение текста ({percent}% завершено)…',
  unableToExtractText: 'Не удалось извлечь текст.',
  // Account options
  followAccount: 'Подписаться на {account}',
  unfollowAccount: 'Отписаться от {account}',
  blockAccount: 'Заблокировать {account}',
  unblockAccount: 'Разблокировать {account}',
  muteAccount: 'Игнорировать {account}',
  unmuteAccount: 'Не игнорировать {account}',
  showReblogsFromAccount: 'Показывать продвижения от {account}',
  hideReblogsFromAccount: 'Скрыть продвижения от {account}',
  showDomain: 'Показать {domain}',
  hideDomain: 'Скрыть домен {domain}',
  reportAccount: 'Пожаловаться на {account}',
  mentionAccount: 'Упомянуть {account}',
  copyLinkToAccount: 'Копировать ссылку на аккаунт',
  copiedToClipboard: 'Скопировано в буфер обмена',
  // Media dialog
  navigateMedia: 'Навигация по элементам мультимедиа',
  showPreviousMedia: 'Показать предыдущие медиа',
  showNextMedia: 'Показать следующее медиа',
  enterPinchZoom: 'Режим масштабирования щипком',
  exitPinchZoom: 'Выйти из режима щипкового масштабирования.',
  showMedia: `Показать {index, select,
    1 {first}
    2 {second}
    3 {third}
    other {fourth}
  } медиа {current, select,
    true {(current)}
    other {}
  }`,
  previewFocalPoint: 'Предварительный просмотр (фокус)',
  enterFocalPoint: 'Введите точку фокусировки (X, Y) для этого медиа',
  muteNotifications: 'Отключить уведомления',
  muteAccountConfirm: 'Игнорировать {account}?',
  mute: 'Игнорировать',
  unmute: 'Не игнорировать',
  zoomOut: 'Уменьшить',
  zoomIn: 'Увеличить',
  // Reporting
  reportingLabel: 'Вы отправляете жалобу на {account} модератору {instance}.',
  additionalComments: 'Дополнительные комментарии',
  forwardDescription: 'Переслать также модераторам {instance}?',
  forwardLabel: 'Переслать {instance}',
  unableToLoadStatuses: 'Не удалось загрузить последние записи: {error}',
  report: 'Жалоба',
  noContent: '(Без содержания)',
  noStatuses: 'Нет записей для жалобы',
  // Status options
  unpinFromProfile: 'Открепить от профиля',
  pinToProfile: 'Закрепить в профиле',
  muteConversation: 'Игнорировать обсуждение',
  unmuteConversation: 'Не игнорировать обсуждение',
  bookmarkStatus: 'Добавить в закладки',
  unbookmarkStatus: 'Удалить закладку',
  deleteAndRedraft: 'Удалить и исправить',
  reportStatus: 'Пожаловаться на запись',
  shareStatus: 'Поделиться записью',
  copyLinkToStatus: 'Копировать ссылку на запись',
  // Account profile
  profileForAccount: 'Профиль для {account}',
  statisticsAndMoreOptions: 'Статистика и другие параметры',
  statuses: 'Записи',
  follows: 'Подписки',
  followers: 'Подписчики',
  moreOptions: 'Больше опций',
  followersLabel: 'Подписчиков {count}',
  followingLabel: 'Пописок {count}',
  followLabel: `Подписаться {requested, select,
    true {(follow requested)}
    other {}
  }`,
  unfollowLabel: `Отписаться {requested, select,
    true {(follow requested)}
    other {}
  }`,
  notify: 'Подписаться на {account}',
  denotify: 'Отписаться от {account}',
  subscribedAccount: 'Подписан на аккаунт',
  unsubscribedAccount: 'Отписаться от аккаунта',
  unblock: 'Разблокировать',
  nameAndFollowing: 'Имя и подписка',
  clickToSeeAvatar: 'Нажмите, чтобы увидеть аватар',
  opensInNewWindow: '{label} (открывается в новом окне)',
  blocked: 'Заблокирован',
  domainHidden: 'Домен скрыт',
  muted: 'Игнорирован',
  followsYou: 'Подписан на вас',
  avatarForAccount: 'Аватар для {account}',
  fields: 'Поля',
  accountHasMoved: '{account} переехал:',
  profilePageForAccount: 'Страница профиля для {account}',
  verified: 'Verified',
  // About page
  about: 'О нас',
  aboutApp: 'О Zocial',
  aboutAppDescription: `
  <p>
    Zocial — это <a rel="noopener" target="_blank" href="https://git.ztfr.eu/Dome/Zocial">программное обеспечение с открытым исходным кодом</a> и форк <a rel="noopener" target="_blank" href="https://github.com/enafore/enafore">Enafore</a>, созданный <a rel="noopener" target="_blank" href="https://social.ztfr.eu/@dome">Dome</a>.
  </p>

  <h2 id="privacy-policy">Политика конфиденциальности</h2>

  <p>
    Zocial не хранит никакой персональной информации на своих серверах, включая, помимо прочего, имена, адреса электронной почты, IP-адреса, записи и фотографии.
  </p>

  <p>
    Zocial — это статический сайт, который можно разместить где угодно (например, на GitHub Pages). Он предоставляется в виде <a rel="noopener" target="_blank" href="https://hub.docker.com/r/domoel/zocial">Docker-образа</a> и может быть развёрнут с помощью веб-сервера nginx. Все данные хранятся локально в вашем браузере и передаются только тем инстансам Федиверса, к которым вы подключаетесь.
  </p>

  <h2>Переводы</h2>

  <p>
    Перевод записей выполняется с помощью <a rel="noopener" target="_blank" href="https://libretranslate.com">LibreTranslate</a> — движка машинного перевода с открытым исходным кодом без зависимости от Google. Запросы маршрутизируются через сервер, поэтому ни один сервис перевода не вызывается напрямую из вашего браузера. Самостоятельный хостинг поддерживается через переменную окружения <code>TRANSLATE_API</code>.
  </p>

  <h2>Кредиты</h2>

  <p>
    Иконки предоставлены <a rel="noopener" target="_blank" href="http://fontawesome.io/">Font Awesome</a>.
  </p>

  <p>
    Zocial распространяется под <a rel="noopener" target="_blank" href="https://git.ztfr.eu/Dome/Zocial/src/branch/main/LICENSE">GNU Affero General Public License</a>. Powered by <a rel="noopener" target="_blank" href="https://ztfr.eu/">Zeitfresser</a>
  </p>

  <h2 id="donations">Пожертвования</h2>

  <p>
    Zocial — некоммерческий проект, бесплатный в использовании. Пожертвования полностью добровольны — они лишь помогают покрывать текущие расходы публичного инстанса (домен и хостинг).
  </p>

  <p>
    Если вы хотите поддержать проект: <a rel="noopener" target="_blank" href="https://www.paypal.com/donate/?hosted_button_id=QMWFH4FDXN66C">Поддержать через PayPal</a>.
  </p>

  <h2>Версия</h2>

  <p>
    Вы используете Zocial версии <code class="zocial-version"></code>.
  </p>`,
  // Settings
  settings: 'Настройки',
  general: 'Общие',
  generalSettings: 'Общие настройки',
  generalSettingsLoginRequired: 'Общие настройки доступны только при входе в аккаунт.',
  showSensitive: 'Показывать деликатные медиа по умолчанию',
  showPlain: 'Показать простой серый цвет для деликатного медиа',
  allSensitive: 'Относиться ко всем медиа как к деликатным',
  largeMedia: 'Показывать большие изображения и видео',
  autoplayGifs: 'Автовоспроизведение анимированных GIF-файлов',
  hideCards: 'Скрыть предварительный просмотр ссылок',
  underlineLinks: 'Подчеркивание ссылок в записях и профилях',
  accessibility: 'Специальные возможности',
  reduceMotion: 'Уменьшить анимацию интерфейса',
  disableTappable: 'Отключить нажимаемую область на записи.',
  removeEmoji: 'Удалить эмодзи из имен пользователей',
  shortAria: 'Использовать метки ARIA для коротких статей',
  theme: 'Тема',
  themeForInstance: 'Тема для {instance}',
  disableCustomScrollbars: 'Отключить пользовательские полосы прокрутки',
  bottomNav: 'Поместите панель навигации в нижнюю часть экрана',
  centerNav: 'Центрировать панель навигации',
  preferences: 'Предпочтения',
  hotkeySettings: 'Настройки горячих клавиш',
  disableHotkeys: 'Отключить все горячие клавиши',
  leftRightArrows: 'Клавиши со стрелками влево/вправо изменяют фокус, а не столбцы/медиа',
  guide: 'Руководство',
  reload: 'Перезагрузить',
  // Wellness settings
  wellness: 'Здоровье',
  wellnessDescription: `Настройки здоровья предназначены для уменьшения вызывающих привыкание или тревогу аспектов социальных сетей.
    Выберите любые варианты, которые вам подходят.`,
  enableAll: 'Включить все',
  metrics: 'Метрики',
  hideFollowerCount: 'Скрыть количество подписчиков (до 10)',
  hideReblogCount: 'Скрыть количество продижений',
  hideFavoriteCount: 'Скрыть количество избранных',
  hideUnread: 'Скрыть количество непрочитанных уведомлений (например, красную точку)',
  // The quality that makes something seem important or interesting because it seems to be happening now
  immediacy: 'Оперативность',
  showAbsoluteTimestamps: 'Показывать абсолютные метки времени (например, «3-е марта») вместо относительных меток времени (например, «5 минут назад»)',
  ui: 'Интерфейс',
  language: 'Язык',
  interfaceLanguage: 'Язык интерфейса',
  grayscaleMode: 'Режим оттенков серого',
  wellnessFooter: `Эти настройки частично основаны на рекомендациях
    <a rel="noopener" target="_blank" href="https://humanetech.com">Центра гуманитарных технологий</a>.`,
  // This is a link: "You can filter or disable notifications in the _instance settings_"
  filterNotificationsPre: 'Вы можете фильтровать или отключать уведомления в',
  filterNotificationsText: 'настройках инстанса',
  filterNotificationsPost: '',
  // Custom tooltips, like "Disable _infinite scroll_", where you can click _infinite scroll_
  // to see a description. It's hard to properly internationalize, so we just break up the strings.
  disableInfiniteScrollPre: 'Отключить',
  disableInfiniteScrollText: 'бесконечную прокрутку',
  disableInfiniteScrollDescription: `Когда бесконечная прокрутка отключена, новые записи не будут автоматически появляться в
             внизу или вверху ленты. Вместо этого кнопки позволят вам
             загружать больше контента по запросу.`,
  disableInfiniteScrollPost: '',
  // Instance settings
  loggedInAs: 'Вы вошли как',
  homeTimelineFilters: 'Фильтры главной ленты',
  notificationFilters: 'Фильтры уведомлений',
  pushNotifications: 'Всплывающее уведомление',
  // Add instance page
  storageError: `Похоже, Zocial не может хранить данные локально. Ваш браузер находится в приватном режиме
          или блокирует файлов cookie? Zocial хранит все данные локально, и для этого требуется LocalStorage и
          IndexedDB для корректной работы.`,
  javaScriptError: 'Вы должны включить JavaScript, чтобы войти в систему.',
  enterInstanceName: 'Введите имя инстанса',
  instanceColon: 'Инстанс:',
  // Custom tooltip, concatenated together
  getAnInstancePre: 'У вас нет',
  getAnInstanceText: 'инстанса',
  getAnInstanceDescription: 'Инстанс — это ваш домашний сервер Mastodon, например, mastodon.social или cybre.space.',
  getAnInstancePost: '?',
  joinMastodon: 'Присоединяйтесь к Mastodon!',
  instancesYouveLoggedInTo: 'Инстансы, в которые вы вошли:',
  addAnotherInstance: 'Добавить другой инстанс',
  youreNotLoggedIn: 'Вы не вошли ни в один инстанс.',
  currentInstanceLabel: `{instance} {current, select,
    true {(current instance)}
    other {}
  }`,
  // Link text
  logInToAnInstancePre: '',
  logInToAnInstanceText: 'Войти в инстанс',
  logInToAnInstancePost: 'чтобы начать использовать Zocial.',
  // Another custom tooltip
  showRingPre: 'Всегда показывать',
  showRingText: 'кольцо фокусировки',
  showRingDescription: `TКольцо фокусировки — это контур, показывающий элемент, на котором в данный момент установлен фокус. По умолчанию отображается
    только при использовании клавиатуры (не мыши или сенсорного экрана), но вы можете выбрать, чтобы он отображался всегда.`,
  showRingPost: '',
  instances: 'Инстансы',
  addInstance: 'Добавить инстанс',
  homeTimelineFilterSettings: 'Настройки фильтров главной ленты',
  showReblogs: 'Показать продвижения',
  showReplies: 'Показывать ответы',
  switchOrLogOut: 'Переключитесь или выйдите из этого инстанса',
  switchTo: 'Переключиться на этот инстанс',
  switchToInstance: 'Переключиться на инстанс',
  switchToNameOfInstance: 'Переключиться на {instance}',
  logOut: 'Выйти',
  logOutOfInstanceConfirm: 'Выйти из {instance}?',
  notificationFilterSettings: 'Настройки фильтра уведомлений',
  // Push notifications
  browserDoesNotSupportPush: 'Ваш браузер не поддерживает push-уведомления.',
  deniedPush: 'Вы запретили показывать уведомления.',
  osNotificationsHeading: 'Push-уведомления',
  osNotificationsDescription: 'Получать уведомления на этом устройстве, даже когда Zocial закрыт.',
  notifyOnThisDevice: 'Включить push-уведомления ОС на этом устройстве',
  notifyOnThisDevicePre: 'Включить',
  notifyOnThisDeviceTrigger: 'push-уведомления ОС',
  notifyOnThisDevicePost: 'на этом устройстве',
  inAppNotificationsHeading: 'Уведомления в приложении',
  inAppNotificationsDescription: 'Какая активность отображается во вкладке уведомлений.',
  notificationSoundHeading: 'Звуки уведомлений',
  notificationSoundDescription: 'Воспроизводить звук при поступлении нового уведомления.',
  notificationSounds: 'Звуки уведомлений',
  pushOneAccountPerDevice: 'Push-уведомления ОС доступны только для одного аккаунта на устройстве.',
  pushActiveForOtherAccount: 'Сейчас активно для {account}.',
  pushSwitchTitle: 'Переместить push-уведомления?',
  pushSwitchText: 'Push-уведомления ОС ограничены одним аккаунтом на устройстве. Включить для {to} и отключить для {from}?',
  pushSwitchConfirm: 'Переместить',
  pushMovedToast: 'Push-уведомления перемещены на {to} — {from} больше не будет уведомлять на этом устройстве.',
  pushSettings: 'Настройки push-уведомлений',
  newFollowers: 'Новые подписчики',
  reblogs: 'Продвижения',
  pollResults: 'Результаты опроса',
  subscriptions: 'Подписка на записи',
  needToReauthenticate: 'Вам необходимо пройти повторную аутентификацию, чтобы включить push-уведомления. Выйти из {instance}?',
  failedToUpdatePush: 'Не удалось обновить настройки push-уведомлений: {error}',
  // Themes
  chooseTheme: 'Выберите тему',
  darkBackground: 'Темный фон',
  lightBackground: 'Светлый фон',
  themeLabel: `{label} {default, select,
    true {(default)}
    other {}
  }`,
  animatedImage: 'Анимированное изображение: {description}',
  showImage: `Показывать {animated, select,
    true {animated}
    other {}
  } image: {description}`,
  playVideoOrAudio: `Воспроизводить {audio, select,
    true {audio}
    other {video}
  }: {description}`,
  accountFollowedYou: '{name} подписался на вас, {account}',
  accountSignedUp: '{name} зарегистрировался, {account}',
  reblogCountsHidden: 'Количество продвижений скрыто',
  favoriteCountsHidden: 'Количество избранного скрыто',
  rebloggedTimes: `Продвинуто {count, plural,
    one {1 time}
    other {{count} times}
  }`,
  favoritedTimes: `Добавлено в избранное {count, plural,
    one {1 time}
    other {{count} times}
  }`,
  pinnedStatus: 'Закрепленная запись',
  rebloggedYou: 'продвинул вашу запись',
  favoritedYou: 'добавил(-а) в избранное вашу запись',
  followedYou: 'подписался на вас',
  signedUp: 'зарегистрировался',
  posted: 'опубликовал',
  pollYouCreatedEnded: 'Созданный вами опрос завершен',
  pollYouVotedEnded: 'Опрос, в котором вы голосовали, завершен',
  reblogged: 'продвинул(-а)',
  favorited: 'добавил(-а) в избранное',
  unreblogged: 'отменил(-а) продвижение',
  unfavorited: 'удалил(-а) из избранного',
  showSensitiveMedia: 'Показать деликатное медиа',
  hideSensitiveMedia: 'Скрыть деликатное медиа',
  clickToShowSensitive: 'Деликатное содержимое. Нажмите, чтобы показать.',
  longPost: 'Длинная запись',
  // Accessible status labels
  accountRebloggedYou: '{account} продвинул(-а) вашу запись',
  accountFavoritedYou: '{account} добавил(-а) в избранное вашу запись',
  contentWarningContent: 'Предупреждение о содержимом: {spoiler}',
  hasMedia: 'имеет медия',
  hasPoll: 'имеет опрос',
  shortStatusLabel: '{privacy} запись от {account}',
  // Privacy types
  public: 'Публичный',
  unlisted: 'Открытый',
  followersOnly: 'Только для подписчиков',
  direct: 'Личное сообщение',
  // Themes
  themeRoyal: 'Light',
  themeScarlet: 'Scarlet',
  themeSeafoam: 'Seafoam',
  themeHotpants: 'Hotpants',
  themeOaken: 'Oaken',
  themeMajesty: 'Majesty',
  themeGecko: 'Gecko',
  themeGrayscale: 'Grayscale',
  themeOzark: 'Ozark',
  themeCobalt: 'Cobalt',
  themeSorcery: 'Sorcery',
  themePunk: 'Punk',
  themeRiot: 'Riot',
  themeHacker: 'Hacker',
  themeMastodon: 'Mastodon',
  themePitchBlack: 'Pitch Black',
  themeDarkGrayscale: 'Dark Grayscale',
  // Polls
  voteOnPoll: 'Голосовать в опросе',
  pollChoices: 'Варианты опроса',
  vote: 'Голосовать',
  pollDetails: 'Детали опроса',
  refresh: 'Обновить',
  expires: 'Завершается',
  expired: 'Завершено',
  voteCount: `{count, plural,
    one {1 vote}
    other {{count} голосов}
  }`,
  // Status interactions
  clickToShowThread: '{time} - нажмите, чтобы показать тред',
  showMore: 'Показать больше',
  showLess: 'Показать меньше',
  closeReply: 'Закрыть ответ',
  cannotReblogFollowersOnly: 'Невозможно продвинуть, потому что это только для подписчиков',
  cannotReblogDirectMessage: 'Невозможно продвинуть, потому что это личное сообщение',
  reblog: 'Продвинуть',
  reply: 'Ответить',
  replyToThread: 'Ответить в треде',
  favorite: 'Добавить в избранное',
  unfavorite: 'Удалить из избранного',
  // timeline
  loadingMore: 'Загружается ещё…',
  loadMore: 'Загрузить ещё',
  showCountMore: 'Показать ещё {count}',
  nothingToShow: 'Нечего показывать.',
  couldNotLoadAccounts: 'Не удалось загрузить список. Проверьте соединение и попробуйте снова.',
  accountListUnavailable: 'Этот список здесь недоступен — аккаунт может скрывать его, или у вашего сервера его нет.',
  accountListPartial: 'Показано {shown} из {total} — остальное ваш сервер не предоставляет.',
  // status thread page
  statusThreadPage: 'Страница треда записи',
  status: 'Запись',
  // toast messages
  blockedAccount: 'Аккаунт заблокирован',
  unblockedAccount: 'Аккаунт разблокирован',
  unableToBlock: 'Не удалось заблокировать аккаунт: {error}',
  unableToUnblock: 'Не удалось разблокировать аккаунт: {error}',
  bookmarkedStatus: 'Запись добавлена в закладки',
  unbookmarkedStatus: 'Запись удалена из закладок',
  unableToBookmark: 'Не удалось добавить в закладки: {error}',
  unableToUnbookmark: 'Не удалось удалить из закладок: {error}',
  cannotPostOffline: 'Вы не можете публиковать записи в офлайн-режиме',
  cannotPostEmpty: 'Напишите что-нибудь или добавьте медиа перед публикацией.',
  pollNeedsTwoOptions: 'Добавьте в опрос хотя бы два непустых варианта.',
  unableToPost: 'Не удалось опубликовать запись: {error}',
  statusDeleted: 'Запись удалена',
  unableToDelete: 'Не удалось удалить запись: {error}',
  cannotFavoriteOffline: 'Вы не можете добавлять в избранное в офлайн-режиме режиме',
  cannotUnfavoriteOffline: 'Вы не можете удалять из избранного в офлайн-режиме режиме',
  // Custom emoji reactions
  cannotReactWithRemoteEmoji: 'Ваш сервер не позволяет реагировать удалёнными пользовательскими эмодзи',
  tooManyMediaAttachments: 'Разрешено не более {max} вложений',
  // Instance login errors
  alreadyLoggedInTo: 'Вы уже вошли на {instance}',
  areYouOffline: 'Вы офлайн?',
  invalidOauthState: 'Недействительное состояние OAuth — пожалуйста, начните вход заново',
  failedToConnectToInstance: '{error}. Не удалось подключиться к серверу.',
  instanceGenericError: `Это действительный сервер? Не блокирует ли запрос расширение браузера? Вы в режиме приватного просмотра? Если вы считаете, что это проблема вашего сервера, отправьте <a href="https://git.ztfr.eu/Dome/Zocial/src/branch/main/docs/Admin-Guide.md" target="_blank" rel="noopener">эту ссылку</a> администрации вашего сервера.`,
  unableToFavorite: 'Не удалось добавить в избранное: {error}',
  unableToUnfavorite: 'Не удалось удалить из избранного: {error}',
  followedAccount: 'Подписан(-на) на аккаунт',
  unfollowedAccount: 'Отписан(-на) от аккаунта',
  removeFollowerAccount: 'Убрать {account} из подписчиков',
  removeFollowerTitle: 'Убрать подписчика?',
  removeFollowerText: 'Убрать {account} из ваших подписчиков? Вы не сможете отменить это сами — только этот человек может снова на вас подписаться.',
  removeFollowerConfirm: 'Убрать',
  removedFollower: 'Убран(-а) из ваших подписчиков',
  removeFromFollowersNotSupported: 'Этот сервер не поддерживает удаление подписчиков.',
  unableToFollow: 'Не удалось подписаться на аккаунт: {error}',
  unableToUnfollow: 'Не удалось отписаться от аккаунта: {error}',
  accessTokenRevoked: 'Токен доступа был отозван, выполнен выход из {instance}',
  loggedOutOfInstance: 'Выполнен выход из {instance}',
  failedToUploadMedia: 'Не удалось загрузить мультимедиа: {error}',
  mutedAccount: 'Аккаунт игнорируется',
  unmutedAccount: 'Аккаунт не игнорируется',
  unableToMute: 'Не удалось добавить аккаунт в игнорируемые: {error}',
  unableToUnmute: 'Не удалось удалить аккаунт из игнорируемых: {error}',
  mutedConversation: 'Обсуждение добавлено в игнорируемые',
  unmutedConversation: 'Обсуждение удалено из игнорируемых',
  unableToMuteConversation: 'Не удалось добавить обсуждение в игнорируемые: {error}',
  unableToUnmuteConversation: 'Не удалось удалить обсуждение из игнорируемых: {error}',
  unpinnedStatus: 'Запись откреплена',
  unableToPinStatus: 'Не удалось закрепить запись: {error}',
  unableToUnpinStatus: 'Не удалось открепить запись: {error}',
  unableToRefreshPoll: 'Не удалось обновить опрос: {error}',
  unableToVoteInPoll: 'Не удалось проголосовать в опросе: {error}',
  cannotReblogOffline: 'Вы не можете продвигать в оффлайн-режиме.',
  cannotUnreblogOffline: 'Вы не можете отменить продвижение в оффлайн-режиме.',
  failedToReblog: 'Не удалось продвинуть: {error}',
  failedToUnreblog: 'Не удалось отменить продвижение: {error}',
  submittedReport: 'Жалоба отправлена',
  failedToReport: 'Не удалось отправить жалобу: {error}',
  approvedFollowRequest: 'Запрос на подписку одобрен',
  rejectedFollowRequest: 'Запрос на подписку отклонен',
  unableToApproveFollowRequest: 'Не удалось одобрить запрос на подписку: {error}',
  unableToRejectFollowRequest: 'Не удалось отклонить запрос на подписку: {error}',
  searchError: 'Ошибка во время поиска: {error}',
  hidDomain: 'Домен скрыт',
  unhidDomain: 'Домен удален из скрытых',
  unableToHideDomain: 'Не удалось скрыть домен: {error}',
  unableToUnhideDomain: 'Не удалось удалить домен из скрытых: {error}',
  showingReblogs: 'Показывать продвижения',
  hidingReblogs: 'Скрывать продвижения',
  unableToShowReblogs: 'Не удалось показать продвижения: {error}',
  unableToHideReblogs: 'Не удалось скрыть продвижения: {error}',
  unableToShare: 'Не удалось поделиться: {error}',
  unableToSubscribe: 'Не удалось подписаться: {error}',
  unableToUnsubscribe: 'Не удалось отписаться: {error}',
  showingOfflineContent: 'Интернет-запрос не выполнен. Отображается офлайн-содержимое.',
  youAreOffline: 'Похоже, вы не в сети. Вы по-прежнему можете читать записи в офлайн-режиме.',
  // Snackbar UI
  updateAvailable: 'Доступно обновление приложения.',
  // Word/phrase filters
  wordFilters: 'Фильтры слов',
  noFilters: 'У вас нет фильтров слов.',
  wordOrPhrase: 'Слово или фраза',
  contexts: 'Контексты',
  addFilter: 'Добавить фильтр',
  editFilter: 'Редактировать фильтр',
  filterHome: 'Главная и списки',
  filterNotifications: 'Уведомления',
  filterPublic: 'Публичные ленты',
  filterThread: 'Обсуждения',
  filterAccount: 'Профили',
  filterUnknown: 'Неизвестный',
  expireAfter: 'Истекает через',
  whereToFilter: 'Где фильтровать',
  irreversible: 'Необратимый',
  wholeWord: 'Целое слово',
  save: 'Сохранить',
  updatedFilter: 'Фильтр обновлён',
  createdFilter: 'Фильтр создан',
  failedToModifyFilter: 'Не удалось изменить фильтр: {error}',
  deletedFilter: 'Фильтр удалён',
  required: 'Требуется',
  // Dialogs
  profileOptions: 'Параметры профиля',
  copyLink: 'Копировать ссылку',
  emoji: 'Эмодзи',
  editMedia: 'Редактировать медиа',
  shortcutHelp: 'Быстрая помощь',
  statusOptions: 'Параметры статуса',
  confirm: 'Подтвердить',
  closeDialog: 'Закрыть диалог',
  postPrivacy: 'Конфиденциальность записи',
  homeOnInstance: 'Главная на {instance}',
  statusesTimelineOnInstance: 'Записи: {timeline} лента на {instance}',
  statusesHashtag: 'Записи: #{hashtag} хэштег',
  statusesThread: 'Записи: треды',
  statusesAccountTimeline: 'Записи: лента аккаунта',
  statusesList: 'Записи: список',
  notificationsOnInstance: 'Уведомления на {instance}',
  // Details
  statusEdited: 'Изменено',

  // --- Дополнено 2026-06-15: ранее отсутствующие ключи (использовался английский) ---
  homeMultiInstance: `
    <p>
      Войдите в инстанс, чтобы начать:
    </p>
  `,
  account: 'Аккаунт',
  start: 'Начать',
  stop: 'Остановить',
  reactions: 'Реакции',
  bubble: 'Пузырь',
  bubbleTimeline: 'Лента «Пузырь»',
  bubbleTimelineNotLoggedIn: 'Ваша лента «Пузырь» появится здесь после входа.',
  bubbleTimelineNotSupported: 'Лента «Пузырь» не поддерживается вашим инстансом.',
  accountNotLoggedIn: 'Настройки аккаунта появятся здесь после входа.',
  filtered: 'Отфильтровано',
  youVotedFor: 'Вы проголосовали за',
  fourteenDays: '14 дней',
  thirtyDays: '30 дней',
  oneYear: '1 год',
  schedulePost: 'Запланировать запись',
  removeSchedule: 'Убрать планирование',
  scheduleSet: 'Запланировать',
  scheduleDateTimeLabel: 'Отправить в',
  scheduleTooSoon: 'Запланированное время должно быть не менее чем через 5 минут',
  scheduledStatusCreated: 'Запись запланирована',
  scheduledPosts: 'Запланированные записи',
  noScheduledPosts: 'Нет запланированных записей',
  cancelScheduledPost: 'Отменить',
  rescheduleLabel: 'Перепланировать',
  scheduledPostCancelled: 'Запланированная запись отменена',
  scheduledPostRescheduled: 'Перепланировано',
  backfill: 'Загрузить недостающие записи',
  createList: 'Создать список',
  unableToCreateList: 'Не удалось создать список: {error}',
  listTitle: 'Название списка',
  manageInLists: 'Управление участием в списках',
  listMembership: 'Участие в списках для {account}',
  noListsYet: 'Списков пока нет',
  errorInListMembership: 'Ошибка обновления участия в списке',
  listMembershipNotSupported: 'Не поддерживается этим сервером',
  translateStatus: 'Перевести запись',
  translated: `Запись переведена с {from}{detected, select,
    true { - Определено}
    other {}
  }`,
  translation: 'Перевод',
  translationTargetLanguage: 'Язык перевода',
  translationBrowserDefault: 'По умолчанию (браузер)',
  translationLanguageUnavailable: 'Список языков недоступен — язык перевода соответствует языку браузера',
  translateError: 'Произошла ошибка при переводе этой записи',
  translateRateLimit: 'Вы достигли лимита переводов',
  translateUnsupportedLanguage: 'Этот язык сейчас не поддерживается',
  alreadyInTargetLanguage: 'Запись уже на вашем языке',
  translating: 'Перевод...',
  hideTranslation: 'Скрыть перевод',
  reactToStatus: 'Отреагировать на запись',
  quoteStatus: 'Цитировать запись',
  joined: 'Регистрация',
  postingStatsSummary: 'Последние {posts} за {duration}',
  postingStatsPosts: '{total, plural, one {# запись} few {# записи} many {# записей} other {# записи}}',
  postingStatsDays: '{days, plural, one {# день} few {# дня} many {# дней} other {# дня}}',
  postingStatsYears: '{years, plural, one {# год} few {# года} many {# лет} other {# года}}',
  postingStatsOriginal: 'Оригинальные',
  postingStatsReplies: 'Ответы',
  postingStatsBoosts: 'Продвижения',
  postingStatsOriginalTitle: '{count, plural, one {# оригинальная запись} few {# оригинальные записи} many {# оригинальных записей} other {# оригинальные записи}} ({percent})',
  postingStatsRepliesTitle: '{count, plural, one {# ответ} few {# ответа} many {# ответов} other {# ответа}} ({percent})',
  postingStatsBoostsTitle: '{count, plural, one {# продвижение} few {# продвижения} many {# продвижений} other {# продвижения}} ({percent})',
  scrollToTopOfConversation: 'Прокрутить к началу обсуждения',
  scrollToTop: 'Прокрутить вверх',
  unrequestLabel: 'Отменить запрос',
  unfollowingLabel: 'Отписка...',
  unblockingLabel: 'Разблокировка...',
  unrequestingLabel: 'Отмена...',
  requestingLabel: 'Запрос...',
  locked: 'Этот аккаунт закрыт. Владелец вручную одобряет подписчиков.',
  logs: 'Журналы',
  showAllLogs: 'Показать все журналы (отладка и инфо)',
  showAllLogsHint: 'По умолчанию показываются только предупреждения и ошибки. Включите это, чтобы также видеть журналы отладки и информации.',
  copyLogs: 'Копировать журналы',
  logsCopied: 'Журналы скопированы в буфер обмена',
  logsCopyFailed: 'Не удалось скопировать журналы',
  clearLogs: 'Очистить журналы',
  clearLogsConfirm: 'Очистить все журналы? Это нельзя отменить.',
  logsCleared: 'Журналы очищены',
  showAllSpoilers: 'Раскрывать предупреждения о содержимом по умолчанию',
  announceCardDescriptionsPre: 'Озвучивать',
  announceCardDescriptionsText: 'описания предпросмотра ссылок',
  announceCardDescriptionsDescription: `Заголовок карточки предпросмотра ссылки всегда включается в озвучивание для скринридеров. \
     Включите это, чтобы также добавить текст описания под заголовком.`,
  announceCardDescriptionsPost: '',
  disableFollowRequestCount: 'Скрывать число запросов на подписку',
  hideLongPosts: 'Сворачивать длинные записи без предупреждений о содержимом',
  longPostLengthLabel: 'Порог сворачивания (символов)',
  enableThreadPolling: 'Показывать кнопку автообновления в тредах',
  defaultUnlistedReplies: 'Отвечать со скрытой видимостью по умолчанию',
  defaultLocalOnly: 'Публиковать только в локальную ленту по умолчанию',
  enableQuotePost: 'Показывать выбор «Продвинуть/Цитировать» при продвижении',
  boostOrQuote: 'Продвинуть или цитировать',
  localOnlyUnsupported: 'Ваш инстанс не поддерживает записи только для локальной ленты',
  editProfile: 'Редактировать профиль',
  editProfileDisplayName: 'Отображаемое имя',
  editProfileBio: 'О себе',
  editProfileFields: 'Метаданные профиля',
  editProfileFieldName: 'Метка',
  editProfileFieldValue: 'Содержимое',
  editProfileChangeAvatar: 'Изменить аватар',
  editProfileChangeHeader: 'Изменить шапку',
  editProfileSave: 'Сохранить',
  editProfileSaving: 'Сохранение…',
  profileUpdated: 'Профиль обновлён',
  profileUpdateFailed: 'Не удалось обновить профиль: {error}',
  threadPollingStart: 'Автообновление ответов (каждые 30 с)',
  threadPollingStop: 'Остановить автообновление',
  enableDesktopNotifications: 'Включить уведомления на рабочем столе',
  deviceNotificationsForegroundOnly: 'Этот сервер не поддерживает фоновые push-уведомления, поэтому вы будете получать уведомления только пока Zocial открыт в этой вкладке.',
  osNotificationsPromptTitle: 'Включить уведомления на этом устройстве?',
  osNotificationsPromptText: 'Получайте уведомления на рабочем столе или push-уведомления на этом устройстве, когда что-то происходит. Вы можете изменить это в любой момент в настройках. Уведомления в приложении остаются включёнными в любом случае.',
  enableNotifications: 'Включить',
  notNow: 'Не сейчас',
  desktopNotificationsNotSupported: 'Ваш браузер не поддерживает уведомления на рабочем столе.',
  desktopNotificationsBlocked: 'Уведомления на рабочем столе заблокированы. Разрешите их в настройках браузера или системы.',
  desktopNotificationTitle: 'Zocial',
  desktopNotificationBody: `{count, plural,
    one {1 новое уведомление}
    few {{count} новых уведомления}
    many {{count} новых уведомлений}
    other {{count} новых уведомления}
  }`,
  hideReplyCount: 'Скрывать число ответов',
  disableNotificationSound: 'Отключить звуки уведомлений',
  composer: 'Редактор',
  filterNotificationsTextSingle: 'настройки аккаунта',
  followedHashtags: 'Отслеживаемые хэштеги',
  noFollowedHashtags: 'Вы не отслеживаете ни одного хэштега.',
  addHashtag: 'Отслеживать хэштег',
  accountRequestedFollow: '{name} запросил(-а) подписку на вас, {account}',
  accountReported: '{name} отправил(-а) жалобу, {account}',
  unhandledNotification: 'Необработанный тип уведомления {type}',
  moved: 'переехал(-а) на',
  bite: 'укусил(-а) вас',
  reactionCountsHidden: 'Число реакций скрыто',
  reactedTimes: `Отреагировал(-а) {count, plural,
    one {{count} раз}
    few {{count} раза}
    many {{count} раз}
    other {{count} раза}
  }`,
  reacted: 'отреагировал(-а) эмодзи',
  reactedWith: 'отреагировал(-а)',
  edited: 'отредактировал(-а) свою запись',
  requestedFollow: 'запросил(-а) подписку на вас',
  reported: 'отправил(-а) жалобу',
  boostsAction: 'продвинул(-а)',
  repliesTo: 'в ответ',
  startedThread: 'начал(-а) тему',
  accountEdited: '{account} отредактировал(-а) свою запись',
  rebloggedByAccount: '{account} продвинул(-а) {original}',
  themeTangerine: 'Tangerine',
  themeZocial: 'Zocial',
  themeEmber: 'Ember',
  themeCohostLight: 'Cohost Light',
  replyTo: 'В ответ',
  replyToLower: 'в ответ',
  addWordFilter: 'Добавить фильтр слов',
  dropFiltersNotSupported: 'Этот сервер не поддерживает необратимые (отбрасывающие) фильтры. Оставьте «Необратимый» снятым, чтобы вместо этого скрывать подходящие записи за предупреждением.',
  copy: 'Копировать',
  localOnly: 'Только локально',
  contentType: 'Тип содержимого',
  contentTypeLabel: 'Изменить тип содержимого (сейчас {label})',
  // Заголовок редактора (редактировать/ответить/цитировать) + вариант опроса
  editing: 'Редактировать',
  replyingTo: 'Ответ на',
  quoting: 'Цитировать',
  aPost: 'запись',
  aPostBy: 'запись от {handle}',
  dontEdit: 'Не редактировать',
  dontReply: 'Не отвечать',
  dontQuote: 'Не цитировать',
  addPollChoice: 'Добавить вариант'
}
