import { Link } from 'react-router-dom'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span className={styles.copy}>© 1947–2026 BlackShape Barbershop</span>
        <span className={styles.address}>187 Mulberry St · Little Italy, NY</span>
        <Link to="/tablet" className={styles.link}>Catalogo →</Link>
      </div>
    </footer>
  )
}
