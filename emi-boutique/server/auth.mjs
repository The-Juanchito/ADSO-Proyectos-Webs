import { SignJWT, jwtVerify, createRemoteJWKSet } from 'jose'
import bcrypt from 'bcryptjs'
import { db } from './db.mjs'
import { fallar, HttpError } from './http.mjs'

const COOKIE = 'EMISESS'
const DIAS = 7

function secreto() {
  const s = process.env.SESSION_SECRET
  if (!s || s.length < 32) {
    throw new HttpError(500, 'Falta SESSION_SECRET (mínimo 32 caracteres) en las variables de entorno.')
  }
  return new TextEncoder().encode(s)
}

export const hashPassword = (p) => bcrypt.hash(p, 10)
export const verificarPassword = (p, hash) => bcrypt.compare(p, hash).catch(() => false)

function esHttps(req) {
  return new URL(req.url).protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https'
}

/** Cookie de sesión firmada (JWT). Solo guarda el id del usuario; los datos se leen frescos de la BD. */
export async function cookieSesion(req, usuarioId) {
  const token = await new SignJWT({ uid: usuarioId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${DIAS}d`)
    .sign(secreto())
  return [
    `${COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${DIAS * 86400}`,
    esHttps(req) ? 'Secure' : '',
  ].filter(Boolean).join('; ')
}

export const cookieBorrar = (req) =>
  `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${esHttps(req) ? '; Secure' : ''}`

function leerCookie(req, nombre) {
  const c = req.headers.get('cookie') || ''
  for (const par of c.split(';')) {
    const i = par.indexOf('=')
    if (i > 0 && par.slice(0, i).trim() === nombre) return par.slice(i + 1).trim()
  }
  return null
}

export const COLUMNAS_USUARIO =
  'id, nombre, correo, rol, telefono, direccion, direccion_info, ciudad, perfil_img'

export function formatearUsuario(u) {
  return {
    id: Number(u.id),
    nombre: u.nombre,
    correo: u.correo,
    rol: u.rol,
    telefono: u.telefono ?? '',
    direccion: u.direccion ?? '',
    direccion_info: u.direccion_info ?? '',
    ciudad: u.ciudad ?? '',
    perfil_img: u.perfil_img ?? '',
  }
}

/** Usuario de la sesión actual (o null). Cacheado por petición. */
export async function usuarioActual(ctx) {
  if (ctx._usuario !== undefined) return ctx._usuario
  ctx._usuario = null
  const token = leerCookie(ctx.req, COOKIE)
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secreto(), { algorithms: ['HS256'] })
    const sql = db()
    const [u] = await sql`select ${sql.unsafe(COLUMNAS_USUARIO)} from usuarios where id = ${Number(payload.uid)} and estado = 1`
    ctx._usuario = u ? formatearUsuario(u) : null
  } catch (e) {
    if (e instanceof HttpError) throw e
    ctx._usuario = null
  }
  return ctx._usuario
}

export async function requiereUsuario(ctx, mensaje = 'Debes iniciar sesión') {
  const u = await usuarioActual(ctx)
  if (!u) fallar(mensaje, 401)
  return u
}

export async function requiereStaff(ctx) {
  const u = await usuarioActual(ctx)
  if (!u || !['administrador', 'empleado'].includes(u.rol)) {
    fallar('Acceso no autorizado. Se requiere ser parte del equipo.', 403)
  }
  return u
}

export async function requiereAdmin(ctx) {
  const u = await usuarioActual(ctx)
  if (!u || u.rol !== 'administrador') {
    fallar('Acceso no autorizado. Se requiere sesión de administrador.', 403)
  }
  return u
}

/** Inicia sesión: deja la cookie lista para añadirla a la respuesta. */
export async function iniciarSesion(ctx, usuario) {
  ctx.cookies.push(await cookieSesion(ctx.req, usuario.id))
  ctx._usuario = usuario
}

// ---- Freno a fuerza bruta -------------------------------------------------

const MAX_FALLOS = 8
const VENTANA_MIN = 15

export async function controlarIntentos(ctx, correo) {
  const sql = db()
  const ip = (ctx.req.headers.get('x-nf-client-connection-ip') || ctx.req.headers.get('x-forwarded-for') || '').split(',')[0].trim()
  const claves = [`c:${String(correo).toLowerCase()}`, `i:${ip}`]
  const [r] = await sql`
    select count(*)::int as n from login_intentos
    where clave = any(${claves}) and fecha > now() - make_interval(mins => ${VENTANA_MIN})
    group by clave order by n desc limit 1`
  if ((r?.n ?? 0) >= MAX_FALLOS) {
    fallar('Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo.', 429)
  }
  return {
    fallo: async () => {
      await sql`insert into login_intentos (clave) select unnest(${claves}::text[])`
    },
    exito: async () => {
      await sql`delete from login_intentos where clave = ${claves[0]}`
    },
  }
}

// ---- Google Identity Services --------------------------------------------

const JWKS_GOOGLE = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'))

export function googleClientId() {
  return process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || ''
}

/** Verifica el ID token de Google. Devuelve { sub, email, name } o null. */
export async function verificarGoogle(credential) {
  const cid = googleClientId()
  if (!cid) return null
  try {
    const { payload } = await jwtVerify(credential, JWKS_GOOGLE, {
      issuer: ['accounts.google.com', 'https://accounts.google.com'],
      audience: cid,
    })
    if (payload.email_verified !== true || !payload.email) return null
    return {
      sub: String(payload.sub),
      email: String(payload.email).toLowerCase().trim(),
      name: String(payload.name || '').trim(),
    }
  } catch {
    return null
  }
}
