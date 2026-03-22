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
      'Lava i capelli e asciuga con il phon tenendo la forma naturale.',
      'Applica una piccola quantità di pomata sui capelli ancora leggermente umidi.',
      'Pettina tutto indietro o di lato e lascia asciugare senza toccare.',
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
      'Dopo la doccia, asciuga completamente i capelli con il phon.',
      'Distribuisci la cera opaca a dita sulla sommità, dai radice a punta.',
      'Modella la forma con le mani e lascia asciugare senza pettinare.',
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
      'Lava i capelli e asciuga con il phon a bassa temperatura per non rovinare la forma.',
      'Applica qualche goccia di olio sui capelli asciutti per lucentezza naturale.',
      'Pettina seguendo la forma del taglio senza forzare, il risultato viene da solo.',
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
      'Asciuga i capelli completamente con il phon, spingendo il volume verso l\'alto.',
      'Applica il gel sulla sommità e modella la forma con le mani.',
      'Lascia asciugare senza toccare per mantenere la forma tutto il giorno.',
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
      'Idrata la pelle rasata ogni mattina con il siero idratante per evitare irritazioni.',
      'Applica la cera sulla parte superiore e modella con le dita.',
      'Usa lo spray finishing per un effetto pulito e definito tutto il giorno.',
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
      'Asciuga con il phon spingendo tutti i capelli verso dietro fin da subito.',
      'Applica la pomata da radice a punta lavorando con entrambe le mani.',
      'Pettina tutto all\'indietro e passa la brillantina per un effetto lucido e compatto.',
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
