import { HttpError, fallar, json, leerCuerpo } from './http.mjs'
import { entero, esId, texto } from './util.mjs'
import { requiereAdmin, requiereStaff, requiereUsuario, usuarioActual } from './auth.mjs'
import {
  actualizarProducto, crearProducto, detalleProducto, eliminarProducto,
  listarCategorias, listarProductos, productosBajoStock, statsAdmin,
} from './catalogo.mjs'
import {
  ESTADOS_PEDIDO, actualizarEstadoPedido, cancelarPedidoCliente, conciliarTransaccion,
  crearPedido, listarPedidosAdmin, misPedidos, pagarPedido, verificarPagoPedido,
} from './pedidos.mjs'
import { checksumValido, consultarTransaccion, wompiConfigurado, wompiEntorno } from './wompi.mjs'
import {
  listarNotificaciones, marcarNotificacionLeida, marcarTodasLeidas,
} from './notificaciones.mjs'
import * as usuarios from './usuarios.mjs'
import * as social from './social.mjs'
import { rutaChat } from './ai.mjs'

// ---------------------------------------------------------------------------
//  Contexto de petición
// ---------------------------------------------------------------------------

export function crearContexto(req) {
  const url = new URL(req.url)
  const seg = url.pathname.split('/').filter(Boolean)
  if (seg[0] === 'api') seg.shift()
  let cuerpoCache = null
  const ctx = {
    req,
    url,
    metodo: req.method.toUpperCase(),
    seg,
    recurso: seg[0] ?? '',
    id: seg[1] && /^\d+$/.test(seg[1]) ? Number(seg[1]) : 0,
    query: url.searchParams,
    cookies: [],
    async cuerpo() {
      if (!cuerpoCache) cuerpoCache = await leerCuerpo(req)
      return cuerpoCache
    },
  }
  return ctx
}

/** Defensa CSRF extra: las escrituras solo se aceptan desde nuestro propio sitio. */
function comprobarOrigen(ctx) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(ctx.metodo)) return
  if (ctx.seg[0] === 'wompi' && ctx.seg[1] === 'webhook') return // llamada servidor a servidor
  const origen = ctx.req.headers.get('origin')
  if (!origen) return
  const host = ctx.req.headers.get('x-forwarded-host') || ctx.req.headers.get('host') || ctx.url.host
  let o
  try {
    o = new URL(origen)
  } catch {
    fallar('Origen no permitido', 403)
  }
  if (o.host !== host && o.host !== ctx.url.host) fallar('Origen no permitido', 403)
}

// ---------------------------------------------------------------------------
//  Rutas propias de este archivo (catálogo, pedidos, Wompi, admin)
// ---------------------------------------------------------------------------

const idInvalido = (txt) => fallar(txt, 400)

const propias = {
  'GET /productos': async (ctx) => {
    if (ctx.seg[1] !== undefined && !esId(ctx.seg[1])) idInvalido('ID de producto inválido')
    if (ctx.seg[1] !== undefined) {
      const p = await detalleProducto(ctx.id, { soloActivos: true })
      if (!p) fallar('Producto no encontrado', 404)
      return { producto: p }
    }
    return { productos: await listarProductos(ctx.query.get('q'), ctx.query.get('cat')) }
  },

  'GET /categorias': async (ctx) => ({ categorias: await listarCategorias(ctx.query.get('todas') === '1') }),

  // ---- Pedidos del cliente ----
  'POST /pedidos': async (ctx) => {
    const u = await requiereUsuario(ctx, 'Debes iniciar sesión para realizar el pedido')
    if (ctx.seg[2] === 'pagar') {
      if (!ctx.id) idInvalido('ID de pedido inválido')
      return pagarPedido(u, ctx.id)
    }
    const { datos } = await ctx.cuerpo()
    return { pedido: await crearPedido(u, datos) }
  },
  'GET /pedidos': async (ctx) => ({ pedidos: await misPedidos(await requiereUsuario(ctx)) }),
  'PATCH /pedidos': async (ctx) => {
    if (!ctx.id) idInvalido('ID de pedido inválido')
    return { pedido: await cancelarPedidoCliente(await requiereUsuario(ctx), ctx.id) }
  },

  // ---- Wompi ----
  'GET /wompi': async (ctx) => {
    if (ctx.seg[1] === 'config') return { habilitado: wompiConfigurado(), entorno: wompiEntorno() }
    if (ctx.seg[1] === 'verificar') {
      const u = await requiereUsuario(ctx)
      const pedido = entero(ctx.query.get('pedido'))
      if (!pedido) idInvalido('Falta el pedido')
      return verificarPagoPedido(u, pedido, texto(ctx.query.get('id')))
    }
    fallar('Ruta no encontrada', 404)
  },
  'POST /wompi': async (ctx) => {
    if (ctx.seg[1] !== 'webhook') fallar('Ruta no encontrada', 404)
    const evento = (await ctx.req.json().catch(() => null)) || {}
    if (evento.event !== 'transaction.updated') return { recibido: true }
    // Si hay secreto de eventos configurado, la firma debe coincidir.
    if (process.env.WOMPI_EVENTS_SECRET && !checksumValido(evento, ctx.req.headers.get('x-event-checksum') || '')) {
      fallar('Firma inválida', 401)
    }
    // No confiamos en el cuerpo del aviso: consultamos la transacción directamente a Wompi.
    const idTx = evento?.data?.transaction?.id
    if (!idTx) return { recibido: true }
    const tx = await consultarTransaccion(String(idTx))
    if (!tx) fallar('No se pudo consultar la transacción', 502) // Wompi reintentará el aviso
    await conciliarTransaccion(tx)
    return { recibido: true }
  },

  // ---- Notificaciones ----
  'GET /notificaciones': async (ctx) =>
    listarNotificaciones(await requiereUsuario(ctx), ctx.query.get('todas') === '1'),
  'PATCH /notificaciones': async (ctx) => {
    const u = await requiereUsuario(ctx)
    if (ctx.id) await marcarNotificacionLeida(u, ctx.id)
    else await marcarTodasLeidas(u)
    return listarNotificaciones(u)
  },

  // ---- Panel del equipo ----
  'GET /stats': async (ctx) => {
    await requiereStaff(ctx)
    return statsAdmin()
  },

  'GET /admin': async (ctx) => {
    const [, sec, item] = ctx.seg
    switch (sec) {
      case 'cuentas':
        await requiereAdmin(ctx)
        return { cuentas: await usuarios.listarCuentasAdmin() }
      case 'stock-bajo':
        await requiereStaff(ctx)
        return { productos: await productosBajoStock() }
      case 'anuncios':
        await requiereStaff(ctx)
        return social.listarAnunciosAdmin()
      case 'mensajes':
        await requiereStaff(ctx)
        if (esId(item ?? '')) return social.listarMensajesAdmin(Number(item))
        return social.listarConversacionesAdmin(texto(ctx.query.get('q')))
      case 'usuarios':
        await requiereStaff(ctx)
        return { usuarios: await usuarios.buscarUsuariosAdmin(texto(ctx.query.get('q'))) }
      case 'pedidos':
        await requiereStaff(ctx)
        return { pedidos: await listarPedidosAdmin() }
      default:
        fallar('Ruta no encontrada', 404)
    }
  },

  'POST /admin': async (ctx) => {
    const [, sec, item] = ctx.seg
    if (sec === 'cuentas') {
      await requiereAdmin(ctx)
      const { datos } = await ctx.cuerpo()
      await usuarios.crearCuentaAdmin(datos)
      return { cuentas: await usuarios.listarCuentasAdmin() }
    }
    if (sec === 'mensajes') {
      await requiereStaff(ctx)
      if (!esId(item ?? '')) idInvalido('ID de usuario inválido')
      const { datos } = await ctx.cuerpo()
      return social.enviarMensajeAdmin(Number(item), datos)
    }
    if (sec === 'anuncios') {
      await requiereStaff(ctx)
      const { datos, archivos } = await ctx.cuerpo()
      return social.crearAnuncio(datos, archivos)
    }
    if (sec !== 'productos') fallar('Ruta no encontrada', 404)
    await requiereStaff(ctx)
    const { datos, archivos } = await ctx.cuerpo()
    return { producto: await crearProducto(datos, archivos) }
  },

  'PATCH /admin': async (ctx) => {
    const [, sec, item] = ctx.seg
    const conId = esId(item ?? '')
    if (sec === 'cuentas' && conId) {
      const actor = await requiereAdmin(ctx)
      const { datos } = await ctx.cuerpo()
      return { cuentas: await usuarios.actualizarCuentaAdmin(actor, Number(item), datos) }
    }
    await requiereStaff(ctx)
    if (sec === 'pedidos' && conId) {
      const { datos } = await ctx.cuerpo()
      const estado = texto(datos.estado)
      if (!ESTADOS_PEDIDO.includes(estado)) fallar('Estado inválido')
      return { pedido: await actualizarEstadoPedido(Number(item), estado, texto(datos.mensaje)) }
    }
    if (sec === 'productos' && conId) {
      const { datos, archivos } = await ctx.cuerpo()
      return { producto: await actualizarProducto(Number(item), datos, archivos) }
    }
    if (sec === 'anuncios' && conId) {
      const { datos, archivos } = await ctx.cuerpo()
      return social.actualizarAnuncio(Number(item), datos, archivos)
    }
    fallar('Ruta no encontrada', 404)
  },

  'DELETE /admin': async (ctx) => {
    const [, sec, item] = ctx.seg
    if (sec === 'anuncios' && esId(item ?? '')) {
      await requiereStaff(ctx)
      return social.eliminarAnuncio(Number(item))
    }
    if (sec !== 'productos' || !esId(item ?? '')) idInvalido('ID de producto inválido')
    await requiereStaff(ctx)
    await eliminarProducto(Number(item))
    return { eliminado: Number(item) }
  },
}

const TABLA = { ...usuarios.rutas, ...social.rutas, ...rutaChat, ...propias }

// ---------------------------------------------------------------------------
//  Despacho
// ---------------------------------------------------------------------------

export async function manejar(req) {
  const ctx = crearContexto(req)
  try {
    if (ctx.metodo === 'OPTIONS') return new Response(null, { status: 204 })
    comprobarOrigen(ctx)
    if (ctx.recurso === 'salud') {
      // Comprobación rápida: la función responde y la base de datos también.
      const { db } = await import('./db.mjs')
      await db()`select 1`
      return json({ ok: true, hora: new Date().toISOString() })
    }
    const handler = TABLA[`${ctx.metodo} /${ctx.recurso}`]
    if (!handler) fallar('Ruta no encontrada', 404)
    const payload = (await handler(ctx)) ?? {}
    const { _status, ...resto } = payload
    const headers = new Headers({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
    for (const c of ctx.cookies) headers.append('set-cookie', c)
    return new Response(JSON.stringify({ ok: true, ...resto }), { status: _status || 200, headers })
  } catch (e) {
    const headers = {}
    const res = e instanceof HttpError
      ? json({ ok: false, error: e.message, ...e.extra }, e.status)
      : (console.error('[api] error no controlado en', ctx.metodo, ctx.url.pathname, e),
        json({ ok: false, error: 'Ocurrió un error en el servidor. Inténtalo de nuevo.' }, 500, headers))
    for (const c of ctx.cookies) res.headers.append('set-cookie', c)
    return res
  }
}

export { usuarioActual }
