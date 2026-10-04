// English strings for the "seo" namespace: page titles/descriptions for search
// engines and social previews, breadcrumb labels and structured-data text.
const seo = {
  'home.title': 'Pooja Sevak — Verified pandits for home and online pujas',
  'breadcrumb.home': 'Home',
  'breadcrumb.pujas': 'Pujas',
  'puja.title': '{name} — book a verified pandit at home',
  'puja.titleOnline': '{name} online or at home — book a verified pandit',
  // Search name for catalog names without a ritual word (Rudrabhishek → Rudrabhishek Puja).
  'puja.searchName': '{name} Puja',
  'puja.description':
    'Book {name} with a verified pandit ji at your home or online. See dakshina, duration and the samagri list.',
  'puja.descriptionPrice':
    'Book {name} with a verified pandit ji at your home or online. Dakshina from {price}. See duration and the samagri list.',
  'pandit.title': '{name} — pandit ji in {city}',
  'pandit.titleNoCity': '{name} — verified pandit ji',
  'pandit.description':
    'See the pujas, dakshina and reviews of {name}, and book a home or online puja on Pooja Sevak.',
  'og.alt': 'Pooja Sevak — verified pandits for home and online pujas',
  'org.areaServed': 'India',
  'book.title': 'Book a puja',
  'language.label': 'Read this page in',
} satisfies Record<string, string>;

export default seo;
