import { mark, stop } from '../../_utils/marks.js'

function pageToNavObject (page, lists) {
  if (page === '/federated') {
    return { name: 'federated', href: '/federated', svg: '#fa-globe', label: 'intl.federated' }
  } else if (page === '/bubble') {
    return { name: 'bubble', href: '/bubble', svg: '#fa-circle', label: 'intl.bubble' }
  } else if (page === '/direct') {
    return { name: 'direct', href: '/direct', svg: '#fa-envelope', label: 'intl.directMessages' }
  } else if (page === '/favorites') {
    return { name: 'favorites', href: '/favorites', svg: '#fa-star', label: 'intl.favorites' }
  } else if (page === '/bookmarks') {
    return { name: 'bookmarks', href: '/bookmarks', svg: '#fa-bookmark', label: 'intl.bookmarks' }
  } else if (page && page.startsWith('/lists/')) {
    // Resolve each pinned list's title from its own id, so multiple pinned lists
    // are labeled correctly (not all with the first list's title).
    const listId = page.split('/').slice(-1)[0]
    const list = lists && lists.find(_ => _.id === listId)
    return {
      name: `lists/${listId}`,
      href: page,
      svg: '#fa-bars',
      label: (list && list.title) || 'intl.list'
    }
  }

  return { name: 'local', href: '/local', svg: '#fa-users', label: 'intl.local' }
}

export function navComputations (store) {
  mark('navComputations')

  store.compute(
    'navPages',
    ['pinnedPagesForInstance', 'lists', 'navTabOrderForInstance'],
    (pinnedPagesForInstance, lists, navTabOrderForInstance) => {
      const pages = Array.isArray(pinnedPagesForInstance)
        ? pinnedPagesForInstance
        : [pinnedPagesForInstance || '/bookmarks']

      const pinnedPageObjects = pages
        .filter(Boolean)
        .slice(0, 2)
        .map(page => pageToNavObject(page, lists))

      const defaultOrder = [
        { name: 'home', href: '/', svg: '#logo', label: 'intl.home' },
        ...pinnedPageObjects,
        { name: 'notifications', href: '/notifications', svg: '#fa-bell', label: 'intl.notifications' },
        { name: 'search', href: '/search', svg: '#fa-search', label: 'intl.search' },
        { name: 'settings', href: '/settings', svg: '#fa-gear', label: 'intl.settings' }
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
