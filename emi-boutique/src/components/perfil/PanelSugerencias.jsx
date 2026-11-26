import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import ProductRow from '../ProductRow'
import { formatoCOP, precioFinal } from '../../data/products'

const ESTRELLAS = [1, 2, 3, 4, 5]

export default function PanelSugerencias() {
  const [datos, setDatos] = useState(null)

  useEffect(() => {
    let activo = true
    api
      .sugerencias()
      .then((r) => {
        if (activo) setDatos({ calificados: r.calificados || [], recomendados: r.recomendados || [] })
      })
      .catch(() => {
        if (activo) setDatos({ calificados: [], recomendados: [] })
      })
    return () => {
      activo = false
    }
  }, [])

  if (!datos) return <div className="pf-empty">Cargando sugerencias…</div>

  return (
    <div className="pf-panel-sugerencias">
      <section className="pf-bloque">
        <h3><i className="bi bi-star" /> Productos que calificaste</h3>
        {datos.calificados.length === 0 ? (
          <div className="pf-empty">
            Aún no has calificado productos. Deja tu reseña y te mostraremos mejores sugerencias.{' '}
            <Link to="/catalogo">Ver catálogo</Link>
          </div>
        ) : (
          <div className="pf-calificados">
            {datos.calificados.map((c) => (
              <Link className="pf-calif" to={`/producto/${c.producto.id}`} key={c.producto.id}>
                <img src={c.producto.img} alt={c.producto.nombre} />
                <div className="pf-calif-info">
                  <strong>{c.producto.nombre}</strong>
                  <span className="pf-stars">
                    {ESTRELLAS.map((i) => (
                      <i key={i} className={`bi ${i <= c.calificacion ? 'bi-star-fill' : 'bi-star'}`} />
                    ))}
                    <small>{c.calificacion}/5</small>
                  </span>
                  <span className="pf-precio">{formatoCOP(precioFinal(c.producto))}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="pf-bloque">
        <h3><i className="bi bi-magic" /> Recomendado para ti</h3>
        {datos.recomendados.length === 0 ? (
          <div className="pf-empty">Explora el catálogo para descubrir prendas pensadas para ti.</div>
        ) : (
          <div className="p-rows">
            {datos.recomendados.map((p) => (
              <ProductRow key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
