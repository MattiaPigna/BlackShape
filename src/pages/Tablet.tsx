import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getHaircuts, type HaircutEntry } from '../data'

const HAIRCUTS = getHaircuts()
import styles from './Tablet.module.css'

const FALLBACK = (name: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800"><rect width="600" height="800" fill="#111"/><text x="50%" y="50%" font-size="18" fill="#333" text-anchor="middle" dominant-baseline="middle" font-family="serif">${name}</text></svg>`
  )}`

// ── Grid (browse) ──────────────────────────────────────────────
function BrowseGrid({ onSelect }: { onSelect: (cut: HaircutEntry) => void }) {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerBrand}>
          <span className={styles.headerLogo}>BLACKSHAPE</span>
          <span className={styles.headerSub}>Scegli il tuo taglio</span>
        </div>
        <Link to="/" className={styles.headerBack}>← Sito</Link>
      </header>

      <div className={styles.grid}>
        {HAIRCUTS.map(cut => (
          <button
            key={cut.id}
            className={styles.card}
            onClick={() => onSelect(cut)}
          >
            <img
              src={cut.imgSrc}
              alt={cut.imgAlt}
              className={styles.cardImg}
              loading="eager"
              onError={e => { (e.target as HTMLImageElement).src = FALLBACK(cut.name) }}
            />
            <div className={styles.cardOverlay} />
            {cut.isNew && <span className={styles.cardNew}>Nuovo</span>}
            <span className={styles.cardBadge}>{cut.badge}</span>
            <div className={styles.cardInfo}>
              <p className={styles.cardName}>{cut.name}</p>
              <p className={styles.cardFade}>{cut.fadeType}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Detail view ────────────────────────────────────────────────
function DetailView({ cut, onBack }: { cut: HaircutEntry; onBack: () => void }) {
  const [showLightbox, setShowLightbox] = useState(false)

  return (
    <div className={styles.detail}>
      {/* Image section */}
      <div className={styles.detailImgWrap}>
        <img
          src={cut.imgSrc}
          alt={cut.imgAlt}
          className={styles.detailImg}
          onError={e => { (e.target as HTMLImageElement).src = FALLBACK(cut.name) }}
        />
        <div className={styles.detailImgOverlay} />

        <button className={styles.backBtn} onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Torna
        </button>

        <button className={styles.expandBtn} onClick={() => setShowLightbox(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </button>

        <div className={styles.detailImgTitle}>
          {cut.badge && <span className={styles.detailBadge}>{cut.badge}</span>}
          <h2 className={styles.detailName}>{cut.name}</h2>
          <p className={styles.detailFade}>{cut.fadeType}</p>
        </div>
      </div>

      {/* Info section */}
      <div className={styles.detailBody}>
        <div className={styles.detailCol}>
          <p className={styles.detailHead}>Prodotti consigliati</p>
          <ul className={styles.detailList}>
            {cut.products.map(p => <li key={p}>{p}</li>)}
          </ul>
        </div>
        <div className={styles.detailCol}>
          <p className={styles.detailHead}>Come acconciarlo</p>
          <ol className={styles.stepsList}>
            {cut.steps.map((s, i) => (
              <li key={i}>
                <span className={styles.stepN}>{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Lightbox */}
      {showLightbox && (
        <div className={styles.lightbox} onClick={() => setShowLightbox(false)}>
          <button className={styles.lightboxClose}>✕</button>
          <img
            className={styles.lightboxImg}
            src={cut.imgSrc}
            alt={cut.imgAlt}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────
export default function Tablet() {
  const [selected, setSelected] = useState<HaircutEntry | null>(null)

  if (selected) {
    return <DetailView cut={selected} onBack={() => setSelected(null)} />
  }
  return <BrowseGrid onSelect={setSelected} />
}
