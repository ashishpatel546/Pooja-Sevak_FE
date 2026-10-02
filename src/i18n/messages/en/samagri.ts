// English strings for the "samagri" namespace: the pandit's samagri (puja items) list,
// the in-app viewer and the "pandit brings the samagri" kit.
const samagri = {
  // Viewer
  'viewer.title': 'Puja samagri list',
  'viewer.open': 'View samagri list',
  'viewer.pages_one': '{count} page',
  'viewer.pages_other': '{count} pages',
  'viewer.pageAlt': 'Samagri list for {title}, page {page} of {total}',
  'viewer.listAlt': 'Samagri list for {title}',
  'viewer.loading': 'Opening the list…',
  'viewer.loadingPage': 'Opening page {page} of {total}…',
  'viewer.error': 'The list could not be shown here.',
  'viewer.openNewTab': 'Open in a new tab',
  'viewer.updated': 'Updated {date}',
  'viewer.none': 'Pandit ji hasn’t shared a samagri list for this puja yet.',
  'viewer.genericNote':
    'Pandit ji hasn’t uploaded his own list yet. These are the items usually needed for this puja — please confirm with him.',
  'viewer.zoomHint': 'Pinch to zoom in on your phone.',
  // Full vs shorter (lighter) version of the puja
  'mode.fullList': 'Full puja list',
  'mode.lighterList': 'Shorter puja list',
  'mode.fallbackNote':
    'Pandit ji hasn’t added a separate list for the shorter version yet — this is the list for the full puja.',

  // Service dialog (pandit)
  'svc.list.label': 'Puja samagri list (required)',
  'svc.list.hint':
    'A PDF (up to 20 pages) or a clear photo of your list — up to 10 MB. Families can read it in the app before they book.',
  'svc.list.choose': 'Choose file',
  'svc.list.replace': 'Replace list',
  'svc.list.view': 'View',
  'svc.list.selected': 'Selected: {name}',
  'svc.list.currentPdf_one': 'Current list: PDF, {count} page',
  'svc.list.currentPdf_other': 'Current list: PDF, {count} pages',
  'svc.list.currentImage': 'Current list: photo',
  'svc.list.uploading': 'Uploading list…',
  'svc.list.fullLabel': 'Samagri list — full puja (required)',
  'svc.lighterList.label': 'Samagri list — shorter version (required)',
  'svc.lighterList.hint':
    'The shorter version usually needs fewer items, so add its own list. A PDF (up to 20 pages) or a clear photo — up to 10 MB.',
  'svc.lighterList.missing': 'Upload the shorter version’s samagri list',
  'svc.kit.title': 'I can bring all the puja samagri if the family wants',
  'svc.kit.hint':
    'This is only an offer — on each booking the family decides whether to get the samagri from you or arrange it themselves. Available for pujas at home only. You receive this amount in full — no commission is taken on it.',
  'svc.kit.price': 'Samagri price (₹)',
  'svc.kit.priceHint': 'For everything on your list. A change applies to new bookings only.',
  'svc.kit.pricePlaceholder': 'e.g. 1500',
  'svc.kit.fullPrice': 'Samagri price — full puja (₹)',
  'svc.kit.lighterPrice': 'Samagri price — shorter version (₹)',
  'svc.kit.lighterPriceHint': 'For everything on the shorter version’s list. A change applies to new bookings only.',
  'svc.kit.lighterPricePlaceholder': 'e.g. 900',
  'svc.err.listRequired': 'Please upload your samagri list — it is required to add a puja.',
  'svc.err.listType': 'Please upload a PDF or a photo (JPEG, PNG, WebP or HEIC).',
  'svc.err.listSize': 'The file is larger than 10 MB. Please choose a smaller one.',
  'svc.err.listPages': 'The PDF has more than 20 pages. Please upload a shorter list.',
  'svc.err.listEncrypted': 'This PDF is password-protected. Please upload one without a password.',
  'svc.err.listPdf': 'This PDF could not be opened. Please try another PDF or a photo of the list.',
  'svc.err.listImage': 'This photo could not be read. Please try a clearer photo.',
  'svc.err.listUnavailable': 'Uploads are not available right now. Please try again in a little while.',
  'svc.err.kitPrice': 'Enter a samagri price between ₹1 and ₹1,00,000.',
  'svc.err.lighterListRequired': 'Please upload the shorter version’s samagri list too — it is required to offer the shorter version.',
  'svc.err.lighterKitPrice': 'Enter the shorter version’s samagri price between ₹1 and ₹1,00,000.',

  // Pandit services page
  'services.listPdf_one': 'Samagri list: PDF, {count} page',
  'services.listPdf_other': 'Samagri list: PDF, {count} pages',
  'services.listImage': 'Samagri list: photo',
  'services.listMissing': 'Upload samagri list — required',
  'services.listUpload': 'Upload list',
  'services.fullListPdf_one': 'Full puja list: PDF, {count} page',
  'services.fullListPdf_other': 'Full puja list: PDF, {count} pages',
  'services.fullListImage': 'Full puja list: photo',
  'services.lighterListPdf_one': 'Shorter version list: PDF, {count} page',
  'services.lighterListPdf_other': 'Shorter version list: PDF, {count} pages',
  'services.lighterListImage': 'Shorter version list: photo',
  'services.lighterListMissing': 'Upload the shorter version’s samagri list',
  'services.lighterKitLine': 'Shorter version samagri · {price}',
  'services.lighterMissingBanner_one':
    '{count} puja offers the shorter version without its own samagri list. Families see the full list for now — please upload the shorter version’s list.',
  'services.lighterMissingBanner_other':
    '{count} pujas offer the shorter version without its own samagri list. Families see the full list for now — please upload the shorter version’s lists.',
  'services.kitLine': 'Samagri on request · {price}',
  'services.missingBanner_one':
    '{count} of your pujas has no samagri list yet. Families can’t see what to prepare — please upload it.',
  'services.missingBanner_other':
    '{count} of your pujas have no samagri list yet. Families can’t see what to prepare — please upload them.',

  // Public profile
  'profile.kit': 'Pandit ji can bring all the samagri · {price} (pujas at home)',
  'profile.kitBoth':
    'Pandit ji can bring all the samagri · full puja {full}, shorter version {lighter} (pujas at home)',

  // Booking wizard (family)
  'book.title': 'Puja samagri',
  'book.choice.legend': 'Who will arrange the samagri?',
  'book.choice.family': 'We will arrange it ourselves',
  'book.choice.familyHint': 'Get the items on Pandit ji’s list yourselves — no extra charge.',
  'book.kit.label': 'Get the puja samagri from Pandit ji — {price}',
  'book.kit.hint': 'Pandit ji brings everything on his list, so you don’t need to buy anything.',
  'book.family': 'Otherwise your family arranges the samagri from Pandit ji’s list.',
  'book.onlineNote': 'For online pujas, your family arranges the samagri.',
  'book.viewList': 'View list',

  // Money lines
  'price.samagriNote': 'If the booking is cancelled, the samagri amount is refunded in full too. Once the puja is done, it is paid to Pandit ji in full.',
  'price.samagri': 'Puja samagri (Pandit ji will bring)',

  // Who arranges it
  'by.pandit': 'Samagri: Pandit ji will bring it',
  'by.family': 'Samagri: your family arranges it',
  'by.panditForPandit': 'Samagri: you (Pandit ji) bring it — {price}',
  'by.familyForPandit': 'Samagri: the family will arrange it',
  'by.panditForPanditHint': 'The family has paid for the samagri. Please bring everything on your list.',
  'by.viewMyList': 'View my list',
  'by.prepareHint': 'Please get everything on Pandit ji’s list ready before the puja.',
  'by.listLink': 'View samagri list',

  // Pandit booking card money
  'pandit.samagriLine': 'Puja samagri (you bring, no commission)',
  'pandit.samagriNote': 'The samagri amount comes to you in full. If the booking is cancelled, it is refunded to the family.',

  // Dashboard checklist
  'checklist.lists': 'Upload a samagri list for every puja',
  'checklist.listsHint_one': '{count} puja is missing its list.',
  'checklist.listsHint_other': '{count} pujas are missing their list.',

  // Earnings / admin
  'earnings.samagri': 'Samagri you brought',
  'admin.samagri': 'Samagri (to pandits)',
  'admin.payout': 'Payout',
  'admin.inclSamagri': 'incl. samagri {amount}',
};

export default samagri;
