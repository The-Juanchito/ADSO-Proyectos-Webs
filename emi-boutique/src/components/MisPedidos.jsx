import { useState, useEffect, useCallback, useRef, Fragment } from 'react'
import { api } from '../services/api'
import { formatoCOP } from '../data/products'
import Factura from './Factura'

const Cancelables = ['pendiente']

const formatFechaHora = (f) => {
  if (!f) return ''
  try {
    return new Date(f).toLocaleString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return ''
  }
}

// Tabla de pedidos del usuario. `recargar` permite forzar la recarga desde fuera.
export default function MisPedidos({ recargar = 0, titulo = 'Mis pedidos', onCancelado, pedidoDestacado = null }) {
  const [pedidos, setPedidos] = useState(null)
  const [abiertos, setAbiertos] = useState({})
  const [cancelando, setCancelando] = useState({})
  const [factura, setFactura] = useState(null)
  const [pagando, setPagando] = useState({})
  const filasRef = useRef({})

  const cargar = useCallback(() => {
    api
      .pedidosMios()
      .then((r) => setPedidos(r.pedidos || []))
      .catch(() => setPedidos([]))
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar, recargar])

  // Si venimos desde una notificación de pedido, hacemos scroll hasta él.
  useEffect(() => {
    if (!pedidoDestacado || !pedidos) return
    if (!pedidos.some((p) => p.id === pedidoDestacado)) return
    const t = setTimeout(() => {
      filasRef.current[pedidoDestacado]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 150)
    return () => clearTimeout(t)
  }, [pedidoDestacado, pedidos])

  // Un pedido está abierto si el usuario lo alternó o si es el destacado.
  const estaAbierto = (id) => abiertos[id] ?? id === pedidoDestacado

  const cancelar = async (id) => {
    if (!window.confirm('¿Cancelar este pedido? Se devolverá el stock de los artículos.')) return
    setCancelando((prev) => ({ ...prev, [id]: true }))
    try {
      await api.cancelarPedido(id)
      await cargar()
      onCancelado?.(id)
      alert('Pedido cancelado.')
    } catch (err) {
      alert(err.message || 'No se pudo cancelar el pedido')
    } finally {
      setCancelando((prev) => ({ ...prev, [id]: false }))
    }
  }

  const pagar = async (id) => {
    setPagando((prev) => ({ ...prev, [id]: true }))
    try {
      const r = await api.pagarPedido(id)
      const url = r.checkout_url || r.pedido?.checkout_url
      if (!url) throw new Error('No se pudo abrir el pago. Inténtalo de nuevo.')
      window.location.href = url
    } catch (err) {
      alert(err.message || 'No se pudo iniciar el pago')
      setPagando((prev) => ({ ...prev, [id]: false }))
    }
  }

  const toggleDetalle = (id) => setAbiertos((prev) => ({ ...prev, [id]: !(prev[id] ?? id === pedidoDestacado) }))

  return (
    <section className="mis-pedidos">
      <div className="table-head">
        <h2><i className="bi bi-receipt" /> {titulo}</h2>
        <span>{pedidos ? `${pedidos.length} ${pedidos.length === 1 ? 'pedido' : 'pedidos'}` : 'Cargando…'}</span>
      </div>

      {!pedidos ? (
        <div className="empty">Cargando tus pedidos…</div>
      ) : pedidos.length === 0 ? (
        <div className="empty">Todavía no has hecho pedidos. ¡Tu primera compra te espera!</div>
      ) : (
        <div className="scroll">
          <table className="pedidos">
            <thead>
              <tr>
                <th></th>
                <th>N°</th>
                <th>Fecha</th>
                <th>Artículos</th>
                <th>Total</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((pe) => (
                <Fragment key={pe.id}>
                  <tr
                    ref={(el) => { filasRef.current[pe.id] = el }}
                    className={`${estaAbierto(pe.id) ? 'abierta' : ''} ${pe.id === pedidoDestacado ? 'destacado' : ''}`}
                  >
                    <td>
                      <button className="chevron" onClick={() => toggleDetalle(pe.id)} aria-label="Ver detalle">
                        <i className={`bi ${estaAbierto(pe.id) ? 'bi-chevron-down' : 'bi-chevron-right'}`} />
                      </button>
                    </td>
                    <td className="n">#{pe.id}</td>
                    <td>{formatFechaHora(pe.fecha_pedido)}</td>
                    <td>{pe.items.reduce((a, i) => a + i.cantidad, 0)}</td>
                    <td className="total">{formatoCOP(pe.total)}</td>
                    <td>
                      <span className={`estado-badge ${pe.estado}`}>{pe.estado}</span>
                    </td>
                    <td>
                      <div className="ped-acciones">
                        <button className="btn-factura" onClick={() => setFactura(pe)}>
                          <i className="bi bi-file-earmark-text" /> Factura
                        </button>
                        {pe.puede_pagar && (
                          <button className="btn-factura" disabled={pagando[pe.id]} onClick={() => pagar(pe.id)}>
                            <i className="bi bi-credit-card" /> {pagando[pe.id] ? 'Abriendo…' : 'Pagar ahora'}
                          </button>
                        )}
                        {Cancelables.includes(pe.estado) && (
                          <button
                            className="btn-cancelar-pedido"
                            disabled={cancelando[pe.id]}
                            onClick={() => cancelar(pe.id)}
                          >
                            <i className="bi bi-x-circle" /> {cancelando[pe.id] ? 'Cancelando…' : 'Cancelar'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {estaAbierto(pe.id) && (
                    <tr className="detalles">
                      <td colSpan={7}>
                        <div className="pedido-envio">
                          <div className="envio-item">
                            <i className="bi bi-geo-alt" />
                            <div>
                              <span>Dirección</span>
                              <b>{pe.direccion || 'Sin dirección'}</b>
                            </div>
                          </div>
                          <div className="envio-item">
                            <i className="bi bi-buildings" />
                            <div>
                              <span>Ciudad</span>
                              <b>{pe.ciudad || 'Sin ciudad'}</b>
                            </div>
                          </div>
                          <div className="envio-item">
                            <i className="bi bi-info-circle" />
                            <div>
                              <span>Información adicional</span>
                              <b>{pe.direccion_info || 'Sin información adicional'}</b>
                            </div>
                          </div>
                        </div>
                        <p className="pedido-info">
                          <i className="bi bi-basket" />
                          <span className="sub">{pe.items.length} productos en este pedido</span>
                        </p>
                        <div className="pedido-items">
                          {pe.items.map((it) => (
                            <div className="pedido-item" key={it.producto_id}>
                              <img src={it.img} alt={it.producto} />
                              <div className="mi">
                                <strong>{it.producto}</strong>
                                <span>{it.cantidad} × {formatoCOP(it.precio)}</span>
                                {it.detalle && <span>{it.detalle}</span>}
                              </div>
                              <b>{formatoCOP(it.subtotal)}</b>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {factura && <Factura pedido={factura} onCerrar={() => setFactura(null)} />}
    </section>
  )
}
