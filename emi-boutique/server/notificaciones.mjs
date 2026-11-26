import { db } from './db.mjs'
import { enviarCorreo, plantillaCorreo } from './mail.mjs'
import { enlaceAbsoluto } from './util.mjs'

/** Crea una notificación para un usuario (o para todos los admins si usuarioId es null). */
export async function crearNotificacion(usuarioId, titulo, mensaje, tipo = 'info', enlace = null) {
  try {
    const sql = db()
    await sql`insert into notificaciones (usuario_id, titulo, mensaje, tipo, enlace)
              values (${usuarioId}, ${titulo.slice(0, 150)}, ${mensaje.slice(0, 600)}, ${tipo}, ${enlace})`
  } catch (e) {
    console.error('[notificacion]', e.message) // una notificación no debe romper la operación principal
  }
}

async function correosAdmins() {
  try {
    const sql = db()
    const filas = await sql`select correo from usuarios where rol = 'administrador' and estado = 1`
    return filas.map((f) => f.correo)
  } catch {
    return []
  }
}

/** Notifica a los administradores: panel + correo a cada uno. */
export async function notificarAdmins(titulo, mensaje, tipo = 'info', enlace = null) {
  await crearNotificacion(null, titulo, mensaje, tipo, enlace)
  const html = plantillaCorreo(titulo, [mensaje], enlace ? 'Abrir en el panel' : null, enlaceAbsoluto(enlace))
  const correos = await correosAdmins()
  await Promise.allSettled(correos.map((c) => enviarCorreo(c, titulo, html)))
}

/** Igual que notificarAdmins pero evita repetir el aviso si sigue sin leer. */
export async function notificarAdminsUnico(titulo, mensaje, tipo = 'info', enlace = null) {
  try {
    const sql = db()
    const [x] = await sql`select 1 as x from notificaciones where usuario_id is null and titulo = ${titulo} and leida = false limit 1`
    if (x) return
  } catch {
    /* si falla la comprobación, se crea igual */
  }
  await notificarAdmins(titulo, mensaje, tipo, enlace)
}

/** Notifica (panel + correo) al cliente dueño de un pedido. */
export async function notificarClientePedido(usuarioId, correo, titulo, mensaje, enlace = null) {
  await crearNotificacion(usuarioId, titulo, mensaje, 'pedido', enlace)
  const html = plantillaCorreo(titulo, [mensaje, 'Gracias por preferirnos.'], enlace ? 'Ver en la tienda' : null, enlaceAbsoluto(enlace))
  await enviarCorreo(correo, titulo, html)
}

export async function listarNotificaciones(usuario, todas = false) {
  const sql = db()
  const limite = todas ? 200 : 40
  const esAdmin = usuario.rol === 'administrador'
  const filas = esAdmin
    ? await sql`select id, titulo, mensaje, tipo, enlace, leida, fecha from notificaciones
                where usuario_id is null or usuario_id = ${usuario.id}
                order by fecha desc, id desc limit ${limite}`
    : await sql`select id, titulo, mensaje, tipo, enlace, leida, fecha from notificaciones
                where usuario_id = ${usuario.id}
                order by fecha desc, id desc limit ${limite}`
  const items = filas.map((f) => ({
    id: f.id,
    titulo: f.titulo,
    mensaje: f.mensaje,
    tipo: f.tipo,
    enlace: f.enlace ?? '',
    leida: !!f.leida,
    fecha: f.fecha,
  }))
  return { items, no_leidas: items.filter((i) => !i.leida).length }
}

export async function marcarNotificacionLeida(usuario, id) {
  const sql = db()
  if (usuario.rol === 'administrador') {
    await sql`update notificaciones set leida = true where id = ${id} and (usuario_id is null or usuario_id = ${usuario.id})`
  } else {
    await sql`update notificaciones set leida = true where id = ${id} and usuario_id = ${usuario.id}`
  }
}

export async function marcarTodasLeidas(usuario) {
  const sql = db()
  if (usuario.rol === 'administrador') {
    await sql`update notificaciones set leida = true where usuario_id is null or usuario_id = ${usuario.id}`
  } else {
    await sql`update notificaciones set leida = true where usuario_id = ${usuario.id}`
  }
}
