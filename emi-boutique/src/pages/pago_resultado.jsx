import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../services/api'
import { formatoCOP } from '../data/products'
import { useStore } from '../context/StoreContext'

// Pantalla a la que Wompi devuelve al cliente después de pagar.
// Nunca confiamos en la URL: preguntamos al servidor, que consulta a Wompi.
export default function PagoResultado() {
  const [params] = useSearchParams()
  const pedidoId = Number(params.get('pedido'))
  const txId = params.get('id') || ''
  const { user } = useStore()
  const [estado, setEstado] = useState(pedidoId ? 'verificando' : 'error') // verificando | aprobado | rechazado | pendiente | error
  const [pedido, setPedido] = useState(null)
  const [mensaje, setMensaje] = useState(pedidoId ? '' : 'No encontramos el pedido a verificar.')

  useEffect(() => {
    if (!pedidoId || !user) return undefined
    let activo = true
    let intentos = 0
    let timer
    const consultar = async () => {
      try {
        const r = await api.verificarPago(pedidoId, txId)
        if (!activo) return
        setPedido(r.pedido)
        const pago = r.pedido?.pago_estado
        if (pago === 'aprobado') return setEstado('aprobado')
        if (r.estado_transaccion === 'DECLINED' || r.estado_transaccion === 'ERROR' || pago === 'rechazado') {
          return setEstado('rechazado')
        }
        if (r.pedido?.estado === 'cancelado') {
          setMensaje('Este pedido fue cancelado.')
          return setEstado('error')
        }
        intentos += 1
        if (intentos < 8) {
          setEstado('verificando')
          timer = setTimeout(consultar, 3000)
        } else {
          setEstado('pendiente')
        }
      } catch (e) {
        if (!activo) return
        setMensaje(e.message || 'No se pudo verificar el pago.')
        setEstado('error')
      }
    }
    consultar()
    return () => {
      activo = false
      clearTimeout(timer)
    }
  }, [pedidoId, txId, user])

  const vista = {
    verificando: { icono: 'bi-hourglass-split', titulo: 'Verificando tu pago…', texto: 'Esto toma unos segundos. No cierres la página.' },
    aprobado: { icono: 'bi-check-circle', titulo: '¡Pago aprobado!', texto: 'Gracias por tu compra. Te enviaremos novedades de tu pedido.' },
    rechazado: { icono: 'bi-x-circle', titulo: 'El pago no fue aprobado', texto: 'No se te cobró. Puedes intentarlo de nuevo desde «Mis pedidos» con «Pagar ahora».' },
    pendiente: { icono: 'bi-clock-history', titulo: 'Tu pago sigue en proceso', texto: 'Tu banco aún no confirma. Revisa «Mis pedidos» en unos minutos; se actualizará solo.' },
    error: { icono: 'bi-exclamation-triangle', titulo: 'No pudimos verificar el pago', texto: mensaje },
  }[estado]

  if (!user) {
    return (
      <div className="cart-page">
        <div className="empty-cart">
          <h3>Inicia sesión para ver tu pago</h3>
          <Link to="/login" className="btn-primary" style={{ textDecoration: 'none' }}>Ingresar</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <div className="empty-cart pago-resultado">
        <i className={`bi ${vista.icono}`} style={{ fontSize: '3rem' }} />
        <h3>{vista.titulo}</h3>
        <p>{vista.texto}</p>
        {pedido && (
          <p>
            Pedido #{pedido.id} · {formatoCOP(pedido.total)}
            {pedido.referencia ? ` · Ref. ${pedido.referencia}` : ''}
          </p>
        )}
        <Link to="/carrito" className="btn-primary" style={{ textDecoration: 'none' }}>Ver mis pedidos</Link>
      </div>
    </div>
  )
}
