import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { formatoCOP, precioFinal } from '../data/products'

const ESTRELLAS = [1, 2, 3, 4, 5]

export default function ProductCard({ product }) {
  const { addToCart, lines, updateQty, updateItem } = useStore()
  const inCart = lines.find((i) => i.id === product.id)
  const final = precioFinal(product)
  const enOferta = Number(product.descuento) > 0
  const tieneResenas = Number(product.num_resenas) > 0
  const estrellas = Math.round(Number(product.promedio) || 0)

  const tallas = product.tallas || []
  const colores = product.colores || []
  const tieneOpciones = tallas.length > 0 || colores.length > 0

  const [talla, setTalla] = useState(() => tallas[0] || '')
  const [color, setColor] = useState(() => (colores[0] && colores[0].nombre) || '')

  const cambiarTalla = (t) => {
    setTalla(t)
    if (inCart) updateItem(product.id, { talla: t })
  }

  const cambiarColor = (c) => {
    setColor(c)
    if (inCart) updateItem(product.id, { color: c })
  }

  return (
    <article className="product-card">
      <Link to={`/producto/${product.id}`} className="thumb" title={product.nombre}>
        <img src={product.img} alt={product.nombre} loading="lazy" />
        {product.es_nuevo ? <span className="badge-nuevo">Nuevo</span> : null}
        {enOferta && <span className="badge-oferta">-{product.descuento}%</span>}
        <span className="tag">{product.categoria}</span>
      </Link>
      <div className="info">
        {tieneResenas && (
          <div className="stars" title={`${product.promedio} de 5 estrellas`}>
            {ESTRELLAS.map((i) => (
              <i key={i} className={`bi ${i <= estrellas ? 'bi-star-fill' : 'bi-star'}`} />
            ))}
            <span className="stars-num">{product.promedio}</span>
            <span className="stars-count">({product.num_resenas})</span>
          </div>
        )}
        <Link to={`/producto/${product.id}`} className="card-title">
          <h3>{product.nombre}</h3>
        </Link>
        <div className={`price ${enOferta ? 'oferta' : ''}`}>
          {enOferta && <span className="antes">{formatoCOP(product.precio)}</span>}
          <span className="ahora">{formatoCOP(final)}</span>
        </div>

        {tieneOpciones && (
          <div className="opciones">
            {tallas.length > 0 && (
              <div className="tallas">
                <span className="oc-label">Talla</span>
                <div className="talla-group">
                  {tallas.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`talla-chip ${talla === t ? 'on' : ''}`}
                      onClick={() => cambiarTalla(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {colores.length > 0 && (
              <div className="colores">
                <span className="oc-label">Color</span>
                <div className="color-group">
                  {colores.map((c) => (
                    <button
                      key={c.hex || c.nombre}
                      type="button"
                      className={`circulo elegible ${color === c.nombre ? 'on' : ''}`}
                      style={{ background: c.hex }}
                      title={c.nombre}
                      onClick={() => cambiarColor(c.nombre)}
                    />
                  ))}
                  <span className="color-nombre">{color}</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="card-actions">
          {inCart ? (
            <div className="qty-stepper">
              <button onClick={() => updateQty(product.id, inCart.qty - 1)}>-</button>
              <span>{inCart.qty}</span>
              <button onClick={() => updateQty(product.id, inCart.qty + 1)}>+</button>
            </div>
          ) : (
            <button
              className="btn-add"
              onClick={() => addToCart(product.id, { talla, color })}
              aria-label="Agregar al carrito"
              title="Agregar al carrito"
            >
              <i className="bi bi-bag-plus" />
            </button>
          )}
        </div>
      </div>
    </article>
  )
}