import { useState, useEffect } from 'react'
import { useStore } from '../context/StoreContext'
import { api } from '../services/api'

export default function AnuncioPopup() {
  const { user } = useStore()
  const [anuncios, setAnuncios] = useState([])
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    if (!user) return
    const flag = sessionStorage.getItem('emi_anuncio_login')
    if (flag !== '1') return
    let activo = true
    api
      .anuncios()
      .then((r) => {
        if (!activo) return
        const lista = r.anuncios || []
        if (lista.length) {
          setAnuncios(lista)
          setAbierto(true)
        }
      })
      .catch(() => {})
      .finally(() => {
        sessionStorage.removeItem('emi_anuncio_login')
      })
    return () => {
      activo = false
    }
  }, [user])

  if (!abierto || anuncios.length === 0) return null

  const cerrar = () => setAbierto(false)

  return (
    <div className="anu-overlay" role="dialog" aria-modal="true" onMouseDown={cerrar}>
      <div className="anu-modal-full" onMouseDown={(e) => e.stopPropagation()}>
        <button type="button" className="anu-cerrar" onClick={cerrar} aria-label="Cerrar anuncio">
          <i className="bi bi-x-lg" />
        </button>
        <div className="anu-contenido">
          {anuncios.map((a) => (
            <article className="anu-card" key={a.id}>
              {a.imagen && (
                <div className="anu-imagen">
                  <img src={a.imagen} alt={a.titulo} />
                </div>
              )}
              <div className="anu-texto">
                <h2>{a.titulo}</h2>
                <p>{a.mensaje}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}