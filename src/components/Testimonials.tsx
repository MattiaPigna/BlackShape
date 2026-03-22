import { TESTIMONIALS } from '../data'
import styles from './Testimonials.module.css'

function Stars({ count }: { count: number }) {
  return <p className={styles.stars}>{'★'.repeat(count)}</p>
}

export default function Testimonials() {
  return (
    <section id="testimonials" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <span className="section-eyebrow">Le Voci della Famiglia</span>
          <h2 className="section-title">Testimonianze</h2>
        </div>

        <div className="ornament" style={{ marginBottom: '3rem' }}>✦</div>

        <div className={styles.grid}>
          {TESTIMONIALS.map(t => (
            <div key={t.author} className={styles.card}>
              <span className={styles.quoteIcon}>"</span>
              <p className={styles.text}>{t.text}</p>
              <p className={styles.author}>{t.author}</p>
              <Stars count={t.stars} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
