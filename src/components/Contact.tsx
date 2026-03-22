import { useState, type FormEvent } from 'react'
import { HAIRCUTS } from '../data'
import styles from './Contact.module.css'

function IconBox({ children }: { children: React.ReactNode }) {
  return <div className={styles.iconBox}>{children}</div>
}

export default function Contact() {
  const [msg, setMsg] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setMsg('Richiesta ricevuta. Qualcuno vi contatterà. Presto.')
    setTimeout(() => setMsg(''), 4500)
  }

  return (
    <section id="contact" className={styles.section}>
      <div className={styles.topLine} />
      <div className={styles.inner}>
        <div className={styles.grid}>

          {/* Info */}
          <div>
            <span className="section-eyebrow">Vieni a trovarci</span>
            <h2 className="section-title" style={{ marginBottom: '1.5rem' }}>
              Il Club è<br />Solo su Invito.
            </h2>
            <p className="section-desc" style={{ marginBottom: '2.5rem' }}>
              Non trovi un indirizzo su Google. Non prenoti su un'app.<br />
              Una telefonata. Un nome. Una parola d'ordine.
            </p>

            <div className={styles.contacts}>
              <div className={styles.contactRow}>
                <IconBox>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                </IconBox>
                <div>
                  <p className={styles.contactLabel}>Quartier Generale</p>
                  <p className={styles.contactMain}>187 Mulberry Street</p>
                  <p className={styles.contactSub}>Little Italy, New York, NY 10012</p>
                </div>
              </div>
              <div className={styles.contactRow}>
                <IconBox>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .93h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.82a16 16 0 006.29 6.29l1.16-1.16a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                </IconBox>
                <div>
                  <p className={styles.contactLabel}>Linea Riservata</p>
                  <p className={styles.contactMain}>+1 (212) 000-0047</p>
                  <p className={styles.contactSub}>Solo prenotazioni confermate</p>
                </div>
              </div>
              <div className={styles.contactRow}>
                <IconBox>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                </IconBox>
                <div>
                  <p className={styles.contactLabel}>Orari del Consiglio</p>
                  <p className={styles.contactMain}>Lun–Sab: 09:00–21:00</p>
                  <p className={styles.contactSub}>Dom: Solo su chiamata diretta</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className={styles.formCard}>
            <p className={styles.formTitle}>Modulo di Richiesta</p>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.row2}>
                <div className={styles.field}>
                  <label className={styles.label}>Nome</label>
                  <input type="text" placeholder="Vito" required className={styles.input} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Cognome</label>
                  <input type="text" placeholder="Corleone" required className={styles.input} />
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Telefono</label>
                <input type="tel" placeholder="+1 (212) 000-0000" className={styles.input} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Taglio Desiderato</label>
                <select className={styles.select}>
                  <option value="">— Seleziona —</option>
                  {HAIRCUTS.map(h => <option key={h.id}>{h.name}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Messaggio Riservato</label>
                <textarea rows={3} placeholder="Parola d'ordine o richieste speciali…" className={styles.textarea} />
              </div>
              <button type="submit" className={`btn-primary ${styles.submit}`}>
                Invia la Richiesta
              </button>
              {msg && <p className={styles.formMsg}>{msg}</p>}
            </form>
          </div>

        </div>
      </div>
    </section>
  )
}
