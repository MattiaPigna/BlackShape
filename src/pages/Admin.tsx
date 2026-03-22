import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getHaircuts, saveHaircuts, resetHaircuts, type HaircutEntry } from '../data'
import styles from './Admin.module.css'

const EMPTY_CUT: Omit<HaircutEntry, 'id'> = {
  name: '',
  fadeType: '',
  badge: '',
  isNew: false,
  imgSrc: '',
  imgAlt: '',
  products: ['', '', ''],
  steps: ['', '', ''],
}

function nextId(cuts: HaircutEntry[]) {
  return cuts.length > 0 ? Math.max(...cuts.map(c => c.id)) + 1 : 1
}

export default function Admin() {
  const [cuts, setCuts] = useState<HaircutEntry[]>(getHaircuts)
  const [editing, setEditing] = useState<HaircutEntry | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [confirm, setConfirm] = useState<number | null>(null)
  const [saved, setSaved] = useState(false)

  const persist = (newCuts: HaircutEntry[]) => {
    saveHaircuts(newCuts)
    setCuts(newCuts)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const startNew = () => {
    setEditing({ id: nextId(cuts), ...EMPTY_CUT })
    setIsNew(true)
  }

  const startEdit = (cut: HaircutEntry) => {
    setEditing({ ...cut, products: [...cut.products], steps: [...cut.steps] })
    setIsNew(false)
  }

  const cancelEdit = () => { setEditing(null); setIsNew(false) }

  const saveEdit = () => {
    if (!editing) return
    const updated = isNew
      ? [...cuts, editing]
      : cuts.map(c => c.id === editing.id ? editing : c)
    persist(updated)
    setEditing(null)
    setIsNew(false)
  }

  const deleteCut = (id: number) => {
    persist(cuts.filter(c => c.id !== id))
    setConfirm(null)
    if (editing?.id === id) { setEditing(null); setIsNew(false) }
  }

  const handleReset = () => {
    resetHaircuts()
    setCuts(getHaircuts())
    setEditing(null)
    setIsNew(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const setField = (field: keyof HaircutEntry, value: unknown) => {
    if (!editing) return
    setEditing({ ...editing, [field]: value })
  }

  const setProduct = (i: number, val: string) => {
    if (!editing) return
    const p = [...editing.products]
    p[i] = val
    setEditing({ ...editing, products: p })
  }

  const setStep = (i: number, val: string) => {
    if (!editing) return
    const s = [...editing.steps]
    s[i] = val
    setEditing({ ...editing, steps: s })
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.logo}>BLACKSHAPE</span>
          <span className={styles.headerSub}>Admin</span>
        </div>
        <div className={styles.headerRight}>
          {saved && <span className={styles.savedBadge}>✓ Salvato</span>}
          <Link to="/" className={styles.headerLink}>← Sito</Link>
          <Link to="/tablet" className={styles.headerLink}>Catalogo</Link>
        </div>
      </header>

      <div className={styles.layout}>
        {/* Left: cut list */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTop}>
            <p className={styles.sidebarTitle}>Tagli ({cuts.length})</p>
            <button className={styles.btnAdd} onClick={startNew}>+ Nuovo</button>
          </div>

          <div className={styles.cutList}>
            {cuts.map(cut => (
              <div
                key={cut.id}
                className={`${styles.cutItem} ${editing?.id === cut.id ? styles.cutItemActive : ''}`}
                onClick={() => startEdit(cut)}
              >
                <div className={styles.cutThumb}>
                  {cut.imgSrc
                    ? <img src={cut.imgSrc} alt={cut.name} />
                    : <span className={styles.cutThumbPlaceholder}>?</span>
                  }
                </div>
                <div className={styles.cutItemInfo}>
                  <p className={styles.cutItemName}>{cut.name || <em>Senza nome</em>}</p>
                  <p className={styles.cutItemFade}>{cut.fadeType}</p>
                </div>
                {cut.isNew && <span className={styles.newPip} />}
                <button
                  className={styles.btnDelete}
                  onClick={e => { e.stopPropagation(); setConfirm(cut.id) }}
                  title="Elimina"
                >✕</button>
              </div>
            ))}
          </div>

          <div className={styles.sidebarBottom}>
            <button className={styles.btnReset} onClick={handleReset}>
              Ripristina default
            </button>
          </div>
        </aside>

        {/* Right: form */}
        <main className={styles.main}>
          {editing ? (
            <div className={styles.form}>
              <div className={styles.formHeader}>
                <h2 className={styles.formTitle}>
                  {isNew ? 'Nuovo taglio' : `Modifica — ${editing.name || '...'}`}
                </h2>
                <div className={styles.formActions}>
                  <button className={styles.btnCancel} onClick={cancelEdit}>Annulla</button>
                  <button className={styles.btnSave} onClick={saveEdit}>Salva</button>
                </div>
              </div>

              <div className={styles.formGrid}>
                {/* Base info */}
                <div className={styles.formSection}>
                  <p className={styles.sectionLabel}>Informazioni base</p>

                  <label className={styles.field}>
                    <span>Nome</span>
                    <input
                      type="text"
                      value={editing.name}
                      onChange={e => setField('name', e.target.value)}
                      placeholder="es. Classico"
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Tipo fade</span>
                    <input
                      type="text"
                      value={editing.fadeType}
                      onChange={e => setField('fadeType', e.target.value)}
                      placeholder="es. Low Fade · Classico"
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Badge</span>
                    <input
                      type="text"
                      value={editing.badge}
                      onChange={e => setField('badge', e.target.value)}
                      placeholder="es. Best Seller"
                    />
                  </label>

                  <label className={`${styles.field} ${styles.fieldCheck}`}>
                    <input
                      type="checkbox"
                      checked={editing.isNew}
                      onChange={e => setField('isNew', e.target.checked)}
                    />
                    <span>Mostra etichetta "Nuovo"</span>
                  </label>
                </div>

                {/* Image */}
                <div className={styles.formSection}>
                  <p className={styles.sectionLabel}>Immagine</p>

                  <label className={styles.field}>
                    <span>URL immagine</span>
                    <input
                      type="url"
                      value={editing.imgSrc}
                      onChange={e => setField('imgSrc', e.target.value)}
                      placeholder="https://..."
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Alt text</span>
                    <input
                      type="text"
                      value={editing.imgAlt}
                      onChange={e => setField('imgAlt', e.target.value)}
                      placeholder="Descrizione immagine"
                    />
                  </label>

                  {editing.imgSrc && (
                    <div className={styles.imgPreview}>
                      <img src={editing.imgSrc} alt="preview" />
                    </div>
                  )}
                </div>

                {/* Products */}
                <div className={styles.formSection}>
                  <p className={styles.sectionLabel}>Prodotti consigliati (3)</p>
                  {[0, 1, 2].map(i => (
                    <label key={i} className={styles.field}>
                      <span>Prodotto {i + 1}</span>
                      <input
                        type="text"
                        value={editing.products[i] ?? ''}
                        onChange={e => setProduct(i, e.target.value)}
                        placeholder={`Prodotto ${i + 1}`}
                      />
                    </label>
                  ))}
                </div>

                {/* Steps */}
                <div className={styles.formSection}>
                  <p className={styles.sectionLabel}>Tutorial (3 passi)</p>
                  {[0, 1, 2].map(i => (
                    <label key={i} className={styles.field}>
                      <span>Passo {i + 1}</span>
                      <textarea
                        value={editing.steps[i] ?? ''}
                        onChange={e => setStep(i, e.target.value)}
                        placeholder={`Descrivi il passo ${i + 1}`}
                        rows={2}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.empty}>
              <p className={styles.emptyText}>Seleziona un taglio per modificarlo</p>
              <button className={styles.btnAddLarge} onClick={startNew}>+ Aggiungi nuovo taglio</button>
            </div>
          )}
        </main>
      </div>

      {/* Delete confirm modal */}
      {confirm !== null && (
        <div className={styles.modal}>
          <div className={styles.modalBox}>
            <p className={styles.modalText}>
              Eliminare <strong>{cuts.find(c => c.id === confirm)?.name}</strong>?
            </p>
            <div className={styles.modalActions}>
              <button className={styles.btnCancel} onClick={() => setConfirm(null)}>Annulla</button>
              <button className={styles.btnDanger} onClick={() => deleteCut(confirm)}>Elimina</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
