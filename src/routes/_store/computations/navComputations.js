import { mark, stop } from '../../_utils/marks.js'

function pageToNavObject (page, lists, messages) {
  if (page === '/federated') {
    return { name: 'federated', href: '/federated', svg: '#fa-globe', label: messages.federated }
  } else if (page === '/bubble') {
    return { name: 'bubble', href: '/bubble', svg: '#fa-circle', label: messages.bubble }
  } else if (page === '/direct') {
    return { name: 'direct', href: '/direct', svg: '#fa-envelope', label: messages.directMessages }
  } else if (page === '/favorites') {
    return { name: 'favorites', href: '/favorites', svg: '#fa-star', label: messages.favorites }
  } else if (page === '/bookmarks') {
    return { name: 'bookmarks', href: '/bookmarks', svg: '#fa-bookmark', label: messages.bookmarks }
  } else if (page && page.startsWith('/lists/')) {
    // Resolve each pinned list's title from its own id, so multiple pinned lists
    // are labeled correctly (not all with the first list's title).
    const listId = page.split('/').slice(-1)[0]
    const list = lists && lists.find(_ => _.id === listId)
    return {
      name: `lists/${listId}`,
      href: page,
      svg: '#fa-bars',
      label: (list && list.title) || messages.list
    }
  }

  return { name: 'local', href: '/local', svg: '#fa-users', label: messages.local }
}

export function navComputations (store) {
  mark('navComputations')

  // Labels come from the reactive `messages` map (keyed on the current locale) rather than the
  // imperative getMessage(), so the nav re-labels instantly when the language is switched (the
  // compute depends on `messages`, and reads the already-locale-correct map — no ordering race).
  store.compute(
    'navPages',
    ['pinnedPagesForInstance', 'lists', 'navTabOrderForInstance', 'messages'],
    (pinnedPagesForInstance, lists, navTabOrderForInstance, messages) => {
      messages = messages || {} // defensive: never crash if messages isn't ready yet
      const pages = Array.isArray(pinnedPagesForInstance)
        ? pinnedPagesForInstance
        : [pinnedPagesForInstance || '/bookmarks']

      const pinnedPageObjects = pages
        .filter(Boolean)
        .slice(0, 2)
        .map(page => pageToNavObject(page, lists, messages))

      const defaultOrder = [
        { name: 'home', href: '/', svg: '#logo', label: messages.home },
        ...pinnedPageObjects,
        { name: 'notifications', href: '/notifications', svg: '#fa-bell', label: messages.notifications },
        { name: 'search', href: '/search', svg: '#fa-search', label: messages.search },
        { name: 'settings', href: '/settings', svg: '#fa-gear', label: messages.settings }
      ]

      if (!navTabOrderForInstance) {
        return defaultOrder
      }

      const byName = Object.fromEntries(defaultOrder.map(tab => [tab.name, tab]))
      const ordered = navTabOrderForInstance
        .filter(name => name in byName)
        .map(name => byName[name])
      const orderedNames = new Set(navTabOrderForInstance)
      const remaining = defaultOrder.filter(tab => !orderedNames.has(tab.name))
      return [...ordered, ...remaining]
    }
  )

  stop('navComputations')
}
