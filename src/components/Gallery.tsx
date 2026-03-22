import { useNavigate } from 'react-router-dom'
import { getHaircuts } from '../data'

const HAIRCUTS = getHaircuts()
import CutCard from './CutCard'
import styles from './Gallery.module.css'

export default function Gallery() {
  const navigate = useNavigate()

  return (
    <section id="gallery" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <h2 className="section-title" style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>I Tagli</h2>
          <p className="section-desc" style={{ fontSize: '0.78rem', fontStyle: 'normal', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {HAIRCUTS.length} tagli disponibili — clicca per i dettagli
          </p>
        </div>
        <div className={styles.grid}>
          {HAIRCUTS.map((cut, i) => (
            <CutCard
              key={cut.id}
              cut={cut}
              index={i}
              onClick={() => navigate('/tablet', { state: { cutId: cut.id } })}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
