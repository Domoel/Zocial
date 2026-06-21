export default {
  // Home page, basic <title> and <description>
  appName: 'Zocial',
  appDescription: 'Un client alternatif pour Mastodon, concentré sur la vitesse et la simplicité',
  homeDescription: `
    <p>
      Un client Mastodon minimaliste et original.
    </p>`,
  homeMultiInstance: `
    <p>
      Connectez-vous à une instance pour commencer :
    </p>`,
  logIn: 'Se connecter',
  footer: `
    <p>
      Powered by <a rel="noopener" target="_blank" href="https://ztfr.eu">Zeitfresser</a> · <a href="/settings/about#donations" rel="prefetch">Donations</a> · <a href="/settings/about#privacy-policy" rel="prefetch">Privacy Policy</a> · <a rel="noopener" target="_blank" href="https://git.ztfr.eu/Dome/Zocial/releases">Zocial v{version}</a>
    </p>
  `,
  // Generic UI
  loading: 'Chargement en cours',
  okay: 'OK',
  cancel: 'Annuler',
  alert: 'Alerte',
  close: 'Fermer',
  account: 'Compte',
  start: 'Démarrer',
  stop: 'Arrêter',
  error: 'Erreur: {error}',
  errorShort: 'Erreur:',
  // Relative timestamps
  justNow: 'il y a un moment',
  // Navigation, page titles
  navItemLabel: `
    {label} {selected, select,
      true {(page actuelle)}
      other {}
    } {name, select,
      notifications {{count, plural,
        =0 {}
        one {(1 notification)}
        other {({count} notifications)}
      }}
      community {{count, plural,
        =0 {}
        one {(1 demande de suivre)}
        other {({count} demandes de suivre)}
      }}
      other {}
    }
  `,
  blockedUsers: 'Utilisateurs bloqués',
  bookmarks: 'Signets',
  directMessages: 'Messages directs',
  favorites: 'Favoris',
  reactions: 'Réactions',
  bubble: 'Bulle',
  federated: 'Fédéré',
  home: 'Accueil',
  local: 'Local',
  notifications: 'Notifications',
  mutedUsers: 'Utilisateurs mis en sourdine',
  pinnedStatuses: 'Pouets épinglés',
  followRequests: 'Demandes de suivre',
  followRequestsLabel: `Demandes de suivre {hasFollowRequests, select,
    true {({count})}
    other {}
  }`,
  list: 'Liste',
  search: 'Recherche',
  pageHeader: 'Titre de page',
  goBack: 'Rentrer',
  back: 'Rentrer',
  profile: 'Profil',
  federatedTimeline: 'Historique fédéré',
  bubbleTimeline: 'Fil de bulles',
  localTimeline: 'Historique local',
  // community page
  community: 'Communauté',
  pinnableTimelines: 'Historiques épinglables',
  timelines: 'Historiques',
  lists: 'Listes',
  instanceSettings: "Paramètres d'instance",
  notificationMentions: 'Notifications de mention',
  profileWithMedia: 'Profil avec medias',
  profileWithReplies: 'Profil avec réponses',
  hashtag: 'Mot-dièse',
  // not logged in
  profileNotLoggedIn: "Un historique d'utilisateur s'apparêtra ici quand on est conncté.",
  bookmarksNotLoggedIn: "Vos signets s'apparêtront ici quand on est conncté.",
  directMessagesNotLoggedIn: "Vos messages directes s'apparêtront ici quand on est conncté.",
  favoritesNotLoggedIn: "Vos favoris s'apparêtront ici quand on est conncté.",
  federatedTimelineNotLoggedIn: "L'historique fédéré s'apparêtra ici quand on est conncté.",
  localTimelineNotLoggedIn: "L'historique local s'apparêtra ici quand on est conncté.",
  searchNotLoggedIn: "On peut rechercher dès qu'on est conncté.",
  communityNotLoggedIn: "Les paramètres de commnautés s'apparêtront ici quand on est conncté.",
  listNotLoggedIn: "Une liste s'apparêtra ici dès qu'on est conncté.",
  notificationsNotLoggedIn: "Vos notifications s'apparêtront ici quand on est conncté.",
  notificationMentionsNotLoggedIn: "Vos notifications de mention s'apparêtront ici quand on est conncté.",
  statusNotLoggedIn: "Un historique de pouet s'apparêtra ici quand on est conncté.",
  tagNotLoggedIn: "Un historique de mot-dièse s'apparêtra ici quand on est conncté.",
  bubbleTimelineNotLoggedIn: 'Votre fil de bulles apparaîtra ici une fois connecté.',
  bubbleTimelineNotSupported: "Le fil de bulles n'est pas supporté par votre instance.",
  accountNotLoggedIn: 'Les paramètres du compte apparaîtront ici une fois connecté.',
  filtered: 'Filtré',
  // Notification subpages
  filters: 'Filtres',
  all: 'Tous',
  mentions: 'Mentions',
  // Follow requests
  approve: 'Accepter',
  reject: 'Rejeter',
  // Hotkeys
  hotkeys: 'Raccourcis clavier',
  global: 'Global',
  timeline: 'Historique',
  media: 'Medias',
  globalHotkeys: `
    {leftRightChangesFocus, select,
      true {
        <li><kbd>→</kbd> pour changer de focus à l'élément suivant</li>
        <li><kbd>←</kbd> pour changer de focus à l'élément précédent</li>
      }
      other {}
    }
    <li>
      <kbd>1</kbd> - <kbd>6</kbd>
      {leftRightChangesFocus, select,
        true {}
        other {ou <kbd>←</kbd>/<kbd>→</kbd>}
      }
      pour changer de pages
    </li>
    <li><kbd>7</kbd> ou <kbd>c</kbd> pour écrire une nouvelle publication</li>
    <li><kbd>s</kbd> ou <kbd>/</kbd> pour rechercher</li>
    <li><kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>←</kbd>/<kbd>→</kbd> pour déplacer l’onglet sélectionné</li>
    <li><kbd>g</kbd> + <kbd>h</kbd> pour aller à l’accueil</li>
    <li><kbd>g</kbd> + <kbd>n</kbd> pour aller aux notifications</li>
    <li><kbd>g</kbd> + <kbd>l</kbd> pour aller au fil local</li>
    <li><kbd>g</kbd> + <kbd>b</kbd> pour aller au fil bulle</li>
    <li><kbd>g</kbd> + <kbd>t</kbd> pour aller au fil fédéré</li>
    <li><kbd>g</kbd> + <kbd>c</kbd> pour aller à la page communauté</li>
    <li><kbd>g</kbd> + <kbd>d</kbd> pour aller aux messages directs</li>
    <li><kbd>g</kbd> + <kbd>i</kbd> pour aller à la page des instances</li>
    <li><kbd>h</kbd> ou <kbd>?</kbd> pour afficher ou masquer l’aide</li>
    <li><kbd>Retour arrière</kbd> pour revenir en arrière, fermer les boîtes de dialogue</li>
  `,
  timelineHotkeys: `
    <li><kbd>j</kbd> ou <kbd>↓</kbd> pour activer la publication suivante</li>
    <li><kbd>k</kbd> ou <kbd>↑</kbd> pour activer la publication précédente</li>
    <li><kbd>.</kbd> pour afficher plus et remonter en haut</li>
    <li><kbd>o</kbd> pour ouvrir</li>
    <li><kbd>f</kbd> pour ajouter aux favoris</li>
    <li><kbd>b</kbd> pour partager</li>
    <li><kbd>r</kbd> pour répondre</li>
    <li><kbd>e</kbd> pour modifier vos propres publications</li>
    <li><kbd>q</kbd> pour citer une publication, si pris en charge</li>
    <li><kbd>Escape</kbd> pour fermer la réponse</li>
    <li><kbd>a</kbd> pour mettre en signet</li>
    <li><kbd>i</kbd> pour ouvrir les images, vidéos ou audio</li>
    <li><kbd>y</kbd> pour afficher ou masquer les médias sensibles</li>
    <li><kbd>m</kbd> pour mentionner l’auteur</li>
    <li><kbd>p</kbd> pour ouvrir le profil de l’auteur</li>
    <li><kbd>l</kbd> pour ouvrir le lien de la carte dans un nouvel onglet</li>
    <li><kbd>x</kbd> pour afficher ou masquer le texte derrière un avertissement de contenu</li>
    <li><kbd>z</kbd> pour afficher ou masquer tous les avertissements de contenu d’un fil</li>
    <li><kbd>t</kbd> pour traduire une publication</li>
  `,
  mediaHotkeys: `
    <li><kbd>←</kbd> / <kbd>→</kbd> pour voir la prochaine ou dernière image</li>
  `,
  // Community page, tabs
  tabLabel: `{label} {current, select,
    true {(Actuel)}
    other {}
  }`,
  pageTitle: `
    {hasNotifications, select,
      true {({count})}
      other {}
    }
    {name}
    ·
    {showInstanceName, select,
      true {{instanceName}}
      other {Zocial}
    }
  `,
  pinLabel: `{label} {pinnable, select,
    true {
      {pinned, select,
        true {(Page épinglée)}
        other {(Page non-épinglée)}
      }
    }
    other {}
  }`,
  pinPage: 'Epingler {label}',
  // Status composition
  composeStatus: 'Ecrire un pouet',
  postStatus: 'Pouet!',
  contentWarning: 'Avertissement',
  dropToUpload: 'Déposer',
  invalidFileType: "Impossible d'uploader ce type de fichier",
  composeLabel: "Qu'avez vous en tête?",
  autocompleteDescription: 'Quand les résultats sont dispibles, appuyez la fleche vers le haut ou vers le bas pour selectionner.',
  mediaUploads: 'Medias uploadés',
  edit: 'Rediger',
  delete: 'Supprimer',
  description: 'Déscription',
  descriptionLabel: 'Décrire pour les aveugles (image, video) ou les sourds (audio, video)',
  markAsSensitive: 'Désigner comme sensible',
  // Polls
  createPoll: 'Créer une enquête',
  removePollChoice: 'Supprimer la choix {index}',
  pollChoiceLabel: 'Choix {index}',
  multipleChoice: 'Choix multiple',
  pollDuration: "Duration de l'enquête",
  fiveMinutes: '5 minutes',
  thirtyMinutes: '30 minutes',
  oneHour: '1 heure',
  sixHours: '6 heures',
  oneDay: '1 jour',
  threeDays: '3 jours',
  sevenDays: '7 jours',
  addEmoji: 'Insérer un emoji',
  addMedia: 'Ajouter un media (images, vidéos, audios)',
  addPoll: 'Ajouter une enquête',
  removePoll: "Enlever l'enquête",
  postPrivacyLabel: 'Changer de confidentialité (actuellement {label})',
  addContentWarning: 'Ajouter une avertissement',
  removeContentWarning: "Enlever l'avertissement",
  altLabel: 'Décrire pour les aveugles ou les sourds',
  extractText: "Extraire le texte de l'image",
  extractingText: 'Extraction de texte en cours…',
  extractingTextCompletion: 'Extraction de texte en cours ({percent}% finit)…',
  unableToExtractText: "Impossible d'extraire le texte.",
  // Account options
  followAccount: 'Suivre {account}',
  unfollowAccount: 'Ne plus suivre {account}',
  blockAccount: 'Bloquer {account}',
  unblockAccount: 'Ne plus bloquer {account}',
  muteAccount: 'Mettre {account} en sourdine',
  unmuteAccount: 'Ne plus mettre {account} en sourdine',
  showReblogsFromAccount: 'Afficher les partages de {account}',
  hideReblogsFromAccount: 'Ne plus afficher les partages de {account}',
  showDomain: 'Ne plus cacher {domain}',
  hideDomain: 'Cacher {domain}',
  reportAccount: 'Signaler {account}',
  mentionAccount: 'Mentionner {account}',
  copyLinkToAccount: 'Copier un lien vers ce compte',
  copiedToClipboard: 'Copié vers le presse-papiers',
  // Media dialog
  navigateMedia: 'Changer de medias',
  showPreviousMedia: 'Afficher le media précédent',
  showNextMedia: 'Afficher le media suivant',
  enterPinchZoom: 'Pincer pour zoomer',
  exitPinchZoom: 'Ne plus pincer pour zoomer',
  showMedia: `Afficher le {index, select,
    1 {premier}
    2 {deuxième}
    3 {troisième}
    other {quatrième}
  } média {current, select,
    true {(actuel)}
    other {}
  }`,
  previewFocalPoint: 'Aperçu (point de mire)',
  enterFocalPoint: 'Saisir le point de mire (X, Y) pour ce média',
  muteNotifications: 'Mettre aussi bien les notifications en sourdine',
  muteAccountConfirm: 'Mettre {account} en sourdine?',
  mute: 'Mettre en sourdine',
  unmute: 'Ne plus mettre en sourdine',
  zoomOut: 'Dé-zoomer',
  zoomIn: 'Zoomer',
  // Reporting
  reportingLabel: 'Vous signalez {account} aux modérateurs/modératrices de {instance}.',
  additionalComments: 'Commentaires additionels',
  forwardDescription: 'Faire parvenir aux modérateurs/modératrices de {instance} aussi?',
  forwardLabel: 'Fair pervenir à {instance}',
  unableToLoadStatuses: 'Impossible de charger les pouets récents: {error}',
  report: 'Signaler',
  noContent: '(Pas de contenu)',
  noStatuses: 'Aucun pouet à signaler',
  // Status options
  unpinFromProfile: 'Ne plus épingler sur son profil',
  pinToProfile: 'Epingler sur son profil',
  muteConversation: 'Mettre en sourdine la conversation',
  unmuteConversation: 'Ne plus mettre en sourdine la conversation',
  bookmarkStatus: 'Ajouter aux signets',
  unbookmarkStatus: 'Enlever des signets',
  deleteAndRedraft: 'Supprimer et rediger',
  reportStatus: 'Signaler ce pouet',
  shareStatus: 'Partager ce pouet externellement',
  copyLinkToStatus: 'Copier un lien vers ce pouet',
  // Account profile
  profileForAccount: 'Profil pour {account}',
  statisticsAndMoreOptions: "Statistiques et plus d'options",
  statuses: 'Pouets',
  follows: 'Suis',
  followers: 'Suivants',
  moreOptions: "Plus d'options",
  followersLabel: 'Suivi(e) par {count}',
  followingLabel: 'Suis {count}',
  followLabel: `Suivre {requested, select,
    true {(suivre demandé)}
    other {}
  }`,
  unfollowLabel: `Ne plus suivre {requested, select,
    true {(suivre demandé)}
    other {}
  }`,
  unblock: 'Ne plus bloquer',
  nameAndFollowing: 'Nom et suivants',
  clickToSeeAvatar: "Cliquer pour voir l'image de profile",
  opensInNewWindow: '{label} (ouvrir dans un nouvel onglet)',
  blocked: 'Bloquer',
  domainHidden: 'Domaine bloqué',
  muted: 'Mis en sourdine',
  followsYou: 'Suivant',
  avatarForAccount: 'Image de profil pour {account}',
  fields: 'Champs',
  accountHasMoved: '{account} a déménagé',
  profilePageForAccount: 'Page de profil pour {account}',
  verified: 'Verified',
  // About page
  about: 'Infos',
  aboutApp: 'Infos sur Zocial',
  aboutAppDescription: `
  <p>
    Zocial est un logiciel <a rel="noopener" target="_blank" href="https://git.ztfr.eu/Dome/Zocial">open-source</a> et un fork d'<a rel="noopener" target="_blank" href="https://github.com/enafore/enafore">Enafore</a>, créé par <a rel="noopener" target="_blank" href="https://social.ztfr.eu/@dome">Dome</a>.
  </p>

  <h2 id="privacy-policy">Politique de confidentialité</h2>

  <p>
    Zocial ne conserve aucune information personnelle sur ses serveurs, y compris, mais sans s'y limiter, les noms, adresses e-mail, adresses IP, publications et photos.
  </p>

  <p>
    Zocial est un site statique qui peut être hébergé n'importe où (par exemple GitHub Pages). Il est fourni sous forme d'<a rel="noopener" target="_blank" href="https://hub.docker.com/r/domoel/zocial">image Docker</a> et peut être déployé avec un serveur web nginx. Toutes les données sont stockées localement dans votre navigateur et partagées uniquement avec la ou les instances du fédiverse auxquelles vous vous connectez.
  </p>

  <h2>Traductions</h2>

  <p>
    La traduction des publications est assurée par <a rel="noopener" target="_blank" href="https://libretranslate.com">LibreTranslate</a> — un moteur de traduction open source sans dépendance à Google. Les requêtes transitent par le serveur, de sorte qu'aucun service de traduction n'est contacté directement depuis votre navigateur. L'auto-hébergement est pris en charge via la variable d'environnement <code>TRANSLATE_API</code>.
  </p>

  <h2>Utilisation de l'IA</h2>

  <p>
    Ce projet est assisté par IA. Son développement suit toutefois une <a rel="noopener" target="_blank" href="https://git.ztfr.eu/Dome/Zocial/src/branch/main/docs/Architecture.md">philosophie de conception</a> rigoureuse et des principes de programmation stricts, et un grand soin est apporté à la mise en œuvre des nouvelles fonctionnalités. Le code est révisé régulièrement.
  </p>

  <h2>Crédits</h2>

  <p>
    Icônes fournies par <a rel="noopener" target="_blank" href="http://fontawesome.io/">Font Awesome</a>.
  </p>

  <h2>Licence</h2>

  <p>
    Zocial est distribué sous la <a rel="noopener" target="_blank" href="https://git.ztfr.eu/Dome/Zocial/src/branch/main/LICENSE">licence publique générale GNU Affero</a>. Powered by <a rel="noopener" target="_blank" href="https://ztfr.eu/">Zeitfresser</a>
  </p>

  <h2 id="donations">Dons</h2>

  <p>
    Zocial est un projet à but non lucratif et gratuit. Les dons sont entièrement facultatifs : ils aident simplement à couvrir les frais de fonctionnement de l'instance publique (domaine et hébergement).
  </p>

  <p>
    Si vous souhaitez le soutenir : <a rel="noopener" target="_blank" href="https://www.paypal.com/donate/?hosted_button_id=QMWFH4FDXN66C">Faire un don via PayPal</a>.
  </p>

  <h2>Support et développement</h2>

  <p>
    Consultez le <a rel="noopener" target="_blank" href="https://git.ztfr.eu/Dome/Zocial/src/branch/main/docs/User-Guide.md">guide d'utilisation</a> pour l'usage général et le <a rel="noopener" target="_blank" href="https://git.ztfr.eu/Dome/Zocial/src/branch/main/docs/Admin-Guide.md">guide d'administration</a> si votre instance a des difficultés à se connecter. Si vous souhaitez comprendre l'architecture sous-jacente et les choix de conception de Zocial, consultez le <a rel="noopener" target="_blank" href="https://git.ztfr.eu/Dome/Zocial/src/branch/main/docs/Architecture.md">manuel d'architecture</a>.
  </p>

  <p>
    Pour davantage d'aide ou pour participer au développement, rejoignez la <a rel="noopener" target="_blank" href="https://ztfr.eu/matrix">communauté Matrix de Zeitfresser</a> ou le <a rel="noopener" target="_blank" href="https://look.ztfr.eu/#/#support:ztfr.eu">Development &amp; Support Channel</a>.
  </p>

  <h2>Version</h2>

  <p>
    Vous utilisez Zocial version <code class="zocial-version"></code>.
  </p>`,
  // Settings
  settings: 'Paramètres',
  general: 'Général',
  generalSettings: 'Paramètres générales',
  generalSettingsLoginRequired: 'Les paramètres généraux ne sont disponibles que lorsque vous êtes connecté(e).',
  showSensitive: 'Afficher les medias sensible par défaut',
  showAllSpoilers: "Développer les avertissements de contenu par défaut",
  showPlain: 'Afficher un simple gris pour les medias sensibles',
  allSensitive: 'Considérer tous medias comme sensible',
  largeMedia: 'Afficher de plus grands images et vidéos',
  autoplayGifs: 'Repasser automatiquement les GIFs animés',
  hideCards: 'Cacher les liens «cartes»',
  underlineLinks: 'Souligner les liens dans les pouets et profils',
  accessibility: 'Accessibilité',
  reduceMotion: 'Reduire la motions dans les animations',
  disableTappable: "Désactiver l'espace touchable sur un pouet entier",
  removeEmoji: "Enlever les emojis des noms d'utilisateur",
  shortAria: 'Utiliser des etiquettes courtes ARIA',
  announceCardDescriptionsPre: 'Annoncer les descriptions des ',
  announceCardDescriptionsText: 'aperçus de liens',
  announceCardDescriptionsDescription: "Le titre est toujours annoncé. Activez ceci pour inclure la description.",
  announceCardDescriptionsPost: '',
  theme: 'Thème',
  themeForInstance: 'Theème pour {instance}',
  disableCustomScrollbars: 'Désactiver les scrollbars customisés',
  preferences: 'Préférences',
  hotkeySettings: 'Paramètres de raccourcis clavier',
  disableHotkeys: 'Désactiver les raccourcis clavier',
  leftRightArrows: 'Les flèches gauche/droit change de focus plutôt que les pages',
  guide: 'Guide',
  reload: 'Recharger',
  disableFollowRequestCount: 'Cacher le nombre de demandes de suivi',
  hideLongPosts: 'Réduire les longs messages sans avertissement de contenu',
  // Wellness settings
  wellness: 'Bien-être',
  wellnessDescription: `Les paramètres de bien-être sont dessinées pour rédruire les effets accrochants ou d'anxiété des réseaux sociaux.
    Veuillez choisir les options qui marchent pour vous.`,
  enableAll: 'Activer tous',
  metrics: 'Métrics',
  hideFollowerCount: 'Cacher le nombre de suivants (10 maximum)',
  hideReblogCount: 'Cacher le nombre de partages',
  hideFavoriteCount: 'Cacher le nombre de favoris',
  hideUnread: "Cacher le nombre de notifications (c'est-à-dire le point rouge)",
  osNotificationsHeading: 'Notifications Push',
  osNotificationsDescription: 'Soyez notifié sur cet appareil, même si Zocial est fermé.',
  notifyOnThisDevice: 'Activer les notifications push du système sur cet appareil',
  notifyOnThisDevicePre: 'Activer les',
  notifyOnThisDeviceTrigger: 'notifications push du système',
  notifyOnThisDevicePost: 'sur cet appareil',
  pushOneAccountPerDevice: 'Les notifications push du système ne sont autorisées que pour un seul compte par appareil.',
  pushActiveForOtherAccount: 'Actuellement actif pour {account}.',
  pushSwitchTitle: 'Déplacer les notifications push ?',
  pushSwitchText: 'Les notifications push du système sont limitées à un compte par appareil. Les activer pour {to} et les désactiver pour {from} ?',
  pushSwitchConfirm: 'Déplacer',
  pushMovedToast: 'Notifications push déplacées vers {to} — {from} ne notifiera plus sur cet appareil.',
  deviceNotificationsForegroundOnly: "Ce serveur ne supporte pas le push en arrière-plan.",
  inAppNotificationsHeading: 'Notifications In-App',
  inAppNotificationsDescription: 'Quelle activité apparaît dans l’onglet notifications.',
  notificationSoundHeading: 'Sons de notification',
  notificationSoundDescription: 'Jouer un son à l’arrivée d’une nouvelle notification.',
  notificationSounds: 'Sons de notification',
  osNotificationsPromptTitle: 'Activer les notifications sur cet appareil ?',
  osNotificationsPromptText: 'Recevez des notifications push ou de bureau.',
  enableNotifications: 'Activer',
  notNow: 'Pas maintenant',
  enableDesktopNotifications: 'Activer les notifications de bureau',
  desktopNotificationsNotSupported: 'Votre navigateur ne supporte pas les notifications de bureau.',
  desktopNotificationsBlocked: 'Les notifications sont bloquées.',
  desktopNotificationTitle: 'Zocial',
  desktopNotificationBody: `{count, plural, one {une nouvelle notification} other {{count} nouvelles notifications}}`,
  ui: 'Interface Utilisateur',
  language: 'Langue',
  interfaceLanguage: "Langue de l'interface",
  grayscaleMode: 'Mode echelle de gris',
  wellnessFooter: `Ces paramètres sont basé sur les recommendations du
    <a rel="noopener" target="_blank" href="https://humanetech.com">Center for Humane Technology</a>.`,
  // This is a link: "You can filter or disable notifications in the _instance settings_"
  filterNotificationsPre: 'Vous pouvez filtrer ou désactiver les notifications dans les',
  filterNotificationsText: "paramètres d'instance",
  filterNotificationsPost: '',
  // Custom tooltips, like "Disable _infinite scroll_", where you can click _infinite scroll_
  // to see a description. It's hard to properly internationalize, so we just break up the strings.
  disableInfiniteScrollPre: 'Désactiver le',
  disableInfiniteScrollText: 'défilage infini',
  disableInfiniteScrollDescription: `Quand le défilage infini est désactivé, les pouets nouveau ne
             s'apparêtront pas automatique au haut ou au bas de l'historique. Plutôt, il y aura des boutons pour
             charger sur demande.`,
  disableInfiniteScrollPost: '',
  // Instance settings
  loggedInAs: 'Connecté en tant que',
  homeTimelineFilters: "Filtres d'historique de l'acceuil",
  notificationFilters: 'Filtres de notifications',
  followedHashtags: 'Hashtags suivis',
  noFollowedHashtags: 'Vous ne suivez aucun hashtag.',
  addHashtag: 'Suivre un hashtag',
  pushNotifications: 'Filtres de notifications push',
  // Add instance page
  storageError: `Il semble que Zocial ne peut pas stocker les données en locale. Est-ce que votre navigateur
          est en mode privé, ou est-ce qu'il bloque les cookies? Zocial garde tous ses données en locale et
          ne peut pas fonctionner sans LocalStorage ou IndexedDB.`,
  javaScriptError: 'Le JavaScript devrait être activé pour continuer.',
  enterInstanceName: "Saisir le nom d'instance",
  instanceColon: 'Instance:',
  // Custom tooltip, concatenated together
  getAnInstancePre: "N'avez-vous pas d'",
  getAnInstanceText: 'instance',
  getAnInstanceDescription: 'Une instance est votre serveur Mastodon, par exemple mastodon.social ou cybre.space.',
  getAnInstancePost: '?',
  joinMastodon: 'Joignez-vous à Mastodon!',
  instancesYouveLoggedInTo: 'Instances conntectées:',
  addAnotherInstance: 'Ajouter une nouvelle instance',
  youreNotLoggedIn: 'Vous êtes connecté(e) à aucune instance.',
  currentInstanceLabel: `{instance} {current, select,
    true {(instance actuelle)}
    other {}
  }`,
  // Link text
  logInToAnInstancePre: '',
  logInToAnInstanceText: 'Se connecter à une instance',
  logInToAnInstancePost: 'pour utiliser Zocial.',
  // Another custom tooltip
  showRingPre: 'Afficher toujours',
  showRingText: "l'anneau de focus",
  showRingDescription: `L'anneau de focus est le contour qui indique l'élément en focus actuel. Par défaut, ce n'est
    affiché que quand on utilise le clavier (et ne pas la souris ou l'écran touche), mais vous pouvez choisr de
    l'afficher toujours.`,
  showRingPost: '',
  instances: 'Les instances',
  addInstance: 'Ajouter une instance',
  homeTimelineFilterSettings: "Paramètres de filtre d'historique",
  showReblogs: 'Afficher les partages',
  showReplies: 'Afficher les réponses',
  switchOrLogOut: 'Changer ou se déconnecter de cette instance',
  switchTo: "Changer d'instance à celle-ci",
  switchToInstance: "Changer d'instance",
  switchToNameOfInstance: "Faire {instance} l'instance actuelle",
  logOut: 'Se déconnecter',
  logOutOfInstanceConfirm: 'Déconnectez-vous de {instance}?',
  notificationFilterSettings: 'Paramètres de filtre de notifications',
  // Push notifications
  browserDoesNotSupportPush: 'Votre navigateur ne soutient pas les notifications push.',
  deniedPush: 'Vous avez désactivé les notifications push.',
  pushSettings: 'Paramètres de notifications push',
  newFollowers: 'Suivants nouveaux',
  reblogs: 'Partages',
  pollResults: "Résultats d'enquête",
  needToReauthenticate: 'Vous devez ré-authentiquer pour activer les notifications push. Déconnectez-vous de {instance}?',
  failedToUpdatePush: 'Impossible de mettre à jour les paramètres de notifications push: {error}',
  // Themes
  chooseTheme: 'Choisir une thème',
  darkBackground: 'Sombre',
  lightBackground: 'Clair',
  themeLabel: `{label} {default, select,
    true {(défaut)}
    other {}
  }`,
  animatedImage: 'Image animée: {description}',
  showImage: `Afficher l'image {animated, select,
    true {animée}
    other {}
  }: {description}`,
  playVideoOrAudio: `Repasser {audio, select,
    true {l'audio}
    other {la vidéo}
  }: {description}`,
  accountFollowedYou: '{name} vous a suivi(e), {account}',
  reblogCountsHidden: 'Nombre de partages caché',
  favoriteCountsHidden: 'nombre de mises en favori caché',
  rebloggedTimes: `Partagé {count, plural,
    one {une fois}
    other {{count} fois}
  }`,
  favoritedTimes: `Mis en favori {count, plural,
    one {une fois}
    other {{count} fois}
  }`,
  pinnedStatus: 'Pouet épinglé',
  rebloggedYou: 'a partagé votre pouet',
  favoritedYou: 'a mis en favori votre pouet',
  followedYou: 'followed you',
  pollYouCreatedEnded: 'Une enquête vous avez créée a terminée',
  pollYouVotedEnded: 'Une enquête dans laquelle vous avez voté a terminée',
  reblogged: 'partagé',
  startedThread: 'a commencé un fil',
  showSensitiveMedia: 'Afficher la média sensible',
  hideSensitiveMedia: 'Cacher la média sensible',
  clickToShowSensitive: 'Image sensible. Cliquer pour afficher.',
  longPost: 'Pouet long',
  longPostLengthLabel: 'Seuil de réduction (caractères)',
  // Accessible status labels
  accountRebloggedYou: '{account} a partagé votre pouet',
  accountFavoritedYou: '{account} a mis votre pouet en favori',
  contentWarningContent: 'Avertissement: {spoiler}',
  hasMedia: 'média',
  hasPoll: 'enquête',
  shortStatusLabel: 'Pouet {privacy} par {account}',
  // Privacy types
  public: 'Publique',
  unlisted: 'Non listé',
  followersOnly: 'Abonnés/abonnées uniquement',
  direct: 'Direct',
  // Themes
  themeRoyal: 'Light',
  themeScarlet: 'Ecarlate',
  themeSeafoam: 'Ecume',
  themeHotpants: 'Hotpants',
  themeOaken: 'Chêne',
  themeMajesty: 'Majesté',
  themeGecko: 'Gecko',
  themeGrayscale: 'Echelle gris',
  themeZocial: 'Zocial',
  themeOzark: 'Ozark',
  themeCobalt: 'Cobalt',
  themeSorcery: 'Sorcellerie',
  themePunk: 'Punk',
  themeRiot: 'Riot',
  themeHacker: 'Hacker',
  themeMastodon: 'Mastodon',
  themePitchBlack: 'Noir complet',
  themeDarkGrayscale: 'Echelle gris sombre',
  // Polls
  voteOnPoll: 'Voter dans cette enquête',
  pollChoices: 'Choix',
  vote: 'Voter',
  pollDetails: 'Détails',
  refresh: 'Recharger',
  expires: 'Se termine',
  expired: 'Terminée',
  voteCount: `{count, plural,
    one {1 vote}
    other {{count} votes}
  }`,
  // Status interactions
  clickToShowThread: '{time} - cliquer pour afficher le discussion',
  showMore: 'Afficher plus',
  showLess: 'Afficher moins',
  closeReply: 'Fermer la réponse',
  cannotReblogFollowersOnly: "Impossible de partager car ce pouet n'est que pour les abonné(e)s",
  cannotReblogDirectMessage: 'Impossible de partager car ce pouet est direct',
  reblog: 'Partager',
  reply: 'Répondre',
  replyTo: 'En réponse à',
  replyToLower: 'en réponse à',
  replyToThread: 'Répondre au discussion',
  favorite: 'Mettre en favori',
  unfavorite: 'Ne plus mettre en favori',
  // timeline
  loadingMore: 'Chargement en cours…',
  loadMore: 'Charger plus',
  showCountMore: 'Afficher {count} de plus',
  nothingToShow: 'Rien à afficher.',
  couldNotLoadAccounts: 'Impossible de charger cette liste. Vérifiez votre connexion et réessayez.',
  accountListUnavailable: "Cette liste n'est pas disponible ici — le compte la garde peut-être privée, ou votre serveur ne la possède pas.",
  accountListPartial: "Affichage de {shown} sur {total} — votre serveur ne fournit pas le reste.",
  // status thread page
  statusThreadPage: 'Page de discussion',
  status: 'Pouet',
  // toast messages
  blockedAccount: 'Compte bloqué',
  unblockedAccount: 'Compte ne plus bloqué',
  unableToBlock: 'Impossible de bloquer ce compte: {error}',
  unableToUnblock: 'Impossible de ne plus bloquer ce compte: {error}',
  bookmarkedStatus: 'Ajouté aux signets',
  unbookmarkedStatus: 'Enlever des signets',
  unableToBookmark: "Impossible d'ajouter aux signets: {error}",
  unableToUnbookmark: "Impossible d'enlever des signets: {error}",
  cannotPostOffline: 'Vous ne pouvez pas poueter car vous êtes hors connexion',
  cannotPostEmpty: 'Écrivez quelque chose ou ajoutez un média avant de publier.',
  pollNeedsTwoOptions: 'Donnez à votre sondage au moins deux options non vides.',
  unableToPost: 'Impossible de poueter: {error}',
  statusDeleted: 'Pouet supprimé',
  unableToDelete: 'Impossible de supprimer: {error}',
  cannotFavoriteOffline: 'Vous ne pouvez pas mettre en favori car vous êtes hors connexion',
  cannotUnfavoriteOffline: 'Vous ne pouvez pas enlever des favoris car vous êtes hors connexion',
  // Custom emoji reactions
  cannotReactWithRemoteEmoji: "Votre instance n'autorise pas les réactions avec des émojis personnalisés distants",
  tooManyMediaAttachments: 'Seuls {max} fichiers multimédias sont autorisés',
  // Instance login errors
  alreadyLoggedInTo: 'Vous êtes déjà connecté·e à {instance}',
  areYouOffline: 'Êtes-vous hors connexion ?',
  invalidOauthState: 'État OAuth invalide — veuillez recommencer la connexion',
  failedToConnectToInstance: '{error}. La connexion au serveur a échoué.',
  instanceGenericError: `Est-ce une instance valide ? Une extension de navigateur bloque-t-elle la requête ? Êtes-vous en navigation privée ? Si vous pensez qu'il s'agit d'un problème lié à votre instance, veuillez envoyer <a href="https://git.ztfr.eu/Dome/Zocial/src/branch/main/docs/Admin-Guide.md" target="_blank" rel="noopener">ce lien</a> à l'administration de votre instance.`,
  unableToFavorite: 'Impossible de mettre en favori: {error}',
  unableToUnfavorite: "Impossible d'enlever des favoris: {error}",
  followedAccount: 'Compte suivi',
  unfollowedAccount: 'Compte ne plus suivi',
  removeFollowerAccount: 'Retirer {account} de vos abonnés',
  removeFollowerTitle: 'Retirer cet abonné ?',
  removeFollowerText: 'Retirer {account} de vos abonnés ? Vous ne pouvez pas annuler cette action vous-même — seule cette personne peut vous suivre à nouveau.',
  removeFollowerConfirm: 'Retirer',
  removedFollower: 'Retiré de vos abonnés',
  removeFromFollowersNotSupported: "Ce serveur ne permet pas de retirer des abonnés.",
  unableToFollow: 'Impossible de suivre: {error}',
  unableToUnfollow: 'Impossible de ne plus suivre: {error}',
  accessTokenRevoked: 'Authentication revoquée, déconnecté de {instance}',
  loggedOutOfInstance: 'Déconnecté de {instance}',
  failedToUploadMedia: "Impossible d'uploader: {error}",
  mutedAccount: 'Compte mis en sourdine',
  unmutedAccount: 'Compte ne plus mis en sourdine',
  unableToMute: 'Impossible de mettre en sourdine: {error}',
  unableToUnmute: 'Impossible de plus mettre en sourdine: {error}',
  mutedConversation: 'Conversation mis en sourdine',
  unmutedConversation: 'Conversation ne plus mis en sourdine',
  unableToMuteConversation: 'Impossible de mettre en sourdine: {error}',
  unableToUnmuteConversation: 'Impossible de ne plus mettre en sourdine: {error}',
  unpinnedStatus: 'Pouet ne plus épinglé',
  unableToPinStatus: "Impossible d'épingler: {error}",
  unableToUnpinStatus: 'Impossible de ne plus épingler: {error}',
  unableToRefreshPoll: 'Impossible de recharger: {error}',
  unableToVoteInPoll: 'Impossible de voter: {error}',
  cannotReblogOffline: 'Vous ne pouvez pas partager car vous êtes hors de connexion.',
  cannotUnreblogOffline: 'Vous ne pouvez pas ne plus partager car vous êtes hors de connexion.',
  failedToReblog: 'Impossible de partager: {error}',
  failedToUnreblog: 'Impossible de ne plus partager: {error}',
  submittedReport: 'Report signalé',
  failedToReport: 'Impossible de signaler: {error}',
  approvedFollowRequest: 'Demande de suivre approuvée',
  rejectedFollowRequest: 'Demande de suivre rejetée',
  unableToApproveFollowRequest: "Impossible d'appouver: {error}",
  unableToRejectFollowRequest: 'Impossible de rejeter: {error}',
  searchError: 'Erreur de recherche: {error}',
  hidDomain: 'Domaine cachée',
  unhidDomain: 'Domaine ne plus cachée',
  unableToHideDomain: 'Impossible de cacher la domaine: {error}',
  unableToUnhideDomain: 'Imipossible de ne plus cacher la domaine: {error}',
  showingReblogs: 'Partages affichés',
  hidingReblogs: 'Partages ne plus affichés',
  unableToShowReblogs: "Impossible d'afficher les partages: {error}",
  unableToHideReblogs: 'Impossible de ne plus afficher les partages: {error}',
  unableToShare: 'Impossible de partager externellement: {error}',
  showingOfflineContent: "Requête d'internet impossible. Contenu hors de connexion affiché.",
  youAreOffline: 'Il semble que vous êtes hors de connextion. Vous pouvez toujours lire les pouets dans cet état.',
  // Snackbar UI
  updateAvailable: 'Mise à jour disponible.',
  // Details
  statusEdited: 'Modifié',

  // --- Complété le 2026-06-15 : clés auparavant manquantes (retombaient sur l’anglais) ---
  // Publication / planification
  newStatus: 'Nouvelle publication',
  youVotedFor: 'Vous avez voté pour',
  twelveHours: '12 heures',
  fourteenDays: '14 jours',
  thirtyDays: '30 jours',
  oneYear: '1 an',
  never: 'Jamais',
  schedulePost: 'Planifier la publication',
  removeSchedule: 'Supprimer la planification',
  scheduleSet: 'Planifier',
  scheduleDateTimeLabel: 'Envoyer le',
  scheduleTooSoon: 'L’heure planifiée doit être au moins 5 minutes après maintenant',
  scheduledStatusCreated: 'Publication planifiée',
  scheduledPosts: 'Publications planifiées',
  noScheduledPosts: 'Aucune publication planifiée',
  cancelScheduledPost: 'Annuler',
  rescheduleLabel: 'Replanifier',
  scheduledPostCancelled: 'Publication planifiée annulée',
  scheduledPostRescheduled: 'Replanifiée',
  // Listes
  backfill: 'Charger les publications manquantes',
  createList: 'Créer une liste',
  unableToCreateList: 'Impossible de créer la liste : {error}',
  listTitle: 'Titre de la liste',
  manageLists: 'Gérer les listes',
  listMembers: 'Membres',
  tabReordered: '{label} — position {position} sur {total}',
  tabReorderHint: 'Réorganiser avec Alt + Maj + touches fléchées',
  rename: 'Renommer',
  listExclusive: 'Afficher les publications uniquement dans cette liste',
  listExclusiveHelp: 'Les membres de cette liste n’apparaîtront pas dans votre fil d’accueil.',
  listExclusiveNotSupported: 'Ce serveur ne prend pas en charge les listes exclusives.',
  deleteListTitle: 'Supprimer « {title} » ?',
  deleteListConfirm: 'Cela supprime la liste « {title} ». Les comptes qu’elle contient ne sont pas affectés ; si elle était exclusive, leurs publications réapparaissent dans votre fil d’accueil.',
  deletedList: 'Liste supprimée.',
  unableToRenameList: 'Impossible de renommer la liste : {error}',
  unableToUpdateList: 'Impossible de mettre à jour la liste : {error}',
  unableToDeleteList: 'Impossible de supprimer la liste : {error}',
  manageInLists: 'Gérer l’appartenance aux listes',
  listMembership: 'Appartenance aux listes pour {account}',
  noListsYet: 'Aucune liste pour l’instant',
  errorInListMembership: 'Erreur lors de la mise à jour de l’appartenance à la liste',
  listMembershipNotSupported: 'Non pris en charge par ce serveur',
  // Traduction
  translateStatus: 'Traduire la publication',
  translated: `Publication traduite depuis {from}{detected, select,
    true { - Détecté}
    other {}
  }`,
  translation: 'Traduction',
  translationTargetLanguage: 'Langue de traduction',
  translationBrowserDefault: 'Valeur par défaut du navigateur',
  translationLanguageUnavailable: 'Liste des langues indisponible — la langue de traduction suit la valeur par défaut du navigateur',
  translateError: 'Une erreur s’est produite lors de la traduction de cette publication',
  translateRateLimit: 'Vous avez atteint la limite de traductions',
  translateUnsupportedLanguage: 'Cette langue n’est pas prise en charge actuellement',
  alreadyInTargetLanguage: 'La publication est déjà dans votre langue',
  translating: 'Traduction en cours...',
  hideTranslation: 'Masquer la traduction',
  // Actions sur la publication
  reactToStatus: 'Réagir à la publication',
  quoteStatus: 'Citer la publication',
  joined: 'Inscription',
  // Statistiques du profil
  postingStatsSummary: 'Dernières {posts} sur {duration}',
  postingStatsPosts: '{total, plural, one {# publication} other {# publications}}',
  postingStatsDays: '{days, plural, one {# jour} other {# jours}}',
  postingStatsYears: '{years, plural, one {# an} other {# ans}}',
  postingStatsOriginal: 'Originales',
  postingStatsReplies: 'Réponses',
  postingStatsBoosts: 'Partages',
  postingStatsOriginalTitle: '{count, plural, one {# publication originale} other {# publications originales}} ({percent})',
  postingStatsRepliesTitle: '{count, plural, one {# réponse} other {# réponses}} ({percent})',
  postingStatsBoostsTitle: '{count, plural, one {# partage} other {# partages}} ({percent})',
  // Navigation / abonnements
  scrollToTopOfConversation: 'Faire défiler vers le haut de la conversation',
  scrollToTop: 'Faire défiler vers le haut',
  unrequestLabel: 'Annuler la demande',
  unfollowingLabel: 'Désabonnement...',
  unblockingLabel: 'Déblocage...',
  unrequestingLabel: 'Annulation...',
  requestingLabel: 'Demande en cours...',
  notify: 'S’abonner à {account}',
  denotify: 'Se désabonner de {account}',
  subscribedAccount: 'Abonné au compte',
  unsubscribedAccount: 'Désabonné du compte',
  locked: 'Ce compte est privé. Le propriétaire vérifie manuellement qui peut le suivre.',
  // Journaux
  logs: 'Journaux',
  showAllLogs: 'Afficher tous les journaux (débogage et info)',
  showAllLogsHint: 'Par défaut, seuls les avertissements et les erreurs sont affichés. Activez ceci pour inclure aussi les journaux de débogage et d’information.',
  copyLogs: 'Copier les journaux',
  logsCopied: 'Journaux copiés dans le presse-papiers',
  logsCopyFailed: 'Impossible de copier les journaux',
  clearLogs: 'Effacer les journaux',
  clearLogsConfirm: 'Effacer tous les journaux ? Cette action est irréversible.',
  logsCleared: 'Journaux effacés',
  // Paramètres
  bottomNav: 'Placer la barre de navigation en bas de l’écran',
  centerNav: 'Centrer la barre de navigation',
  enableThreadPolling: 'Afficher le bouton d’actualisation automatique dans les fils',
  defaultUnlistedReplies: 'Répondre en visibilité non listée par défaut',
  defaultLocalOnly: 'Publier uniquement sur le fil local par défaut',
  enableQuotePost: 'Afficher le choix Partager/Citer lors du partage',
  boostOrQuote: 'Partager ou citer',
  localOnlyUnsupported: 'Votre instance ne prend pas en charge les publications locales uniquement',
  // Modifier le profil
  editProfile: 'Modifier le profil',
  editProfileDisplayName: 'Nom affiché',
  editProfileBio: 'Bio',
  editProfileFields: 'Métadonnées du profil',
  editProfileFieldName: 'Étiquette',
  editProfileFieldValue: 'Contenu',
  editProfileChangeAvatar: 'Changer l’avatar',
  editProfileChangeHeader: 'Changer la bannière',
  editProfileSave: 'Enregistrer',
  editProfileSaving: 'Enregistrement…',
  profileUpdated: 'Profil mis à jour',
  profileUpdateFailed: 'Échec de la mise à jour du profil : {error}',
  threadPollingStart: 'Actualiser les réponses automatiquement (toutes les 30 s)',
  threadPollingStop: 'Arrêter l’actualisation automatique',
  hideReplyCount: 'Masquer le nombre de réponses',
  disableNotificationSound: 'Désactiver les sons de notification',
  immediacy: 'Immédiateté',
  showAbsoluteTimestamps: 'Afficher les horodatages absolus (par ex. « 3 mars ») au lieu des horodatages relatifs (par ex. « il y a 5 minutes »)',
  composer: 'Rédaction',
  filterNotificationsTextSingle: 'paramètres du compte',
  subscriptions: 'Publications des abonnements',
  // Textes d’action (en-tête / notifications)
  accountSignedUp: '{name} s’est inscrit, {account}',
  accountRequestedFollow: '{name} a demandé à vous suivre, {account}',
  accountReported: '{name} a envoyé un signalement, {account}',
  unhandledNotification: 'Type de notification non géré {type}',
  moved: 'a déménagé vers',
  bite: 'vous a mordu',
  reactionCountsHidden: 'Nombre de réactions masqué',
  reactedTimes: `A réagi {count, plural,
    one {1 fois}
    other {{count} fois}
  }`,
  reacted: 'a réagi avec un emoji',
  reactedWith: 'a réagi avec',
  edited: 'a modifié sa publication',
  requestedFollow: 'a demandé à vous suivre',
  reported: 'a envoyé un signalement',
  signedUp: 's’est inscrit',
  posted: 'a publié',
  boostsAction: 'a partagé',
  repliesTo: 'en réponse à',
  favorited: 'a mis en favori',
  unreblogged: 'partage annulé',
  unfavorited: 'favori retiré',
  accountEdited: '{account} a modifié sa publication',
  rebloggedByAccount: '{account} a partagé {original}',
  // Thèmes (noms propres, non traduits comme les autres)
  themeTangerine: 'Tangerine',
  themeEmber: 'Ember',
  themeCohostLight: 'Cohost Light',
  unableToSubscribe: 'Impossible de s’abonner : {error}',
  unableToUnsubscribe: 'Impossible de se désabonner : {error}',
  // Filtres de mots
  wordFilters: 'Filtres de mots',
  noFilters: 'Vous n’avez aucun filtre de mots.',
  wordOrPhrase: 'Mot ou expression',
  contexts: 'Contextes',
  addFilter: 'Ajouter un filtre',
  addWordFilter: 'Ajouter un filtre de mots',
  editFilter: 'Modifier le filtre',
  filterHome: 'Accueil et listes',
  filterNotifications: 'Notifications',
  filterPublic: 'Fils publics',
  filterThread: 'Conversations',
  filterAccount: 'Profils',
  filterUnknown: 'Inconnu',
  expireAfter: 'Expire après',
  whereToFilter: 'Où filtrer',
  irreversible: 'Irréversible',
  wholeWord: 'Mot entier',
  save: 'Enregistrer',
  updatedFilter: 'Filtre mis à jour',
  createdFilter: 'Filtre créé',
  failedToModifyFilter: 'Échec de la modification du filtre : {error}',
  dropFiltersNotSupported: 'Ce serveur ne prend pas en charge les filtres irréversibles (de suppression). Laissez « Irréversible » décoché pour masquer les publications correspondantes derrière un avertissement.',
  deletedFilter: 'Filtre supprimé',
  required: 'Obligatoire',
  // Titres de dialogues / menus (aria)
  profileOptions: 'Options du profil',
  copyLink: 'Copier le lien',
  copy: 'Copier',
  emoji: 'Emoji',
  editMedia: 'Modifier le média',
  shortcutHelp: 'Aide sur les raccourcis',
  statusOptions: 'Options de la publication',
  confirm: 'Confirmer',
  closeDialog: 'Fermer la boîte de dialogue',
  postPrivacy: 'Visibilité de la publication',
  localOnly: 'Local uniquement',
  contentType: 'Type de contenu',
  contentTypeLabel: 'Changer le type de contenu (actuellement {label})',
  // Titres de page / en-têtes de fil (aria)
  homeOnInstance: 'Accueil sur {instance}',
  statusesTimelineOnInstance: 'Publications : fil {timeline} sur {instance}',
  statusesHashtag: 'Publications : hashtag #{hashtag}',
  statusesThread: 'Publications : fil',
  statusesAccountTimeline: 'Publications : fil du compte',
  statusesList: 'Publications : liste',
  notificationsOnInstance: 'Notifications sur {instance}',
  // En-tête de rédaction (modifier/répondre/citer) + option de sondage
  editing: 'Modifier',
  replyingTo: 'Répondre à',
  quoting: 'Citer',
  aPost: 'une publication',
  aPostBy: 'une publication de {handle}',
  dontEdit: 'Ne pas modifier',
  dontReply: 'Ne pas répondre',
  dontQuote: 'Ne pas citer',
  addPollChoice: 'Ajouter un choix',
  postsAndReplies: 'Publications et réponses'
}
