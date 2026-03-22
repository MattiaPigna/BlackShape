import { useRef, useEffect } from 'react'
import type { HaircutEntry } from '../data'
import styles from './CutCard.module.css'

interface Props {
  cut: HaircutEntry
  index: number
  onClick?: () => void
}

const FALLBACK = (name: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="533" viewBox="0 0 400 533"><rect width="400" height="533" fill="#1a1a1a"/><text x="50%" y="50%" font-size="14" fill="#444" text-anchor="middle" dominant-baseline="middle" font-family="serif">${name}</text></svg>`
  )}`

export default function CutCard({ cut, index, onClick }: Props) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.opacity = '0'
    el.style.transform = 'translateY(24px)'

    const delay = (index % 3) * 0.08
    el.style.transition = `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1'
          el.style.transform = 'translateY(0)'
          observer.disconnect()
        }
      },
      { threshold: 0.08 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [index])

  return (
    <article ref={ref} className={styles.card} onClick={onClick}>
      {cut.isNew && <div className={styles.ribbon}>Nuovo</div>}
      <span className={styles.badge}>{cut.badge}</span>

      <img
        className={styles.img}
        src={cut.imgSrc}
        alt={cut.imgAlt}
        loading="lazy"
        onError={e => { (e.target as HTMLImageElement).src = FALLBACK(cut.name) }}
      />

      <div className={styles.overlay} />

      <div className={styles.info}>
        <div className={styles.line} />
        <h3 className={styles.name}>{cut.name}</h3>
        <p className={styles.fadeType}>{cut.fadeType}</p>
        <p className={styles.hint}>Vedi dettaglio →</p>
      </div>
    </article>
  )
}
