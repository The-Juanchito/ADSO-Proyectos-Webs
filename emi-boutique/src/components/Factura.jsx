import { useEffect } from 'react'
import { formatoCOP } from '../data/products'
import logoimg from '../assets/logo.png'

const DATOS_NEGOCIO = {
  nombre: 'EMI Boutique',
  lema: 'Moda femenina · Viste tu estilo con EMI',
  nit: 'NIT 901.234.567-8',
  direccion: 'Av. Siempre Viva #123, Bogotá D.C.',
  telefono: '+57 300 123 4567',
  correo: 'ventas@emiboutique.co',
}

// Fechas para la factura
const formatoFechaLarga = (f) => {
  if (!f) return ''
  try {
    return new Date(f).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return ''
  }
}
const formatoHora = (f) => {
  if (!f) return ''
  try {
    return new Date(f).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}
const nombreMetodo = (m) => (m === 'wompi' ? 'Pago en línea (Wompi)' : 'Pago contra entrega')
const nroFactura = (id) => `FAC-${String(id).padStart(6, '0')}`

// Modal con la factura tipo tienda; la descarga en PDF se hace con la impresión del navegador.
export default function Factura({ pedido, onCerrar }) {
  // Mientras la factura está abierta, marca <body> para que al imprimir solo salga la hoja
  useEffect(() => {
    document.body.classList.toggle('factura-abierta', Boolean(pedido))
    return () => document.body.classList.remove('factura-abierta')
  }, [pedido])

  return (
    <div className="factura-overlay" role="dialog" aria-modal="true">
      <div className="factura-hoja" id="factura">
        {/* Cabecera: marca + documento */}
        <div className="fcab">
          <div className="fcab-marca">
            <img src={logoimg} alt="EMI Boutique" />
            <div>
              <h1>EMI Boutique</h1>
              <p>{DATOS_NEGOCIO.lema}</p>
            </div>
          </div>
          <div className="fcab-doc">
            <h2>FACTURA DE VENTA</h2>
            <span className="nro">N° {nroFactura(pedido.id)}</span>
          </div>
        </div>

        {/* Datos del negocio y del cliente */}
        <div className="fdobles">
          <div className="fbx">
            <h3>Emisor</h3>
            <p>{DATOS_NEGOCIO.nombre}</p>
            <p>{DATOS_NEGOCIO.nit}</p>
            <p>{DATOS_NEGOCIO.direccion}</p>
            <p>Tel: {DATOS_NEGOCIO.telefono} · {DATOS_NEGOCIO.correo}</p>
          </div>
          <div className="fbx">
            <h3>Facturado a</h3>
            <p>{pedido.cliente}</p>
            <p>{pedido.correo}</p>
            <p>{[pedido.direccion, pedido.ciudad].filter(Boolean).join(', ')}</p>
            <p>Contacto: {pedido.contacto || '—'}</p>
          </div>
        </div>

        {/* Metadatos de la venta */}
        <div className="fmeta">
          <span><i className="bi bi-calendar3" /> {formatoFechaLarga(pedido.fecha_pedido)}</span>
          <span><i className="bi bi-clock" /> {formatoHora(pedido.fecha_pedido)}</span>
          <span className={`fest ${pedido.estado}`}><i className="bi bi-circle-fill" /> {pedido.estado}</span>
          <span><i className="bi bi-credit-card" /> {nombreMetodo(pedido.metodo_pago)}</span>
          {pedido.referencia && (
            <span className="fref"><i className="bi bi-patch-check" /> Ref. {pedido.referencia}</span>
          )}
        </div>

        {/* Productos */}
        <table className="fitems">
          <thead>
            <tr>
              <th>Prenda</th>
              <th>Detalle</th>
              <th>Cant.</th>
              <th>Precio unit.</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {pedido.items.map((it) => (
              <tr key={it.producto_id}>
                <td><strong>{it.producto}</strong></td>
                <td>{it.detalle || '—'}</td>
                <td>{it.cantidad}</td>
                <td>{formatoCOP(it.precio)}</td>
                <td>{formatoCOP(it.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totales */}
        <div className="ftotales">
          <div><span>Subtotal</span><b>{formatoCOP(pedido.subtotal)}</b></div>
          {Number(pedido.descuento) > 0 && (
            <div><span>Descuento</span><b>−{formatoCOP(pedido.descuento)}</b></div>
          )}
          {Number(pedido.costo_envio) > 0 && (
            <div><span>Envío</span><b>{formatoCOP(pedido.costo_envio)}</b></div>
          )}
          <div className="fmbox"><span>Total a pagar</span><b>{formatoCOP(pedido.total)}</b></div>
        </div>

        {/* Pie */}
        <div className="fpie">
          <p>Gracias por tu compra. Esta factura es un documento de demostración generado por {DATOS_NEGOCIO.nombre}.</p>
          <p>Dudas o cambios: escríbenos a <b>{DATOS_NEGOCIO.correo}</b> o llámanos al <b>{DATOS_NEGOCIO.telefono}</b>.</p>
        </div>
      </div>

      <div className="factura-acciones">
        <button className="btn-print" onClick={() => window.print()}>
          <i className="bi bi-printer" /> Imprimir / Guardar PDF
        </button>
        <button className="btn-cerrar-f" onClick={onCerrar}>
          <i className="bi bi-x-lg" /> Cerrar
        </button>
      </div>
    </div>
  )
}