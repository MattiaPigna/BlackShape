import styles from './Hero.module.css'

export default function Hero() {
  return (
    <section id="hero" className={styles.hero}>
      <div className={styles.content}>
        <p className={`${styles.eyebrow} animate-fade-up`}>Est. 1947 · Little Italy, New York</p>
        <h1 className={`${styles.title} animate-fade-up delay-1`}>
          Il tuo stile,<br />
          <span className="oro-shimmer">la tua</span><br />
          firma.
        </h1>
        <p className={`${styles.sub} animate-fade-up delay-2`}>
          Precisione artigianale. Ogni dettaglio curato,<br />ogni sfumatura perfetta.
        </p>
        <div className={`${styles.ctas} animate-fade-up delay-3`}>
          <a href="/tablet" className={styles.ctaLink}>
            Scegli il tuo taglio
            <span className={styles.ctaLine} />
          </a>
        </div>
      </div>
      <div className={styles.redLine} aria-hidden="true" />
    </section>
  )
}
