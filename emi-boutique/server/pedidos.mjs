import { randomBytes } from 'node:crypto'
import { db } from './db.mjs'
import { fallar } from './http.mjs'
import { entero, texto, formatoCOP, precioFinal } from './util.mjs'
import { productosPorIds } from './catalogo.mjs'
import { notificarAdmins, notificarAdminsUnico, notificarClientePedido } from './notificaciones.mjs'
import { urlCheckout, wompiConfigurado, consultarPorReferencia, consultarTransaccion } from './wompi.mjs'

export const ESTADOS_PEDIDO = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado']
const HORAS_RESERVA_PAGO = 3

const ETIQUETAS = {
  pendiente: 'Pendiente de pago',
  pagado: 'Pagado',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

const enlacePedido = (id) => `/perfil?panel=pedidos&pedido=${id}`

// ---------------------------------------------------------------------------
//  Lectura / formato
// ---------------------------------------------------------------------------

const SELECT_PEDIDO = (sql) => sql`
  select p.id, p.usuario_id, u.nombre as cliente, u.correo, u.telefono,
         p.subtotal, p.descuento, p.costo_envio, p.total, p.estado, p.fecha_pedido,
         d.direccion, d.direccion_info, d.ciudad
  from pedidos p
  join usuarios u on u.id = p.usuario_id
  left join direcciones d on d.id = p.direccion_id`

async function formatearPedidos(filas) {
  if (!filas.length) return []
  const sql = db()
  const ids = filas.map((f) => f.id)
  const items = await sql`
    select dp.pedido_id, dp.producto_id, dp.cantidad, dp.precio, dp.subtotal, dp.detalle, pr.nombre as producto,
           coalesce((select i.imagen from imagenes_producto i where i.producto_id = pr.id
                     order by i.principal desc, i.id limit 1), '') as img
    from detalle_pedido dp join productos pr on pr.id = dp.producto_id
    where dp.pedido_id = any(${ids}) order by dp.id`
  const pagos = await sql`
    select distinct on (pedido_id) pedido_id, metodo_pago, estado, referencia, medio
    from pagos where pedido_id = any(${ids}) order by pedido_id, id desc`
  return filas.map((pe) => {
    const pago = pagos.find((p) => p.pedido_id === pe.id)
    const metodo = pago?.metodo_pago || 'efectivo'
    const pagoEstado = pago?.estado || 'pendiente'
    return {
      id: pe.id,
      usuario_id: pe.usuario_id,
      cliente: pe.cliente,
      contacto: pe.telefono ?? '',
      correo: pe.correo,
      subtotal: pe.subtotal,
      descuento: pe.descuento,
      costo_envio: pe.costo_envio,
      total: pe.total,
      estado: pe.estado,
      fecha_pedido: pe.fecha_pedido,
      direccion: pe.direccion ?? '',
      direccion_info: pe.direccion_info ?? '',
      ciudad: pe.ciudad ?? '',
      metodo_pago: metodo,
      pago_estado: pagoEstado,
      referencia: pago?.referencia ?? '',
      medio_pago: pago?.medio ?? '',
      puede_pagar: metodo === 'wompi' && pagoEstado === 'pendiente' && pe.estado === 'pendiente',
      items: items
        .filter((i) => i.pedido_id === pe.id)
        .map((i) => ({
          producto_id: i.producto_id,
          producto: i.producto,
          cantidad: i.cantidad,
          precio: i.precio,
          subtotal: i.subtotal,
          detalle: i.detalle ?? '',
          img: i.img,
        })),
    }
  })
}

export async function pedidoPorId(id) {
  const sql = db()
  const filas = await sql`${SELECT_PEDIDO(sql)} where p.id = ${id}`
  return (await formatearPedidos(filas))[0] ?? null
}

export async function misPedidos(usuario) {
  await expirarPendientes()
  const sql = db()
  const filas = await sql`${SELECT_PEDIDO(sql)} where p.usuario_id = ${usuario.id} order by p.fecha_pedido desc, p.id desc`
  return formatearPedidos(filas)
}

export async function listarPedidosAdmin() {
  await expirarPendientes()
  const sql = db()
  const filas = await sql`${SELECT_PEDIDO(sql)} order by p.fecha_pedido desc, p.id desc`
  return formatearPedidos(filas)
}

// ---------------------------------------------------------------------------
//  Creación del pedido
// ---------------------------------------------------------------------------

/** Lee el carrito enviado, toma los precios REALES de la base de datos y valida stock. */
async function armarCanasta(datos) {
  const items = Array.isArray(datos.items) ? datos.items : []
  if (!items.length) fallar('El carrito está vacío')
  if (items.length > 60) fallar('El carrito tiene demasiados artículos')

  const productos = await productosPorIds(items.map((i) => i?.id), { soloActivos: true })
  const mapa = new Map(productos.map((p) => [p.id, p]))
  const canasta = []
  for (const i of items) {
    const p = mapa.get(Number(i?.id))
    if (!p) fallar(`Producto no disponible: ${i?.id ?? '?'}`)
    const talla = texto(i.talla).slice(0, 20)
    const color = texto(i.color).slice(0, 40)
    const detalle = [talla && `Talla: ${talla}`, color && `Color: ${color}`].filter(Boolean).join(' · ')
    const cantidad = Math.min(Math.max(entero(i.cantidad, 1), 1), 99)
    canasta.push({ producto: p, cantidad, detalle, unitario: precioFinal(p.precio, p.descuento) })
  }
  const subtotal = canasta.reduce((a, c) => a + c.producto.precio * c.cantidad, 0)
  const total = canasta.reduce((a, c) => a + c.unitario * c.cantidad, 0)
  return { canasta, subtotal: Math.round(subtotal), total: Math.round(total) }
}

async function resolverDireccion(tx, usuario, datos) {
  const elegida = entero(datos.direccion_id)
  if (elegida > 0) {
    const [d] = await tx`select id from direcciones where id = ${elegida} and usuario_id = ${usuario.id} and activo = true`
    if (d) return d.id
  }
  const [pred] = await tx`select id from direcciones where usuario_id = ${usuario.id} and activo = true
                          order by predeterminada desc, id asc limit 1`
  if (pred) return pred.id
  const [nueva] = await tx`
    insert into direcciones (usuario_id, alias, direccion, direccion_info, ciudad, telefono, predeterminada)
    values (${usuario.id}, 'Principal', ${texto(usuario.direccion) || 'Por confirmar'},
            ${texto(usuario.direccion_info) || null}, ${texto(usuario.ciudad) || null},
            ${texto(usuario.telefono) || null}, true)
    returning id`
  return nueva.id
}

export async function crearPedido(usuario, datos) {
  const metodo = texto(datos.metodo_pago, 'efectivo').toLowerCase() === 'wompi' ? 'wompi' : 'efectivo'
  if (metodo === 'wompi' && !wompiConfigurado()) {
    fallar('Los pagos en línea no están disponibles por ahora. Elige pago contra entrega.', 503)
  }
  await expirarPendientes()
  const { canasta, subtotal, total } = await armarCanasta(datos)
  if (total <= 0) fallar('El total del pedido no es válido')

  const sql = db()
  const { idPedido, referencia } = await sql.begin(async (tx) => {
    const direccionId = await resolverDireccion(tx, usuario, datos)
    const [p] = await tx`
      insert into pedidos (usuario_id, direccion_id, subtotal, descuento, costo_envio, total, estado)
      values (${usuario.id}, ${direccionId}, ${subtotal}, ${subtotal - total}, 0, ${total}, 'pendiente')
      returning id`

    // Descuenta stock de forma atómica: si alguien compró antes, falla sin dejar nada a medias.
    const porProducto = new Map()
    for (const c of canasta) porProducto.set(c.producto.id, (porProducto.get(c.producto.id) ?? 0) + c.cantidad)
    for (const [id, cantidad] of porProducto) {
      const [ok] = await tx`update productos set stock = stock - ${cantidad}
                            where id = ${id} and estado = 1 and stock >= ${cantidad} returning id`
      if (!ok) {
        const nombre = canasta.find((c) => c.producto.id === id).producto.nombre
        fallar(`No hay suficiente stock de "${nombre}"`, 409)
      }
    }
    for (const c of canasta) {
      await tx`insert into detalle_pedido (pedido_id, producto_id, cantidad, precio, subtotal, detalle)
               values (${p.id}, ${c.producto.id}, ${c.cantidad}, ${c.unitario}, ${c.unitario * c.cantidad}, ${c.detalle || null})`
    }
    const ref = metodo === 'wompi' ? `EMI-${p.id}-${randomBytes(4).toString('hex').toUpperCase()}` : null
    await tx`insert into pagos (pedido_id, metodo_pago, monto, estado, referencia)
             values (${p.id}, ${metodo}, ${total}, 'pendiente', ${ref})`
    return { idPedido: p.id, referencia: ref }
  })

  const detalle = await pedidoPorId(idPedido)
  const totalFmt = formatoCOP(total)
  const metodoTxt = metodo === 'wompi' ? 'pago en línea (Wompi)' : 'contra entrega'
  await notificarAdmins(
    `Nuevo pedido #${idPedido}`,
    `${usuario.nombre} (${usuario.correo}) hizo un pedido por ${totalFmt} con ${canasta.length} artículo(s). Pago: ${metodoTxt}${metodo === 'wompi' ? ' — pendiente de confirmación' : ''}.`,
    'pedido',
    '/admin'
  )
  await notificarClientePedido(
    usuario.id,
    usuario.correo,
    `Recibimos tu pedido #${idPedido}`,
    metodo === 'wompi'
      ? `Registramos tu pedido #${idPedido} por ${totalFmt}. Completa el pago en línea para confirmarlo; te avisaremos apenas se apruebe.`
      : `¡Gracias por tu compra! Registramos tu pedido #${idPedido} por ${totalFmt}. Pagarás contra entrega.`,
    enlacePedido(idPedido)
  )
  await avisarBajoStock(canasta.map((c) => c.producto.id))

  return {
    pedido_id: idPedido,
    subtotal,
    total,
    items: canasta.length,
    estado: 'pendiente',
    metodo_pago: metodo,
    referencia: referencia ?? '',
    detalle,
    checkout_url: metodo === 'wompi' ? urlCheckout({ referencia, total, correo: usuario.correo, pedidoId: idPedido }) : null,
  }
}

async function avisarBajoStock(ids) {
  const productos = await productosPorIds(ids)
  for (const p of productos) {
    if (p.stock <= p.stock_minimo) {
      await notificarAdminsUnico(
        `Stock bajo: ${p.nombre}`,
        `A "${p.nombre}" le quedan ${p.stock} unidades (mínimo ${p.stock_minimo}).`,
        'stock',
        '/admin/stock-bajo'
      )
    }
  }
}

/** Genera de nuevo el enlace de pago de un pedido propio que sigue pendiente. */
export async function pagarPedido(usuario, id) {
  const sql = db()
  const [r] = await sql`
    select p.id, p.total, p.estado, pg.referencia, pg.metodo_pago, pg.estado as pago_estado
    from pedidos p join pagos pg on pg.pedido_id = p.id
    where p.id = ${id} and p.usuario_id = ${usuario.id}
    order by pg.id desc limit 1`
  if (!r) fallar('Pedido no encontrado', 404)
  if (r.metodo_pago !== 'wompi' || r.estado !== 'pendiente' || r.pago_estado !== 'pendiente') {
    fallar('Este pedido no tiene un pago en línea pendiente', 400)
  }
  return { checkout_url: urlCheckout({ referencia: r.referencia, total: r.total, correo: usuario.correo, pedidoId: id }) }
}

// ---------------------------------------------------------------------------
//  Cancelación / expiración / cambios de estado
// ---------------------------------------------------------------------------

async function cancelarYRestock(q, id) {
  const items = await q`select producto_id, cantidad from detalle_pedido where pedido_id = ${id}`
  for (const i of items) await q`update productos set stock = stock + ${i.cantidad} where id = ${i.producto_id}`
  await q`update pedidos set estado = 'cancelado' where id = ${id}`
  await q`update pagos set estado = 'rechazado' where pedido_id = ${id} and estado = 'pendiente'`
}

export async function cancelarPedidoCliente(usuario, id) {
  const sql = db()
  const [p] = await sql`select estado from pedidos where id = ${id} and usuario_id = ${usuario.id}`
  if (!p) fallar('Pedido no encontrado', 404)
  if (p.estado === 'cancelado') fallar('Este pedido ya fue cancelado')
  if (p.estado !== 'pendiente') {
    fallar('Este pedido ya fue pagado o despachado. Escríbenos desde la sección de mensajes para gestionarlo.')
  }
  await sql.begin(async (tx) => {
    const [bloqueado] = await tx`select estado from pedidos where id = ${id} for update`
    if (bloqueado.estado !== 'pendiente') fallar('Este pedido ya no se puede cancelar', 409)
    await cancelarYRestock(tx, id)
  })
  await notificarAdmins(`Pedido #${id} cancelado`, `${usuario.nombre} (${usuario.correo}) canceló su pedido #${id}.`, 'pedido', '/admin')
  return pedidoPorId(id)
}

/** Cancela (y devuelve el stock) los pedidos con pago en línea que nunca se completaron. */
export async function expirarPendientes() {
  try {
    const sql = db()
    const vencidos = await sql`
      select p.id, pg.referencia from pedidos p join pagos pg on pg.pedido_id = p.id
      where p.estado = 'pendiente' and pg.metodo_pago = 'wompi' and pg.estado = 'pendiente'
        and p.fecha_pedido < now() - make_interval(hours => ${HORAS_RESERVA_PAGO})
      limit 25`
    for (const v of vencidos) {
      // Antes de cancelar, confirmar con Wompi que de verdad no se pagó.
      const tx = await consultarPorReferencia(v.referencia).catch(() => null)
      if (tx?.status === 'APPROVED') {
        await conciliarTransaccion(tx)
        continue
      }
      await sql.begin(async (q) => {
        const [bloq] = await q`select estado from pedidos where id = ${v.id} for update`
        if (bloq?.estado === 'pendiente') await cancelarYRestock(q, v.id)
      })
    }
  } catch (e) {
    console.error('[expirarPendientes]', e.message) // nunca debe romper la petición principal
  }
}

export async function actualizarEstadoPedido(id, estado, mensaje = '') {
  const sql = db()
  const [actual] = await sql`
    select p.estado, p.usuario_id, u.nombre, u.correo,
           (select metodo_pago from pagos where pedido_id = p.id order by id desc limit 1) as metodo,
           (select estado from pagos where pedido_id = p.id order by id desc limit 1) as pago_estado
    from pedidos p join usuarios u on u.id = p.usuario_id where p.id = ${id}`
  if (!actual) fallar('Pedido no encontrado', 404)
  if (actual.estado === estado) return pedidoPorId(id)
  if (actual.estado === 'cancelado') fallar('Un pedido cancelado no se puede reactivar. Pide al cliente que haga uno nuevo.', 409)
  if (actual.metodo === 'wompi' && actual.pago_estado !== 'aprobado' && estado !== 'cancelado') {
    fallar('El pago en línea de este pedido aún no está aprobado. Se confirma automáticamente cuando Wompi lo aprueba.', 409)
  }

  await sql.begin(async (tx) => {
    if (estado === 'cancelado') {
      await cancelarYRestock(tx, id)
      return
    }
    await tx`update pedidos set estado = ${estado} where id = ${id}`
    // Pago contra entrega: al marcarlo como pagado/entregado se registra el cobro.
    if (['pagado', 'entregado'].includes(estado) && actual.metodo !== 'wompi') {
      await tx`update pagos set estado = 'aprobado' where pedido_id = ${id} and estado = 'pendiente'`
    }
  })

  const detalle = texto(mensaje) || `El estado de tu pedido #${id} cambió a "${ETIQUETAS[estado] ?? estado}".`
  await notificarClientePedido(actual.usuario_id, actual.correo, `Pedido #${id} · ${ETIQUETAS[estado] ?? estado}`, detalle, enlacePedido(id))
  return pedidoPorId(id)
}

// ---------------------------------------------------------------------------
//  Conciliación de pagos Wompi (webhook y página de resultado)
// ---------------------------------------------------------------------------

/**
 * Aplica el resultado de una transacción de Wompi a nuestro pedido.
 * Es idempotente: se puede llamar muchas veces con la misma transacción.
 * `tx` debe venir de la API de Wompi (nunca directamente del navegador).
 */
export async function conciliarTransaccion(tx) {
  if (!tx?.reference) return { ignorada: true }
  const sql = db()
  const avisos = []
  const resultado = await sql.begin(async (q) => {
    const [pago] = await q`
      select pg.id, pg.pedido_id, pg.estado, pg.monto, p.estado as pedido_estado, p.usuario_id,
             u.nombre, u.correo
      from pagos pg join pedidos p on p.id = pg.pedido_id join usuarios u on u.id = p.usuario_id
      where pg.referencia = ${String(tx.reference)}
      for update of pg, p`
    if (!pago) return { ignorada: true }
    const base = { pedido_id: pago.pedido_id, estado_transaccion: tx.status }

    if (tx.status === 'APPROVED') {
      const montoOk = Math.round(Number(pago.monto) * 100) === Number(tx.amount_in_cents) && tx.currency === 'COP'
      if (!montoOk) {
        avisos.push(() => notificarAdmins(
          `⚠ Pago con monto distinto · pedido #${pago.pedido_id}`,
          `Wompi aprobó la transacción ${tx.id} por ${Number(tx.amount_in_cents) / 100} ${tx.currency}, pero el pedido es de ${formatoCOP(pago.monto)}. Revísalo manualmente en tu panel de Wompi.`,
          'pedido', '/admin'))
        return { ...base, error: 'monto' }
      }
      if (pago.estado === 'aprobado') return { ...base, pedido_estado: pago.pedido_estado }
      await q`update pagos set estado = 'aprobado', transaccion_id = ${String(tx.id)},
              medio = ${tx.payment_method_type ? String(tx.payment_method_type).slice(0, 40) : null} where id = ${pago.id}`
      if (pago.pedido_estado === 'pendiente') {
        await q`update pedidos set estado = 'pagado' where id = ${pago.pedido_id}`
        avisos.push(() => notificarClientePedido(pago.usuario_id, pago.correo, `Pago aprobado · pedido #${pago.pedido_id}`,
          `¡Recibimos tu pago de ${formatoCOP(pago.monto)}! Tu pedido #${pago.pedido_id} ya está confirmado y lo prepararemos para el envío.`,
          enlacePedido(pago.pedido_id)))
        avisos.push(() => notificarAdmins(`Pago aprobado · pedido #${pago.pedido_id}`,
          `${pago.nombre} pagó ${formatoCOP(pago.monto)} por Wompi (${tx.payment_method_type || 'en línea'}).`, 'pedido', '/admin'))
        return { ...base, pedido_estado: 'pagado' }
      }
      if (pago.pedido_estado === 'cancelado') {
        avisos.push(() => notificarAdmins(`⚠ Pago recibido en pedido CANCELADO #${pago.pedido_id}`,
          `Wompi aprobó ${formatoCOP(pago.monto)} (transacción ${tx.id}) pero el pedido ya estaba cancelado y su stock devuelto. Reembolsa el pago desde tu panel de Wompi o contacta al cliente (${pago.correo}).`,
          'pedido', '/admin'))
      }
      return { ...base, pedido_estado: pago.pedido_estado }
    }

    if (['DECLINED', 'ERROR', 'VOIDED'].includes(tx.status) && pago.estado === 'pendiente') {
      // El pedido sigue pendiente para que el cliente pueda reintentar el pago.
      await q`update pagos set transaccion_id = ${String(tx.id)} where id = ${pago.id}`
      avisos.push(() => notificarClientePedido(pago.usuario_id, pago.correo, `Pago no aprobado · pedido #${pago.pedido_id}`,
        'Tu pago no fue aprobado. Puedes intentarlo de nuevo con otro medio desde "Mis pedidos"; reservamos tus productos por unas horas.',
        enlacePedido(pago.pedido_id)))
    }
    return { ...base, pedido_estado: pago.pedido_estado }
  })
  for (const a of avisos) await a().catch((e) => console.error('[aviso]', e.message))
  return resultado
}

/** Consulta el estado real del pago de un pedido propio (usado por la página de resultado). */
export async function verificarPagoPedido(usuario, pedidoId, transaccionId = '') {
  const sql = db()
  const [pg] = await sql`
    select pg.referencia, pg.estado from pagos pg join pedidos p on p.id = pg.pedido_id
    where p.id = ${pedidoId} and p.usuario_id = ${usuario.id} and pg.metodo_pago = 'wompi'
    order by pg.id desc limit 1`
  if (!pg) fallar('Pedido no encontrado', 404)

  let estadoTx = pg.estado === 'aprobado' ? 'APPROVED' : null
  if (pg.estado !== 'aprobado') {
    let tx = transaccionId ? await consultarTransaccion(transaccionId) : null
    if (!tx || tx.reference !== pg.referencia) tx = await consultarPorReferencia(pg.referencia)
    if (tx && tx.reference === pg.referencia) {
      const r = await conciliarTransaccion(tx)
      estadoTx = r.estado_transaccion ?? tx.status
    }
  }
  return { pedido: await pedidoPorId(pedidoId), estado_transaccion: estadoTx }
}
