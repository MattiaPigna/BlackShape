export interface HaircutEntry {
  id: number;
  name: string;
  fadeType: string;
  badge: string;
  isNew: boolean;
  imgSrc: string;
  imgAlt: string;
  products: string[];
  steps: string[];
}

export interface ServiceEntry {
  name: string;
  desc: string;
  price: string;
}

export interface TestimonialEntry {
  text: string;
  author: string;
  stars: number;
}

export const HAIRCUTS: HaircutEntry[] = [
  {
    id: 1,
    name: 'Classico',
    fadeType: 'Low Fade · Classico',
    badge: 'Best Seller',
    isNew: false,
    imgSrc: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&q=85',
    imgAlt: 'Classico — Low Fade',
    products: ['Brillantina N°5', 'Pomata Opaca', 'Fissativo Extra Hold'],
    steps: [
      'Sgrassare con shampoo detox, asciugare con telo caldo.',
      'Applicare la pomata sui capelli umidi, pettinare indietro.',
      'Definire la riga laterale con rasoio dritto e sigillare.',
    ],
  },
  {
    id: 2,
    name: 'Zero',
    fadeType: 'Skin Fade · Zero',
    badge: 'Icona',
    isNew: false,
    imgSrc: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&q=85',
    imgAlt: 'Zero — Skin Fade',
    products: ['Cera Opaca Matt', 'Balsamo Nutriente', 'Spray Finishing Platino'],
    steps: [
      'Rasare i fianchi a zero con lama affilata, sfumatura precisa.',
      'Strutturare la sommità con cera opaca distribuita a dita.',
      'Rifinire la nuca con linea netta e pulita.',
    ],
  },
  {
    id: 3,
    name: 'Sfumato',
    fadeType: 'Taper · Soft',
    badge: 'Eleganza',
    isNew: false,
    imgSrc: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=85',
    imgAlt: 'Sfumato — Taper Soft',
    products: ['Olio Nutriente', 'Crema Volumizzante', 'Lacca Leggera'],
    steps: [
      'Tagliare con forbici scalate, rispettare la forma naturale.',
      'Sfumare gradualmente nuca e tempie con pettine e clipper.',
      'Distribuire olio sui capelli finiti per lucentezza senza peso.',
    ],
  },
  {
    id: 4,
    name: 'Contrasto',
    fadeType: 'Burst Fade · High',
    badge: 'Nuovo',
    isNew: true,
    imgSrc: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&q=85',
    imgAlt: 'Burst High — Burst Fade',
    products: ['Gel Forte', 'Siero Controllo Frizz', "Cera d'Api"],
    steps: [
      "Eseguire burst fade dietro l'orecchio con precisione.",
      'Strutturare il top con gel forte, forma a onde o liscia.',
      'Ripassare le linee con rasoio elettrico per un risultato netto.',
    ],
  },
  {
    id: 5,
    name: 'Ombra',
    fadeType: 'Bald Fade · Contrast',
    badge: 'Esclusivo',
    isNew: false,
    imgSrc: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&q=85',
    imgAlt: 'Bald Contrast — Bald Fade',
    products: ['Crema Rasatura', 'Aftershave Lenitivo', 'Siero Idratante Post'],
    steps: [
      'Rasare la base con lama da barbiere per un effetto pelle a vista.',
      'Creare contrasto netto tra rasato e capello con transizione zero.',
      'Applicare aftershave raffreddante per una pelle luminosa.',
    ],
  },
  {
    id: 6,
    name: 'Cesare',
    fadeType: 'Caesar Cut · Slick Back',
    badge: 'Signature',
    isNew: false,
    imgSrc: 'https://images.unsplash.com/photo-1534297635766-a262cdcb8ee4?w=800&q=85',
    imgAlt: 'Caesar Slick — Caesar Cut Slick Back',
    products: ['Pomata Heavy Hold', 'Brillantina Vintage', 'Fissativo Finale'],
    steps: [
      'Tagliare con lunghezza uniforme sopra, pettinare tutto indietro.',
      'Applicare pomata pesante da radice a punta, lavorare il volume.',
      'Piastare se necessario e fissare con lacca leggera.',
    ],
  },
];

export const SERVICES: ServiceEntry[] = [
  { name: 'Il Rito Completo',       desc: 'Taglio + Barba + Trattamento hot towel + Finissage', price: '$95'  },
  { name: "Taglio d'Autorità",      desc: 'Taglio su misura con consulenza stilistica',           price: '$55'  },
  { name: 'La Rasatura del Don',    desc: 'Rasatura classica con rasoio dritto e schiuma calda', price: '$45'  },
  { name: 'Barba da Consigliere',   desc: 'Definizione, modellazione e trattamento della barba', price: '$35'  },
  { name: 'Trattamento Cuoio Cap.', desc: 'Maschera nutriente, massaggio cranico 20 min',        price: '$40'  },
  { name: 'Il Pacchetto Famiglia',  desc: 'Rito Completo × 4 ingressi — prezzo bloccato',        price: '$320' },
];

export const TESTIMONIALS: TestimonialEntry[] = [
  {
    text: 'Non sono mai entrato in un barbershop per uscirne con la sensazione di aver guadagnato rispetto. Qui succede ogni volta. Il Don è il mio taglio da tre anni.',
    author: 'Marco A. — New York',
    stars: 5,
  },
  {
    text: "L'ambiente, la cura, il silenzio professionale. Non si parla di sport. Si parla d'affari, con discrezione. È la mia seconda casa.",
    author: 'Vincenzo R. — Chicago',
    stars: 5,
  },
  {
    text: 'Ho portato mio figlio per il suo primo taglio da uomo. Il barbiere ha capito senza che dicessi una parola. Questo è il talento di BlackShape.',
    author: 'Antonio M. — Boston',
    stars: 5,
  },
];

const LS_KEY = 'blackshape_haircuts'

export function getHaircuts(): HaircutEntry[] {
  try {
    const stored = localStorage.getItem(LS_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return HAIRCUTS
}

export function saveHaircuts(cuts: HaircutEntry[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(cuts))
}

export function resetHaircuts(): void {
  localStorage.removeItem(LS_KEY)
}
