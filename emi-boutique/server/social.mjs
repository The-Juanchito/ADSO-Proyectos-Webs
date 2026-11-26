// Carrito, anuncios, reseñas, vistas, sugerencias y mensajería (cliente <-> equipo).
// Port de las funciones homónimas de api/index.php.

import { db } from './db.mjs'
import { fallar } from './http.mjs'
import { requiereUsuario } from './auth.mjs'
import { entero, texto, recortar, bool } from './util.mjs'
import { enlaceAbsoluto } from './util.mjs'
import { guardarImagen } from './storage.mjs'
import { productosPorIds } from './catalogo.mjs'
import { crearNotificacion, notificarAdmins } from './notificaciones.mjs'
import { enviarCorreo, plantillaCorreo } from './mail.mjs'

const like = (s) => `%${String(s).replace(/[%_\\]/g, '\\$&')}%`

/** Productos activos por id, devueltos como Map(id -> producto). */
async function mapaProductos(ids) {
  const lista = await productosPorIds(ids, { soloActivos: true, galeria: true })
  return new Map(lista.map((p) => [p.id, p]))
}

// ---------------------------------------------------------------------------
//  Carrito
// ---------------------------------------------------------------------------

export async function carritoUsuario(usuario) {
  const sql = db()
  const filas = await sql`
    select d.producto_id, d.cantidad, d.talla, d.color
    from detalle_carrito d join carrito c on c.id = d.carrito_id
    where c.usuario_id = ${usuario.id}
    order by d.id`
  if (!filas.length) return []
  const prods = await mapaProductos(filas.map((f) => f.producto_id))
  const lineas = []
  for (const f of filas) {
    const producto = prods.get(f.producto_id)
    if (!producto) continue // producto dado de baja
    lineas.push({ producto, cantidad: Number(f.cantidad), talla: f.talla ?? '', color: f.color ?? '' })
  }
  return lineas
}

export async function guardarCarrito(usuario, datos) {
  const items = Array.isArray(datos.items) ? datos.items.slice(0, 200) : []
  const candidatos = items
    .filter((i) => i && typeof i === 'object')
    .map((i) => ({
      pid: entero(i.id),
      cant: Math.min(Math.max(1, entero(i.cantidad, 1)), 999),
      talla: recortar(i.talla, 20),
      color: recortar(i.color, 40),
    }))
    .filter((i) => i.pid > 0)
  const existentes = await mapaProductos(candidatos.map((i) => i.pid))
  // La tabla solo admite una línea por producto: se suman las cantidades repetidas.
  const unicos = new Map()
  for (const i of candidatos) {
    if (!existentes.has(i.pid)) continue
    const previo = unicos.get(i.pid)
    if (previo) previo.cant = Math.min(previo.cant + i.cant, 999)
    else unicos.set(i.pid, { ...i })
  }

  const sql = db()
  await sql.begin(async (tx) => {
    const [c] = await tx`
      insert into carrito (usuario_id) values (${usuario.id})
      on conflict (usuario_id) do update set usuario_id = excluded.usuario_id
      returning id`
    await tx`delete from detalle_carrito where carrito_id = ${c.id}`
    for (const i of unicos.values()) {
      await tx`insert into detalle_carrito (carrito_id, producto_id, cantidad, talla, color)
               values (${c.id}, ${i.pid}, ${i.cant}, ${i.talla || null}, ${i.color || null})`
    }
  })
  return carritoUsuario(usuario)
}

// ---------------------------------------------------------------------------
//  Anuncios
// ---------------------------------------------------------------------------

export function anuncioFormateado(a) {
  return {
    id: Number(a.id),
    titulo: a.titulo ?? '',
    mensaje: a.mensaje ?? '',
    imagen: a.imagen ?? '',
    activo: !!a.activo,
    fecha: a.fecha ?? '',
  }
}

async function listarAnuncios(soloActivos = true) {
  const sql = db()
  const filas = await sql`
    select id, titulo, mensaje, imagen, activo, fecha from anuncios
    ${soloActivos ? sql`where activo = true` : sql``}
    order by fecha desc, id desc`
  return filas.map(anuncioFormateado)
}

export async function listarAnunciosAdmin() {
  return { anuncios: await listarAnuncios(false) }
}

export async function crearAnuncio(datos = {}, archivos = {}) {
  const titulo = recortar(datos.titulo, 150)
  const mensaje = recortar(datos.mensaje, 1000)
  if (!titulo || !mensaje) fallar('Escribe el título y el mensaje del anuncio')
  let imagen = recortar(datos.imagen, 500)
  if (archivos.imagen?.[0]) imagen = await guardarImagen(archivos.imagen[0])
  const activo = !('activo' in datos) || bool(datos.activo)
  const sql = db()
  await sql`insert into anuncios (titulo, mensaje, imagen, activo)
            values (${titulo}, ${mensaje}, ${imagen || null}, ${activo})`
  return listarAnunciosAdmin()
}

export async function actualizarAnuncio(id, datos = {}, archivos = {}) {
  const sql = db()
  const [a] = await sql`select titulo, mensaje, imagen, activo from anuncios where id = ${id}`
  if (!a) fallar('Anuncio no encontrado', 404)
  // Solo activar/desactivar
  if ('activo' in datos && Object.keys(datos).length === 1 && !archivos.imagen?.length) {
    await sql`update anuncios set activo = ${bool(datos.activo)} where id = ${id}`
    return listarAnunciosAdmin()
  }
  const titulo = 'titulo' in datos ? recortar(datos.titulo, 150) : a.titulo
  const mensaje = 'mensaje' in datos ? recortar(datos.mensaje, 1000) : a.mensaje
  if (!titulo || !mensaje) fallar('El título y el mensaje son obligatorios')
  let imagen = a.imagen ?? ''
  if (archivos.imagen?.[0]) imagen = await guardarImagen(archivos.imagen[0])
  else if ('imagen' in datos) imagen = recortar(datos.imagen, 500)
  const activo = 'activo' in datos ? bool(datos.activo) : !!a.activo
  await sql`update anuncios set titulo = ${titulo}, mensaje = ${mensaje}, imagen = ${imagen || null}, activo = ${activo}
            where id = ${id}`
  return listarAnunciosAdmin()
}

export async function eliminarAnuncio(id) {
  const sql = db()
  await sql`delete from anuncios where id = ${id}`
  return listarAnunciosAdmin()
}

// ---------------------------------------------------------------------------
//  Reseñas
// ---------------------------------------------------------------------------

export function resenaFormateada(r) {
  return {
    id: Number(r.id),
    producto_id: Number(r.producto_id),
    calificacion: Number(r.calificacion),
    comentario: r.comentario ?? '',
    fecha: r.fecha,
    usuario: r.usuario,
    usuario_id: Number(r.usuario_id),
  }
}

async function resenaPorId(id, usuarioId = null) {
  const sql = db()
  const [r] = await sql`
    select r.id, r.usuario_id, r.producto_id, r.calificacion, r.comentario, r.fecha, u.nombre as usuario
    from resenas r join usuarios u on u.id = r.usuario_id
    where r.id = ${id} ${usuarioId ? sql`and r.usuario_id = ${usuarioId}` : sql``}`
  return r ?? null
}

export async function resenasProducto(productoId) {
  const sql = db()
  const filas = await sql`
    select r.id, r.usuario_id, r.producto_id, r.calificacion, r.comentario, r.fecha, u.nombre as usuario
    from resenas r join usuarios u on u.id = r.usuario_id
    where r.producto_id = ${productoId}
    order by r.fecha desc, r.id desc`
  return filas.map(resenaFormateada)
}

async function agregarResena(usuario, datos) {
  const productoId = entero(datos.producto_id)
  const calificacion = entero(datos.calificacion)
  if (productoId <= 0 || calificacion < 1 || calificacion > 5) {
    fallar('Producto y calificación (entre 1 y 5 estrellas) son obligatorios')
  }
  const sql = db()
  const [prod] = await sql`select id, nombre from productos where id = ${productoId} and estado = 1`
  if (!prod) fallar('Producto no encontrado', 404)
  const comentario = recortar(datos.comentario, 500)
  const [nueva] = await sql`
    insert into resenas (usuario_id, producto_id, calificacion, comentario)
    values (${usuario.id}, ${productoId}, ${calificacion}, ${comentario})
    returning id`
  await crearNotificacion(
    null,
    `Nueva reseña en ${prod.nombre ?? 'producto #' + productoId}`,
    `${usuario.nombre} dejó ${calificacion}★` + (comentario ? `: "${comentario}"` : ' (sin comentario).'),
    'resena',
    `/producto/${productoId}`
  )
  return resenaFormateada(await resenaPorId(nueva.id))
}

async function resenaPropia(usuario, id) {
  const fila = await resenaPorId(id, usuario.id)
  if (!fila) fallar('No tienes permiso para modificar esta reseña', 404)
  return fila
}

async function editarResena(usuario, id, datos) {
  const fila = await resenaPropia(usuario, id)
  const calificacion = entero(datos.calificacion ?? fila.calificacion)
  if (calificacion < 1 || calificacion > 5) fallar('La calificación debe estar entre 1 y 5 estrellas')
  const comentario = recortar(datos.comentario ?? fila.comentario, 500)
  if (!comentario) fallar('El comentario no puede quedar vacío')
  const sql = db()
  await sql`update resenas set calificacion = ${calificacion}, comentario = ${comentario} where id = ${id}`
  return resenaFormateada(await resenaPropia(usuario, id))
}

async function borrarResena(usuario, id) {
  await resenaPropia(usuario, id)
  const sql = db()
  await sql`delete from resenas where id = ${id}`
}

// ---------------------------------------------------------------------------
//  Vistas y sugerencias
// ---------------------------------------------------------------------------

async function registrarVista(usuario, datos) {
  const pid = entero(datos.producto_id)
  const sql = db()
  const [p] = pid > 0 ? await sql`select 1 as x from productos where id = ${pid} and estado = 1` : []
  if (!p) fallar('Producto no encontrado', 404)
  await sql`
    insert into vistas (usuario_id, producto_id) values (${usuario.id}, ${pid})
    on conflict (usuario_id, producto_id) do update set fecha = now()`
  return {}
}

async function listarVistas(usuario) {
  const sql = db()
  const filas = await sql`
    select producto_id, fecha from vistas where usuario_id = ${usuario.id}
    order by fecha desc, id desc limit 60`
  if (!filas.length) return []
  const prods = await mapaProductos(filas.map((f) => f.producto_id))
  return filas.filter((f) => prods.has(f.producto_id)).map((f) => ({ producto: prods.get(f.producto_id), fecha: f.fecha }))
}

async function sugerenciasUsuario(usuario) {
  const sql = db()
  const cal = await sql`select producto_id, calificacion from resenas where usuario_id = ${usuario.id} order by fecha desc, id desc`
  const vistos = await sql`select distinct producto_id from vistas where usuario_id = ${usuario.id}`
  const ids = [...new Set([...cal.map((f) => f.producto_id), ...vistos.map((f) => f.producto_id)])]
  const prods = await mapaProductos(ids)

  const calificados = cal
    .filter((f) => prods.has(f.producto_id))
    .map((f) => ({ producto: prods.get(f.producto_id), calificacion: Number(f.calificacion) }))
  const cats = [...new Set(ids.map((i) => prods.get(i)?.categoria_id).filter(Boolean))]

  const excluidos = new Set(ids)
  const idsRec = []
  const tomar = (filas) => {
    for (const f of filas) {
      if (idsRec.length >= 12) break
      if (excluidos.has(f.id)) continue
      excluidos.add(f.id)
      idsRec.push(f.id)
    }
  }
  if (cats.length) {
    tomar(await sql`
      select id from productos
      where estado = 1 and stock > 0 and categoria_id = any(${cats}) and id <> all(${ids.length ? ids : [0]})
      order by es_nuevo desc, id desc limit 12`)
  }
  if (idsRec.length < 8) {
    tomar(await sql`
      select id from productos
      where estado = 1 and stock > 0 and id <> all(${[...excluidos].length ? [...excluidos] : [0]})
      order by es_nuevo desc, id desc limit 12`)
  }
  const recs = await mapaProductos(idsRec)
  return { calificados, recomendados: idsRec.map((i) => recs.get(i)).filter(Boolean) }
}

// ---------------------------------------------------------------------------
//  Mensajería
// ---------------------------------------------------------------------------

export function mensajeFormateado(m) {
  return { id: Number(m.id), autor: m.autor, cuerpo: m.cuerpo, fecha: m.fecha }
}

export const recortarTextoMensaje = (t, largo = 1000) => recortar(t, largo)

async function listarMensajesCliente(usuario) {
  const sql = db()
  const filas = await sql`select id, autor, cuerpo, fecha from mensajes where usuario_id = ${usuario.id} order by fecha asc, id asc`
  const [n] = await sql`
    select count(*)::int as n from mensajes
    where usuario_id = ${usuario.id} and autor = 'admin' and leido_cliente = false`
  return { mensajes: filas.map(mensajeFormateado), no_leidos: n.n }
}

async function enviarMensajeCliente(usuario, datos) {
  const cuerpo = recortarTextoMensaje(datos.cuerpo)
  if (!cuerpo) fallar('El mensaje no puede estar vacío')
  const sql = db()
  await sql`insert into mensajes (usuario_id, autor, cuerpo, leido_cliente, leido_admin)
            values (${usuario.id}, 'cliente', ${cuerpo}, true, false)`
  await notificarAdmins(`Nuevo mensaje de ${usuario.nombre}`, recortarTextoMensaje(cuerpo, 180), 'mensaje', '/admin')
  return listarMensajesCliente(usuario)
}

async function marcarMensajesClienteLeidos(usuario) {
  const sql = db()
  await sql`update mensajes set leido_cliente = true where usuario_id = ${usuario.id} and autor = 'admin'`
}

export async function listarConversacionesAdmin(busca = '') {
  const sql = db()
  const b = texto(busca)
  const filas = await sql`
    select u.id, u.nombre, u.correo, l.cuerpo as ultimo, l.fecha as ultima_fecha,
           (select count(*)::int from mensajes m
             where m.usuario_id = u.id and m.autor = 'cliente' and m.leido_admin = false) as sin_leer
    from usuarios u
    join lateral (select cuerpo, fecha from mensajes m where m.usuario_id = u.id
                  order by m.fecha desc, m.id desc limit 1) l on true
    ${b ? sql`where (u.nombre ilike ${like(b)} or u.correo ilike ${like(b)})` : sql``}
    order by l.fecha desc, u.id desc`
  return {
    conversaciones: filas.map((c) => ({
      usuario_id: Number(c.id),
      nombre: c.nombre,
      correo: c.correo,
      ultimo: c.ultimo ?? '',
      fecha: c.ultima_fecha ?? '',
      sin_leer: c.sin_leer,
    })),
  }
}

export async function listarMensajesAdmin(usuarioId) {
  const sql = db()
  const [u] = await sql`select id, nombre, correo from usuarios where id = ${usuarioId}`
  if (!u) fallar('Usuario no encontrado', 404)
  await sql`update mensajes set leido_admin = true where usuario_id = ${usuarioId} and autor = 'cliente'`
  const filas = await sql`select id, autor, cuerpo, fecha from mensajes where usuario_id = ${usuarioId} order by fecha asc, id asc`
  return {
    usuario: { usuario_id: Number(u.id), nombre: u.nombre, correo: u.correo },
    mensajes: filas.map(mensajeFormateado),
  }
}

export async function enviarMensajeAdmin(usuarioId, datos = {}) {
  const cuerpo = recortarTextoMensaje(datos.cuerpo)
  if (!cuerpo) fallar('El mensaje no puede estar vacío')
  const sql = db()
  const [u] = await sql`select id, nombre, correo from usuarios where id = ${usuarioId}`
  if (!u) fallar('Usuario no encontrado', 404)
  await sql`insert into mensajes (usuario_id, autor, cuerpo, leido_cliente, leido_admin)
            values (${usuarioId}, 'admin', ${cuerpo}, false, true)`
  // Aviso al cliente (panel + correo); un fallo de correo no debe romper el envío.
  await crearNotificacion(usuarioId, 'Mensaje de EMI Boutique', cuerpo, 'mensaje', '/perfil?panel=mensajes')
  try {
    await enviarCorreo(
      u.correo,
      'Nuevo mensaje de EMI Boutique',
      plantillaCorreo('Tienes un mensaje nuevo', [cuerpo], 'Ver en mi perfil', enlaceAbsoluto('/perfil?panel=mensajes'))
    )
  } catch (e) {
    console.error('[mensaje] correo', e.message)
  }
  return listarMensajesAdmin(usuarioId)
}

// ---------------------------------------------------------------------------
//  Rutas públicas (el router envuelve el resultado en { ok: true, ...payload })
// ---------------------------------------------------------------------------

const idResena = (ctx) => {
  if (!(ctx.id > 0)) fallar('ID de reseña inválido')
  return ctx.id
}

export const rutas = {
  'GET /carrito': async (ctx) => {
    const u = await requiereUsuario(ctx, 'Debes iniciar sesión para ver tu carrito')
    return { carrito: await carritoUsuario(u) }
  },
  'POST /carrito': async (ctx) => {
    const u = await requiereUsuario(ctx, 'Debes iniciar sesión para guardar el carrito')
    const { datos } = await ctx.cuerpo()
    return { carrito: await guardarCarrito(u, datos) }
  },
  'GET /anuncios': async () => ({ anuncios: await listarAnuncios(true) }),
  'GET /sugerencias': async (ctx) => sugerenciasUsuario(await requiereUsuario(ctx)),
  'GET /vistas': async (ctx) => ({ vistas: await listarVistas(await requiereUsuario(ctx)) }),
  'POST /vistas': async (ctx) => {
    const u = await requiereUsuario(ctx)
    const { datos } = await ctx.cuerpo()
    return registrarVista(u, datos)
  },
  'GET /mensajes': async (ctx) => listarMensajesCliente(await requiereUsuario(ctx)),
  'POST /mensajes': async (ctx) => {
    const u = await requiereUsuario(ctx)
    const { datos } = await ctx.cuerpo()
    return enviarMensajeCliente(u, datos)
  },
  'PATCH /mensajes': async (ctx) => {
    const u = await requiereUsuario(ctx)
    await marcarMensajesClienteLeidos(u)
    return listarMensajesCliente(u)
  },
  'GET /resenas': async (ctx) => {
    const pid = entero(ctx.query.get('producto'))
    if (pid <= 0) fallar('Indica el producto de las reseñas')
    return { resenas: await resenasProducto(pid) }
  },
  'POST /resenas': async (ctx) => {
    const u = await requiereUsuario(ctx, 'Debes iniciar sesión para comentar')
    const { datos } = await ctx.cuerpo()
    return { resena: await agregarResena(u, datos) }
  },
  'PATCH /resenas': async (ctx) => {
    const id = idResena(ctx)
    const u = await requiereUsuario(ctx, 'Debes iniciar sesión para editar')
    const { datos } = await ctx.cuerpo()
    return { resena: await editarResena(u, id, datos) }
  },
  'DELETE /resenas': async (ctx) => {
    const id = idResena(ctx)
    const u = await requiereUsuario(ctx, 'Debes iniciar sesión para eliminar')
    await borrarResena(u, id)
    return {}
  },
}
