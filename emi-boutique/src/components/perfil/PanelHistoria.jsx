import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import ProductRow from '../ProductRow'

const fechaCorta = (f) => {
  if (!f) return ''
  try {
    return new Date(f).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return ''
  }
}

export default function PanelHistoria() {
  const [vistas, setVistas] = useState(null)

  useEffect(() => {
    let activo = true
    api
      .vistas()
      .then((r) => {
        if (activo) setVistas(r.vistas || [])
      })
      .catch(() => {
        if (activo) setVistas([])
      })
    return () => {
      activo = false
    }
  }, [])

  if (!vistas) return <div className="pf-empty">Cargando tu historial…</div>

  if (vistas.length === 0) {
    return (
      <div className="pf-empty">
        Todavía no has visto productos. Cuando abras una prenda aparecerá aquí para que la encuentres fácilmente.
      </div>
    )
  }

  return (
    <div className="pf-panel-historia">
      <p className="pf-hist-nota">
        <i className="bi bi-clock-history" /> {vistas.length} {vistas.length === 1 ? 'producto visto' : 'productos vistos'} recientemente
      </p>
      <div className="p-rows">
        {vistas.map((v) => (
          <ProductRow
            key={v.producto.id}
            product={v.producto}
            nota={`Visto el ${fechaCorta(v.fecha)}`}
          />
        ))}
      </div>
    </div>
  )
}
