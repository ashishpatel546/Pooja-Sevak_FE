/**
 * Suggests the Devanagari spelling of a name typed in English letters, for the family to
 * check and correct. Runs in the browser: names are never sent anywhere to be converted.
 *
 * Common names and surnames come from a small dictionary (their spelling cannot be guessed
 * from English letters: Patel → पटेल, Singh → सिंह); other words follow phonetic rules.
 */

const KNOWN: Record<string, string> = {
  // Surnames
  agarwal: 'अग्रवाल', agrawal: 'अग्रवाल', awasthi: 'अवस्थी', bajpai: 'बाजपेयी', banerjee: 'बनर्जी',
  bansal: 'बंसल', bhatt: 'भट्ट', bose: 'बोस', chatterjee: 'चटर्जी', chaturvedi: 'चतुर्वेदी',
  chaudhary: 'चौधरी', chaudhari: 'चौधरी', chauhan: 'चौहान', das: 'दास', deshmukh: 'देशमुख',
  dixit: 'दीक्षित', dubey: 'दुबे', dwivedi: 'द्विवेदी', garg: 'गर्ग', ghosh: 'घोष', goyal: 'गोयल',
  gupta: 'गुप्ता', iyer: 'अय्यर', jain: 'जैन', jha: 'झा', joshi: 'जोशी', kapoor: 'कपूर',
  khan: 'ख़ान', kulkarni: 'कुलकर्णी', kushwaha: 'कुशवाहा', maurya: 'मौर्य', mehta: 'मेहता',
  menon: 'मेनन', mishra: 'मिश्रा', mittal: 'मित्तल', mukherjee: 'मुखर्जी', nair: 'नायर',
  nigam: 'निगम', ojha: 'ओझा', pal: 'पाल', pandey: 'पांडेय', pande: 'पांडे', pathak: 'पाठक',
  patel: 'पटेल', patil: 'पाटिल', pillai: 'पिल्लई', prasad: 'प्रसाद', rajput: 'राजपूत',
  rao: 'राव', rastogi: 'रस्तोगी', rathore: 'राठौर', reddy: 'रेड्डी', saxena: 'सक्सेना',
  shah: 'शाह', sharma: 'शर्मा', shukla: 'शुक्ला', singh: 'सिंह', sinha: 'सिन्हा', soni: 'सोनी',
  srivastava: 'श्रीवास्तव', thakur: 'ठाकुर', tiwari: 'तिवारी', tomar: 'तोमर', tripathi: 'त्रिपाठी',
  trivedi: 'त्रिवेदी', upadhyay: 'उपाध्याय', verma: 'वर्मा', yadav: 'यादव',
  // Name parts
  bhai: 'भाई', ben: 'बेन', chand: 'चंद', devi: 'देवी', kumar: 'कुमार', kumari: 'कुमारी',
  lal: 'लाल', nath: 'नाथ',
  // Given names
  aarush: 'आरुष', anushka: 'अनुष्का', ayush: 'आयुष', harsh: 'हर्ष', ishaan: 'ईशान', ishan: 'ईशान',
  lakshya: 'लक्ष्य', piyush: 'पीयूष', rishabh: 'ऋषभ', vansh: 'वंश',
  aadhya: 'आध्या', aakash: 'आकाश', akash: 'आकाश', aarav: 'आरव', aditya: 'आदित्य', ajay: 'अजय',
  anand: 'आनंद', ananya: 'अनन्या', anita: 'अनीता', anjali: 'अंजलि', ankit: 'अंकित',
  ankita: 'अंकिता', arjun: 'अर्जुन', asha: 'आशा', ashish: 'आशीष', deepak: 'दीपक',
  devendra: 'देवेंद्र', dinesh: 'दिनेश', divya: 'दिव्या', diya: 'दीया', durga: 'दुर्गा',
  ganesh: 'गणेश', geeta: 'गीता', gita: 'गीता', kavita: 'कविता', kiran: 'किरण', krishna: 'कृष्ण',
  lakshmi: 'लक्ष्मी', mahesh: 'महेश', manoj: 'मनोज', mohit: 'मोहित', mukesh: 'मुकेश',
  narendra: 'नरेंद्र', neha: 'नेहा', nikita: 'निकिता', nisha: 'निशा', pooja: 'पूजा', puja: 'पूजा',
  prakash: 'प्रकाश', priya: 'प्रिया', radha: 'राधा', rahul: 'राहुल', raj: 'राज', rajesh: 'राजेश',
  rakesh: 'राकेश', ram: 'राम', ramesh: 'रमेश', rani: 'रानी', rekha: 'रेखा', rishi: 'ऋषि',
  ritu: 'ऋतु', rohit: 'रोहित', saanvi: 'सान्वी', sachin: 'सचिन', sandhya: 'संध्या',
  sanjay: 'संजय', santosh: 'संतोष', savita: 'सविता', seema: 'सीमा', shalini: 'शालिनी',
  shanti: 'शांति', shiva: 'शिव', shweta: 'श्वेता', sita: 'सीता', sneha: 'स्नेहा', sunita: 'सुनीता',
  suresh: 'सुरेश', swati: 'स्वाति', usha: 'उषा', vijay: 'विजय', vikas: 'विकास', vivaan: 'विवान',
};

// Longest spellings first, so "chh" wins over "ch" and "ch" over "c".
const CONSONANTS: [string, string][] = (
  [
    ['ksh', 'क्ष'], ['chh', 'छ'], ['shr', 'श्र'],
    ['kh', 'ख'], ['gh', 'घ'], ['ch', 'च'], ['jh', 'झ'], ['th', 'थ'], ['dh', 'ध'], ['ph', 'फ'],
    ['bh', 'भ'], ['sh', 'श'], ['gy', 'ज्ञ'],
    ['k', 'क'], ['g', 'ग'], ['c', 'क'], ['j', 'ज'], ['t', 'त'], ['d', 'द'], ['n', 'न'], ['p', 'प'],
    ['b', 'ब'], ['m', 'म'], ['y', 'य'], ['r', 'र'], ['l', 'ल'], ['v', 'व'], ['w', 'व'], ['s', 'स'],
    ['h', 'ह'], ['f', 'फ़'], ['z', 'ज़'], ['q', 'क'], ['x', 'क्स'],
  ] as [string, string][]
).sort((a, b) => b[0].length - a[0].length);

/** [spelling, independent vowel, vowel sign after a consonant] */
const VOWELS: [string, string, string][] = (
  [
    ['aa', 'आ', 'ा'], ['ai', 'ऐ', 'ै'], ['au', 'औ', 'ौ'], ['ee', 'ई', 'ी'], ['ii', 'ई', 'ी'],
    ['oo', 'ऊ', 'ू'], ['ou', 'औ', 'ौ'],
    ['a', 'अ', ''], ['i', 'इ', 'ि'], ['u', 'उ', 'ु'], ['e', 'ए', 'े'], ['o', 'ओ', 'ो'],
  ] as [string, string, string][]
).sort((a, b) => b[0].length - a[0].length);

const VIRAMA = '्';
const ANUSVARA = 'ं';

type Token = { kind: 'c'; dev: string; latin: string } | { kind: 'v'; indep: string; sign: string; latin: string };

function tokenize(word: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < word.length) {
    const v = VOWELS.find(([l]) => word.startsWith(l, i));
    if (v) {
      out.push({ kind: 'v', indep: v[1], sign: v[2], latin: v[0] });
      i += v[0].length;
      continue;
    }
    const c = CONSONANTS.find(([l]) => word.startsWith(l, i));
    if (c) {
      out.push({ kind: 'c', dev: c[1], latin: c[0] });
      i += c[0].length;
      continue;
    }
    i += 1; // anything else (digits, stray marks) is dropped
  }
  return out;
}

/** One word by the phonetic rules; `first` is the given name, `female` shapes a final "a". */
function byRules(word: string, first: boolean, female: boolean): string {
  const t = tokenize(word);
  let out = '';
  t.forEach((tok, i) => {
    const prev = t[i - 1];
    const next = t[i + 1];
    const last = i === t.length - 1;
    if (tok.kind === 'v') {
      if (!prev || prev.kind === 'v') {
        out += tok.indep;
      } else if (tok.latin === 'a' && last && (female || !first)) {
        out += 'ा'; // Shasvika → शस्विका, Sharma → शर्मा; a boy's Krishna stays कृष्ण
      } else if (tok.latin === 'i' && last && !first) {
        out += 'ी'; // surnames: Joshi → जोशी
      } else {
        out += tok.sign;
      }
      return;
    }
    // A nasal before another consonant is written as anusvara: Sandeep → संदीप.
    if ((tok.latin === 'n' || tok.latin === 'm') && next?.kind === 'c' && prev?.kind === 'v' && next.latin !== tok.latin) {
      out += ANUSVARA;
      return;
    }
    out += tok.dev;
    if (next?.kind === 'c') out += VIRAMA;
  });
  return out;
}

const LATIN = /[a-z]/i;

/** True when the text has English letters worth converting. */
export function hasLatin(text: string): boolean {
  return LATIN.test(text);
}

/** Suggested Devanagari spelling of a name. */
export function nameToDevanagari(name: string, gender?: string): string {
  const female = gender === 'female';
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w, i) => {
      if (!hasLatin(w)) return w; // already Devanagari (or initials with dots)
      const key = w.toLowerCase().replace(/[^a-z]/g, '');
      return KNOWN[key] ?? byRules(key, i === 0, female);
    })
    .join(' ');
}
