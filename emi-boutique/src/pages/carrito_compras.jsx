import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { api } from '../services/api'
import { formatoCOP, precioFinal } from '../data/products'
import Factura from '../components/Factura'
import MisPedidos from '../components/MisPedidos'

const Cancelables = ['pendiente']

// Etiqueta de pago que se muestra al confirmar el pedido
const TAG_PAGO = {
  efectivo: { clase: 'cash', icono: 'bi-cash-coin', texto: 'Pago contra entrega' },
  wompi: { clase: 'wompi', icono: 'bi-credit-card', texto: 'Pago en línea con Wompi' },
}

export default function CarritoCompras() {
  const { lines, updateQty, updateItem, removeFromCart, cartTotal, cartCount, user, checkout } = useStore()
  const navigate = useNavigate()
  // Estados del checkout y de los pedidos
  const [enviando, setEnviando] = useState(false)
  const [pedidoConfirmado, setPedidoConfirmado] = useState(null)
  const [metodo, setMetodo] = useState('efectivo')
  const [wompiOk, setWompiOk] = useState(false)
  const [factura, setFactura] = useState(null)
  const [recargarPedidos, setRecargarPedidos] = useState(0)
  const [direcciones, setDirecciones] = useState([])
  const [direccionSel, setDireccionSel] = useState(null)
  const confRef = useRef(null)

  // ¿Está configurado el pago en línea (Wompi) en el servidor?
  useEffect(() => {
    let activo = true
    api.wompiConfig().then((r) => activo && setWompiOk(!!r.habilitado)).catch(() => {})
    return () => { activo = false }
  }, [])

  // Direcciones de envío del cliente (para elegir a dónde enviar el pedido)
  useEffect(() => {
    if (!user) return undefined
    let activo = true
    api
      .direcciones()
      .then((r) => {
        if (!activo) return
        const lista = r.direcciones || []
        setDirecciones(lista)
        const pred = lista.find((d) => d.predeterminada) || lista[0]
        setDireccionSel(pred ? pred.id : null)
      })
      .catch(() => {
        if (activo) setDirecciones([])
      })
    return () => {
      activo = false
    }
  }, [user])

  // Muestra el banner de confirmación y hace scroll hasta él
  const mostrarConfirmacion = (pedido) => {
    setPedidoConfirmado(pedido)
    setRecargarPedidos((n) => n + 1)
    setTimeout(() => {
      confRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  const verFactura = (pedido) => setFactura(pedido)

  // Registra el pedido; si es pago en línea, redirige al checkout seguro de Wompi
  const handleCheckout = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    setEnviando(true)
    try {
      const pedido = await checkout(metodo, direccionSel)
      if (metodo === 'wompi' && pedido.checkout_url) {
        window.location.href = pedido.checkout_url
        return
      }
      mostrarConfirmacion(pedido)
    } catch (err) {
      alert(err.message || 'No se pudo registrar el pedido.')
    } finally {
      setEnviando(false)
    }
  }

  // Cancelar un pedido (devuelve el stock)
  const pedidoCompleto = pedidoConfirmado?.detalle || null

  const [cancelandoConf, setCancelandoConf] = useState(false)
  const cancelarConfirmado = async () => {
    const id = pedidoConfirmado?.pedido_id
    if (!id) return
    if (!window.confirm('¿Cancelar este pedido? Se devolverá el stock de los artículos.')) return
    setCancelandoConf(true)
    try {
      await api.cancelarPedido(id)
      setPedidoConfirmado(null)
      setRecargarPedidos((n) => n + 1)
      alert('Pedido cancelado.')
    } catch (err) {
      alert(err.message || 'No se pudo cancelar el pedido')
    } finally {
      setCancelandoConf(false)
    }
  }

  return (
    <div className="cart-page">
      <header className="page-hero">
        <span className="crumb">Mi carrito</span>
        <h1>Tu selección</h1>
        <p>
          {cartCount} {cartCount === 1 ? 'prenda' : 'prendas'} en tu carrito
        </p>
      </header>

      {/* Confirmación del pedido recién creado */}
      {pedidoConfirmado && (
        <div className="pedido-confirmado" ref={confRef}>
          <div className="msg-ok">
            <i className="bi bi-check-circle" />
            <span>¡Pedido #{pedidoConfirmado.pedido_id} registrado por {formatoCOP(pedidoConfirmado.total)}!</span>
            {(() => {
              const tag = TAG_PAGO[pedidoConfirmado.metodo_pago] || TAG_PAGO.efectivo
              return (
                <span className={`pay-tag ${tag.clase}`}>
                  <i className={`bi ${tag.icono}`} /> {tag.texto}
                </span>
              )
            })()}
          </div>
<div className="conf-acciones">
            <button
              className="btn-factura"
              disabled={!pedidoCompleto}
              onClick={() => pedidoCompleto && verFactura(pedidoCompleto)}
            >
              <i className="bi bi-file-earmark-text" /> Ver factura
            </button>
            {Cancelables.includes(pedidoConfirmado.estado) && (
              <button
                className="btn-cancelar"
                disabled={cancelandoConf}
                onClick={cancelarConfirmado}
              >
                <i className="bi bi-x-circle" /> {cancelandoConf ? 'Cancelando…' : 'Cancelar pedido'}
              </button>
            )}
          </div>
        </div>
      )}

      {lines.length ? (
        <div className="cart-layout">
          {/* Líneas del carrito */}
          <div className="cart-items">
            {lines.map(({ product, qty, talla, color }) => (
              <div className="cart-item" key={product.id}>
                <img src={product.img} alt={product.nombre} />
                <div className="meta">
                  <div className="cat">{product.categoria}</div>
                  <h3>{product.nombre}</h3>
                  {(product.tallas?.length > 0 || product.colores?.length > 0) && (
                    <div className="variaciones">
                      {product.tallas?.length > 0 && (
                        <label className="var">
                          <span>Talla</span>
                          <select
                            value={talla || product.tallas[0]}
                            onChange={(e) => updateItem(product.id, { talla: e.target.value })}
                          >
                            {product.tallas.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </label>
                      )}
                      {product.colores?.length > 0 && (
                        <label className="var">
                          <span>Color</span>
                          <select
                            value={color || product.colores[0].nombre}
                            onChange={(e) => updateItem(product.id, { color: e.target.value })}
                          >
                            {product.colores.map((c) => (
                              <option key={c.hex || c.nombre} value={c.nombre}>{c.nombre}</option>
                            ))}
                          </select>
                        </label>
                      )}
                    </div>
                  )}
                  <div className="qty">
                    <button onClick={() => updateQty(product.id, qty - 1)} aria-label="Reducir cantidad"><i className="bi bi-dash" /></button>
                    <span>{qty}</span>
                    <button onClick={() => updateQty(product.id, qty + 1)} aria-label="Aumentar cantidad"><i className="bi bi-plus" /></button>
                  </div>
                </div>
                <div className="right">
                  <div className="price">{formatoCOP(precioFinal(product) * qty)}</div>
                  <button className="remove" onClick={() => removeFromCart(product.id)}>
                    Quitar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Resumen del carrito */}
          <aside className="summary">
            <h3>Resumen</h3>
            <div className="line">
              <span>Subtotal ({cartCount} items)</span>
              <span>{formatoCOP(cartTotal)}</span>
            </div>
            <div className="line">
              <span>Envío</span>
              <span>Gratis</span>
            </div>
            <div className="line total">
              <span>Total</span>
              <span>{formatoCOP(cartTotal)}</span>
            </div>

            {user && (
              <div className="envio-dir">
                <h4><i className="bi bi-geo-alt" /> Enviar a</h4>
                {direcciones.length === 0 ? (
                  <p className="envio-vacio">
                    No tienes direcciones guardadas.{' '}
                    <Link to="/perfil">Agrega una en tu perfil</Link>.
                  </p>
                ) : (
                  <>
                    {direcciones.map((d) => (
                      <label key={d.id} className={`dir-opt ${direccionSel === d.id ? 'activo' : ''}`}>
                        <input
                          type="radio"
                          name="direccion"
                          checked={direccionSel === d.id}
                          onChange={() => setDireccionSel(d.id)}
                        />
                        <span className="dir-opt-txt">
                          <b>
                            {d.alias}
                            {d.predeterminada && <span className="dir-opt-badge">Predeterminada</span>}
                          </b>
                          <small>
                            {d.direccion}
                            {d.direccion_info ? ` · ${d.direccion_info}` : ''}
                            {d.ciudad ? ` · ${d.ciudad}` : ''}
                          </small>
                        </span>
                      </label>
                    ))}
                    <Link to="/perfil" className="envio-gestionar">
                      <i className="bi bi-pencil-square" /> Gestionar direcciones
                    </Link>
                  </>
                )}
              </div>
            )}

            <div className="pago-metodo">
              <h4><i className="bi bi-wallet2" /> Método de pago</h4>
              <label className={`pm-opt ${metodo === 'efectivo' ? 'activo' : ''}`}>
                <input type="radio" name="metodo_pago" value="efectivo" checked={metodo === 'efectivo'} onChange={() => setMetodo('efectivo')} />
                <span className="pm-ico"><i className="bi bi-cash-coin" /></span>
                <span className="pm-txt">
                  <b>Contra entrega</b>
                  <small>Pagas en efectivo al recibir</small>
                </span>
              </label>
              {wompiOk && (
                <label className={`pm-opt wompi ${metodo === 'wompi' ? 'activo' : ''}`}>
                  <input type="radio" name="metodo_pago" value="wompi" checked={metodo === 'wompi'} onChange={() => setMetodo('wompi')} />
                  <span className="pm-ico"><i className="bi bi-credit-card" /></span>
                  <span className="pm-txt">
                    <b>Pagar en línea</b>
                    <small>Tarjeta, PSE, Nequi, Bancolombia (Wompi)</small>
                  </span>
                </label>
              )}
            </div>

            <button className="btn-checkout" onClick={handleCheckout} disabled={enviando}>
              {enviando
                ? 'Procesando...'
                : !user
                  ? 'Ingresa para comprar'
                  : metodo === 'wompi'
                    ? 'Pagar ahora'
                    : 'Finalizar compra'}
            </button>
            <div className="secure-note">
              {metodo === 'efectivo' && '💵 Pago contra entrega · Precios en pesos colombianos'}
              {metodo === 'wompi' && '🔒 Pago seguro con Wompi · Precios en pesos colombianos'}
            </div>
          </aside>
        </div>
      ) : (
        <div className="empty-cart">
          {/* Carrito vacío */}
          <h3>Tu carrito está vacío</h3>
          <p>Explora el catálogo y agrega tus prendas favoritas.</p>
          <Link to="/catalogo" className="btn-primary" style={{ textDecoration: 'none' }}>Ir al catálogo</Link>
        </div>
      )}

      {user && (
        <MisPedidos
          recargar={recargarPedidos}
          onCancelado={(id) => {
            if (pedidoConfirmado?.pedido_id === id) setPedidoConfirmado(null)
          }}
        />
      )}

      {factura && <Factura pedido={factura} onCerrar={() => setFactura(null)} />}

    </div>
  )
}