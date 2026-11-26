import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { formatoCOP, precioFinal } from '../data/products'

export default function ProductRow({ product, nota }) {
  const { addToCart, lines, updateQty } = useStore()
  const inCart = lines.find((i) => i.id === product.id)
  const final = precioFinal(product)
  const enOferta = Number(product.descuento) > 0
  const tallas = product.tallas || []
  const colores = product.colores || []

  const agregar = () =>
    addToCart(product.id, {
      talla: tallas[0] || '',
      color: (colores[0] && colores[0].nombre) || '',
    })

  return (
    <article className="p-row">
      <Link to={`/producto/${product.id}`} className="p-row-thumb">
        <img src={product.img} alt={product.nombre} loading="lazy" />
      </Link>
      <div className="p-row-info">
        <span className="p-row-cat">{product.categoria}</span>
        <Link to={`/producto/${product.id}`} className="p-row-name">
          {product.nombre}
        </Link>
        {nota ? <span className="p-row-nota">{nota}</span> : null}
      </div>
      <div className="p-row-price">
        {enOferta && <span className="antes">{formatoCOP(product.precio)}</span>}
        <b>{formatoCOP(final)}</b>
      </div>
      <div className="p-row-action">
        {inCart ? (
          <div className="qty-stepper">
            <button onClick={() => updateQty(product.id, inCart.qty - 1)}>-</button>
            <span>{inCart.qty}</span>
            <button onClick={() => updateQty(product.id, inCart.qty + 1)}>+</button>
          </div>
        ) : (
          <button
            className="btn-add"
            onClick={agregar}
            title="Agregar al carrito"
            aria-label="Agregar al carrito"
          >
            <i className="bi bi-bag-plus" />
          </button>
        )}
      </div>
    </article>
  )
}
