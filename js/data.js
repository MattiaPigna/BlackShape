"use strict";

// ─────────────────────────────────────────────────────────────
//  BlackShape Barbershop — Shared Data Layer
//  Loaded as classic script (no module) for file:// compatibility
// ─────────────────────────────────────────────────────────────

const HAIRCUTS = [
  {
    id: 1,
    name: "Il Don",
    fadeType: "Low Fade · Classico",
    badge: "Best Seller",
    isNew: false,
    imgSrc: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&q=85",
    imgAlt: "Il Don — Low Fade classico",
    products: ["Brillantina Moretti N°5", "Pomata Nera Siciliana", "Fissativo d'Onore"],
    steps: [
      "Sgrassare con shampoo detox, asciugare con telo caldo.",
      "Applicare la pomata sui capelli umidi, pettinare indietro.",
      "Definire la riga laterale con rasoio dritto. Sigillare."
    ]
  },
  {
    id: 2,
    name: "L'Esecutore",
    fadeType: "Skin Fade · Zero",
    badge: "Icona",
    isNew: false,
    imgSrc: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&q=85",
    imgAlt: "L'Esecutore — Skin Fade",
    products: ["Cera Nera Opaca", "Balsamo Anti-ribellione", "Spray Finishing Platino"],
    steps: [
      "Rasare i fianchi a zero con lama affilata, sfumatura precisa.",
      "Strutturare la sommità con cera opaca distribuita a dita.",
      "Rifinire la nuca con linea netta. Zero imperfezioni."
    ]
  },
  {
    id: 3,
    name: "Il Consigliere",
    fadeType: "Taper · Soft",
    badge: "Eleganza",
    isNew: false,
    imgSrc: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=85",
    imgAlt: "Il Consigliere — Taper Soft",
    products: ["Olio di Oliva Siculo", "Crema Volumizzante Palermo", "Lacca Leggera"],
    steps: [
      "Tagliare con forbici scalate, rispettare la forma naturale.",
      "Sfumare gradualmente nuca e tempie con pettine e clipper.",
      "Distribuire olio sui capelli finiti per lucentezza senza peso."
    ]
  },
  {
    id: 4,
    name: "Il Soldato",
    fadeType: "Burst Fade · High",
    badge: "Nuovo",
    isNew: true,
    imgSrc: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&q=85",
    imgAlt: "Il Soldato — Burst Fade",
    products: ["Gel Forte Famiglia", "Siero Controllo Frizz", "Cera d'Api Artigianale"],
    steps: [
      "Eseguire burst fade dietro l'orecchio con precisione millimetrica.",
      "Strutturare il top con gel forte, forma a onde o liscia.",
      "Ripassare le linee con rasoio elettrico. Niente fuori posto."
    ]
  },
  {
    id: 5,
    name: "Il Fantasma",
    fadeType: "Bald Fade · Contrast",
    badge: "Esclusivo",
    isNew: false,
    imgSrc: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&q=85",
    imgAlt: "Il Fantasma — Bald Fade",
    products: ["Crema Rasatura Nera", "Aftershave alla Rosa Nera", "Siero Idratante Post"],
    steps: [
      "Rasare la base totalmente con lama da barbiere. Pelle a vista.",
      "Creare contrasto netto tra rasato e capello con transizione zero.",
      "Applicare aftershave raffreddante. La pelle deve brillare."
    ]
  },
  {
    id: 6,
    name: "Il Padrino",
    fadeType: "Caesar Cut · Slick Back",
    badge: "Signature",
    isNew: false,
    imgSrc: "https://images.unsplash.com/photo-1534297635766-a262cdcb8ee4?w=800&q=85",
    imgAlt: "Il Padrino — Caesar Slick Back",
    products: ["Pomata Heavy d'Autore", "Brillantina Vintage '47", "Fissativo Finale Imperiale"],
    steps: [
      "Tagliare con lunghezza uniforme sopra, pettinare tutto indietro.",
      "Applicare pomata pesante da radice a punta, lavorare il volume.",
      "Piastare se necessario. Ogni capello al suo posto. Per sempre."
    ]
  }
];

const SERVICES = [
  { name: "Il Rito Completo",          desc: "Taglio + Barba + Trattamento hot towel + Finissage",   price: "$95"  },
  { name: "Taglio d'Autorità",         desc: "Taglio su misura con consulenza stilistica",             price: "$55"  },
  { name: "La Rasatura del Don",       desc: "Rasatura classica con rasoio dritto e schiuma calda",   price: "$45"  },
  { name: "Barba da Consigliere",      desc: "Definizione, modellazione e trattamento della barba",   price: "$35"  },
  { name: "Trattamento Cuoio Cap.",    desc: "Maschera nutriente, massaggio cranico 20 min",          price: "$40"  },
  { name: "Il Pacchetto Famiglia",     desc: "Rito Completo × 4 ingressi — prezzo bloccato",          price: "$320" },
];

const TESTIMONIALS = [
  {
    text: "Non sono mai entrato in un barbershop per uscirne con la sensazione di aver guadagnato rispetto. Qui succede ogni volta. Il Don è il mio taglio da tre anni.",
    author: "Marco A. — New York",
    stars: 5
  },
  {
    text: "L'ambiente, la cura, il silenzio professionale. Non si parla di sport. Si parla d'affari, con discrezione. È la mia seconda casa.",
    author: "Vincenzo R. — Chicago",
    stars: 5
  },
  {
    text: "Ho portato mio figlio per il suo primo taglio da uomo. Il barbiere ha capito senza che dicessi una parola. Questo è il talento di BlackShape.",
    author: "Antonio M. — Boston",
    stars: 5
  }
];
