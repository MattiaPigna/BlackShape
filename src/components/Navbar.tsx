import { Link } from 'react-router-dom'
import styles from './Navbar.module.css'

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <a href="#hero" className={styles.logo}>BLACKSHAPE</a>
        <div className={styles.links}>
          <Link to="/tablet" className={styles.link}>Scegli il tuo taglio</Link>
        </div>
      </div>
    </nav>
  )
}
