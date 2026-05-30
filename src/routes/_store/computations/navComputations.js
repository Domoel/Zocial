import { mark, stop } from '../../_utils/marks.js'

function pageToNavObject (page, pinnedListTitle) {
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
    return {
      name: `lists/${page.split('/').slice(-1)[0]}`,
      href: page,
      svg: '#fa-bars',
      label: pinnedListTitle
    }
  }

  return { name: 'local', href: '/local', svg: '#fa-users', label: 'intl.local' }
}

export function navComputations (store) {
  mark('navComputations')

  store.compute(
    'pinnedListTitle',
    ['lists', 'pinnedPagesForInstance'],
    (lists, pinnedPagesForInstance) => {
      const pages = Array.isArray(pinnedPagesForInstance)
        ? pinnedPagesForInstance
        : [pinnedPagesForInstance]

      const listPage = pages.find(page => page && page.startsWith('/lists/'))

      if (!listPage) {
        return ''
      }

      const listId = listPage.split('/').slice(-1)[0]
      const list = lists.find(_ => _.id === listId)
      return list ? list.title : ''
    }
  )

  store.compute(
    'navPages',
    ['pinnedPagesForInstance', 'pinnedListTitle'],
    (pinnedPagesForInstance, pinnedListTitle) => {
      const pages = Array.isArray(pinnedPagesForInstance)
        ? pinnedPagesForInstance
        : [pinnedPagesForInstance || '/bookmarks']

      const pinnedPageObjects = pages
        .filter(Boolean)
        .slice(0, 2)
        .map(page => pageToNavObject(page, pinnedListTitle))

      return [
        { name: 'home', href: '/', svg: '#logo', label: 'intl.home' },
        { name: 'notifications', href: '/notifications', svg: '#fa-bell', label: 'intl.notifications' },
        ...pinnedPageObjects,
        { name: 'search', href: '/search', svg: '#fa-search', label: 'intl.search' },
        { name: 'settings', href: '/settings', svg: '#fa-gear', label: 'intl.settings' }
      ]
    }
  )

  stop('navComputations')
}
