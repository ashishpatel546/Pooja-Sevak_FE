// English strings for the "catalog" namespace. Flat keys; {name} placeholders are interpolated.
const catalog = {
  // Metadata
  'meta.pujas.title': 'Pujas',
  'meta.pujas.description':
    'Explore sacred pujas — Griha Pravesh, Satyanarayan Katha, Rudrabhishek and more — with verified pandits at home or live online.',

  // Categories (API values mapped to labels)
  'category.all': 'All',
  'category.sanskar': 'Sanskar',
  'category.sanskar.blurb': 'Rites of passage, from naming to marriage.',
  'category.griha': 'Griha & Vastu',
  'category.griha.blurb': 'Blessings for a new home or land.',
  'category.shanti': 'Shanti & Dosh',
  'category.shanti.blurb': 'Pacify the planets and ease doshas.',
  'category.path': 'Path & Katha',
  'category.path.blurb': 'Sacred recitations and kathas.',
  'category.festival': 'Festival',
  'category.festival.blurb': 'Festive pujas, done the right way.',
  'category.abhishek': 'Abhishek & Jaap',
  'category.abhishek.blurb': 'Abhishek, jaap and havan.',

  // /pujas
  'browse.title': 'Pujas for every sacred occasion',
  'browse.description':
    'From a child’s naamkaran to a new home’s griha pravesh — choose a puja, then find a verified pandit near you or book it live online.',
  'browse.searchLabel': 'Search pujas by name or deity',
  'browse.searchPlaceholder': 'Search by puja or deity, e.g. Shiva',
  'browse.clearSearch': 'Clear search',
  'browse.filterLabel': 'Filter by category',
  'browse.loadError': 'The puja list could not be loaded',
  'browse.noMatch': 'No pujas match “{q}”',
  'browse.noneInCategory': 'No pujas in this category yet',
  'browse.showAll': 'Show all pujas',
  'browse.emptyHint': 'Try another name or deity — or tell your pandit what you need; most rituals can be arranged.',
  'browse.featured': 'Featured pujas',
  'browse.more': 'More pujas',
  'browse.unsure': 'Not sure which puja fits your occasion?',
  'browse.askPandit': 'Ask a pandit near you',

  // Puja tiles
  'tile.joiningSoon': 'Pandits joining soon',
  'tile.from': 'from {price}',
  'tile.alsoOnline': 'Also online',
  'tile.forDeity': 'For {deity}',
  'tile.about': 'About {duration}',
  'tile.view': 'View puja',

  // /pujas/[slug]
  'detail.loading': 'Opening the puja details…',
  'detail.notFound': 'We could not find this puja',
  'detail.loadError': 'This puja could not be loaded',
  'detail.notFoundHint': 'It may have been renamed or retired from the catalog.',
  'detail.exploreAll': 'Explore all pujas',
  'detail.back': 'All pujas',
  'detail.offeredTo': 'Offered to {deity}',
  'detail.about': 'About this puja',
  'detail.why': 'Why it is performed',
  'detail.samagri': 'Samagri',
  'detail.samagriHint': 'The offerings and items used in the ritual. Your pandit will confirm the final samagri list.',
  'detail.bookAside': 'Book this puja',
  'detail.dakshinaFrom': 'Dakshina starts at',
  'detail.duration': 'Typical duration',
  'detail.panditCount_one': 'Offered by {count} verified pandit',
  'detail.panditCount_other': 'Offered by {count} verified pandits',
  'detail.findNear': 'Find a pandit near me',
  'detail.bookOnline': 'Book online with sankalp',
  'detail.onlineNote':
    'Online: the pandit performs the puja live on video and takes your family’s sankalp — the formal intention — by name and gotra.',
} satisfies Record<string, string>;

export default catalog;
