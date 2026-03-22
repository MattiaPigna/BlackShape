import { SERVICES } from '../data'
import styles from './Services.module.css'

export default function Services() {
  return (
    <section id="services" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <span className="section-eyebrow">Il Listino</span>
          <h2 className="section-title" style={{ marginBottom: '1rem' }}>
            Tariffe<br />BlackShape
          </h2>
          <p className="section-desc">Nessun compromesso. Il rispetto ha un prezzo.</p>
        </div>

        <div className="ornament" style={{ marginBottom: '2.5rem' }}>✦</div>

        <div className={styles.list}>
          {SERVICES.map(svc => (
            <div key={svc.name} className={styles.item}>
              <div>
                <p className={styles.name}>{svc.name}</p>
                <p className={styles.desc}>{svc.desc}</p>
              </div>
              <p className={styles.price}>{svc.price}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
