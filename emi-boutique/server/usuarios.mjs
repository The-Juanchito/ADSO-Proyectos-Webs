// Usuarios: autenticación, registro, recuperación de contraseña, perfil, direcciones y cuentas del equipo.
// Port de las funciones equivalentes de api/index.php (mismos mensajes y mismas formas de respuesta).
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'
import { db } from './db.mjs'
import { fallar } from './http.mjs'
import { texto, recortar, esCorreo, enlaceAbsoluto } from './util.mjs'
import {
  COLUMNAS_USUARIO,
  formatearUsuario,
  hashPassword,
  verificarPassword,
  controlarIntentos,
  verificarGoogle,
  iniciarSesion,
  requiereUsuario,
  cookieBorrar,
} from './auth.mjs'
import { enviarCorreo, plantillaCorreo, mailConfigurado } from './mail.mjs'
import { crearNotificacion } from './notificaciones.mjs'
import { guardarImagen } from './storage.mjs'

const ROLES_USUARIO = ['administrador', 'cliente', 'empleado']
const MIN_PASSWORD = 6
const MAX_PASSWORD = 128

/** Equivalente a empty() de PHP para valores que llegan del cuerpo. */
const vacio = (v) =>
  v === undefined || v === null || v === false || v === 0 || v === '' || v === '0' || (Array.isArray(v) && v.length === 0)

/** Cadena vacía o "0" -> null (como `$x ?: null` de PHP). */
const nuloSiVacio = (v) => (v === '' || v === '0' ? null : v)

/** Solo en desarrollo local se devuelven códigos/enlaces en la respuesta (en producción permitiría robar cuentas). */
const permitirCodigosDev = () => process.env.NETLIFY_DEV === 'true' || process.env.ALLOW_DEV_CODES === '1'

const esDuplicado = (e) => e && e.code === '23505'

function validarPassword(password) {
  if (password.length < MIN_PASSWORD) fallar(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres`, 400)
  if (password.length > MAX_PASSWORD) fallar('La contraseña es demasiado larga', 400)
}

// ---- Login / registro / Google ----------------------------------------------

let hashFalso = null

export async function loginCredenciales(ctx, correo, password) {
  correo = texto(correo)
  password = String(password ?? '')
  const intentos = await controlarIntentos(ctx, correo)
  const sql = db()
  const [u] = await sql`
    select ${sql.unsafe(COLUMNAS_USUARIO)}, password from usuarios
    where lower(correo) = lower(${correo}) and estado = 1`
  // Si el usuario no existe se compara igual contra un hash falso para no revelar la diferencia por tiempo.
  hashFalso ||= await hashPassword('emi-boutique-hash-falso')
  const valido = await verificarPassword(password, u ? u.password : hashFalso)
  if (!u || !valido) {
    await intentos.fallo()
    fallar('Correo o contraseña incorrectos', 401)
  }
  await intentos.exito()
  return formatearUsuario(u)
}

export async function registrarUsuario(datos) {
  const nombre = recortar(datos?.nombre, 150)
  const correo = recortar(datos?.correo, 255).toLowerCase()
  const password = String(datos?.password ?? '')
  if (!nombre || !correo || !password) fallar('Nombre, correo y contraseña son obligatorios', 400)
  if (!esCorreo(correo)) fallar('El correo no es válido', 400)
  validarPassword(password)

  const sql = db()
  const [existe] = await sql`select 1 as x from usuarios where lower(correo) = ${correo}`
  if (existe) fallar('Ya existe una cuenta con ese correo', 409)

  const hash = await hashPassword(password)
  let fila
  try {
    ;[fila] = await sql`
      insert into usuarios (nombre, correo, password, rol) values (${nombre}, ${correo}, ${hash}, 'cliente')
      returning ${sql.unsafe(COLUMNAS_USUARIO)}`
  } catch (e) {
    if (esDuplicado(e)) fallar('Ya existe una cuenta con ese correo', 409)
    throw e
  }
  const usuario = formatearUsuario(fila)

  // Bienvenida (panel + correo) y aviso al administrador
  await crearNotificacion(
    usuario.id,
    '¡Bienvenida a EMI Boutique!',
    `Gracias por crear tu cuenta, ${nombre}. Descubre lo nuevo en nuestra colección.`,
    'info',
    '/catalogo'
  )
  await enviarCorreo(
    correo,
    '¡Bienvenida a EMI Boutique!',
    plantillaCorreo(
      `¡Bienvenida, ${nombre}!`,
      ['Tu cuenta en EMI Boutique ya está lista.', 'Explora nuestras colecciones y guarda tus prendas favoritas.'],
      'Ver catálogo',
      enlaceAbsoluto('/catalogo')
    )
  )
  await crearNotificacion(null, 'Nuevo registro', `${nombre} (${correo}) creó una cuenta.`, 'usuario', '/admin')
  return usuario
}

export async function loginGoogle(credential) {
  const info = await verificarGoogle(String(credential ?? ''))
  if (!info) fallar('No se pudo verificar tu cuenta de Google', 401)

  const sql = db()
  const nombre = (info.name !== '' ? info.name : info.email).slice(0, 150)
  const [u] = await sql`
    select ${sql.unsafe(COLUMNAS_USUARIO)}, estado, google_sub from usuarios
    where google_sub = ${info.sub} or lower(correo) = ${info.email}
    order by (google_sub = ${info.sub}) desc nulls last limit 1`

  if (u) {
    if (Number(u.estado) !== 1) fallar('Tu cuenta está desactivada. Contacta a la tienda.', 403)
    if (u.google_sub && u.google_sub !== info.sub) fallar('No se pudo verificar tu cuenta de Google', 401)
    if (!u.google_sub) await sql`update usuarios set google_sub = ${info.sub} where id = ${u.id}`
    return formatearUsuario(u)
  }

  const hash = await hashPassword(randomBytes(16).toString('hex'))
  try {
    const [nuevo] = await sql`
      insert into usuarios (nombre, correo, password, rol, google_sub)
      values (${nombre}, ${info.email.slice(0, 255)}, ${hash}, 'cliente', ${info.sub})
      returning ${sql.unsafe(COLUMNAS_USUARIO)}`
    return formatearUsuario(nuevo)
  } catch (e) {
    if (esDuplicado(e)) fallar('Ya existe una cuenta con ese correo', 409)
    throw e
  }
}

// ---- Recuperación de contraseña --------------------------------------------

const sha256 = (s) => createHash('sha256').update(s).digest('hex')

async function usuarioActivoPorCorreo(correo) {
  const sql = db()
  const [u] = await sql`select id, correo from usuarios where lower(correo) = lower(${correo}) and estado = 1`
  return u || null
}

/** Enlace de recuperación (1 hora). Siempre responde igual exista o no la cuenta. */
export async function solicitarRecuperacion(correo) {
  correo = recortar(correo, 255)
  const sql = db()
  const u = await usuarioActivoPorCorreo(correo)
  const respuesta = { correo_enviado: mailConfigurado(), link: null }

  if (u) {
    const token = randomBytes(32).toString('hex')
    // Solo se guarda el hash del token: una fuga de la BD no permite restablecer contraseñas.
    await sql`
      insert into recuperaciones (usuario_id, token, usado, expira)
      values (${u.id}, ${sha256(token)}, false, now() + interval '1 hour')`
    const enlace = '/restablecer?token=' + token
    await enviarCorreo(
      u.correo,
      'EMI Boutique · Restablece tu contraseña',
      plantillaCorreo(
        'Restablece tu contraseña',
        [
          'Recibimos una solicitud para cambiar tu contraseña.',
          'Este enlace vence en 1 hora. Si no fuiste tú, ignora este correo.',
        ],
        'Crear nueva contraseña',
        enlaceAbsoluto(enlace)
      )
    )
    if (permitirCodigosDev()) respuesta.link = enlace
  }
  return respuesta
}

export async function restablecerPassword(token, password) {
  token = texto(token)
  password = String(password ?? '')
  if (!token || !password) fallar('El enlace y la nueva contraseña son obligatorios', 400)
  validarPassword(password)
  const hash = await hashPassword(password)
  const sql = db()
  // Marcar como usado y leer el usuario en una sola sentencia: el enlace sirve una única vez.
  const [r] = await sql`
    update recuperaciones set usado = true
    where token = ${sha256(token)} and usado = false and expira > now()
    returning usuario_id`
  if (!r) fallar('El enlace no es válido o ya fue usado', 400)
  await sql`update usuarios set password = ${hash} where id = ${r.usuario_id} and estado = 1`
  await sql`update recuperaciones set usado = true where usuario_id = ${r.usuario_id} and usado = false`
}

/** Código de 6 dígitos (15 minutos). Siempre responde igual exista o no la cuenta. */
export async function solicitarCodigoRecuperacion(correo) {
  correo = recortar(correo, 255)
  if (!esCorreo(correo)) fallar('Escribe un correo electrónico válido', 400)
  const sql = db()
  const u = await usuarioActivoPorCorreo(correo)
  const respuesta = { correo_enviado: mailConfigurado(), codigo: null }

  if (u) {
    const codigo = String(randomInt(0, 1000000)).padStart(6, '0')
    // Un solo código válido por usuario: anulamos los anteriores.
    await sql.begin(async (tx) => {
      await tx`update recuperaciones_codigo set usado = true where usuario_id = ${u.id} and usado = false`
      await tx`
        insert into recuperaciones_codigo (usuario_id, correo, codigo, usado, expira)
        values (${u.id}, ${u.correo.toLowerCase()}, ${codigo}, false, now() + interval '15 minutes')`
    })
    await enviarCorreo(
      u.correo,
      'EMI Boutique · Tu código de recuperación',
      plantillaCorreo(
        'Tu código de recuperación',
        ['Usa este código para restablecer tu contraseña. Vence en 15 minutos.', 'Si no fuiste tú, ignora este correo.'],
        null,
        null
      ) +
        '<div style="text-align:center;margin:8px 0 4px">' +
        '<span style="display:inline-block;font-size:34px;letter-spacing:10px;font-weight:700;color:#c2577d;' +
        'background:#faf6f7;border:1px dashed #e6c9d6;border-radius:14px;padding:14px 22px">' +
        codigo +
        '</span></div>'
    )
    if (permitirCodigosDev()) respuesta.codigo = codigo
  }
  return respuesta
}

export async function restablecerPorCodigo(correo, codigo, password) {
  correo = recortar(correo, 255)
  codigo = texto(codigo)
  password = String(password ?? '')
  if (!correo || !codigo || !password) fallar('Correo, código y nueva contraseña son obligatorios', 400)
  validarPassword(password)

  const sql = db()
  const hash = await hashPassword(password)
  // Transacción con bloqueo de la fila: evita adivinar el código con peticiones en paralelo.
  const resultado = await sql.begin(async (tx) => {
    const [fila] = await tx`
      select id, usuario_id, codigo, intentos from recuperaciones_codigo
      where lower(correo) = lower(${correo}) and usado = false and expira > now()
      order by fecha_creacion desc, id desc limit 1 for update`
    if (!fila) return 'expirado'
    if (fila.intentos >= 5) {
      await tx`update recuperaciones_codigo set usado = true where id = ${fila.id}`
      return 'intentos'
    }
    const a = Buffer.from(String(fila.codigo))
    const b = Buffer.from(codigo)
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      await tx`update recuperaciones_codigo set intentos = intentos + 1 where id = ${fila.id}`
      return 'incorrecto'
    }
    await tx`update recuperaciones_codigo set usado = true where id = ${fila.id}`
    await tx`update usuarios set password = ${hash} where id = ${fila.usuario_id} and estado = 1`
    return 'ok'
  })
  if (resultado === 'expirado') fallar('El código expiró o no es válido. Solicita uno nuevo', 400)
  if (resultado === 'intentos') fallar('Demasiados intentos. Solicita un código nuevo', 400)
  if (resultado === 'incorrecto') fallar('El código no es correcto', 400)
}

// ---- Perfil ------------------------------------------------------------------

export async function perfilUsuario(id) {
  const sql = db()
  const [f] = await sql`select ${sql.unsafe(COLUMNAS_USUARIO)} from usuarios where id = ${Number(id)}`
  if (!f) fallar('Usuario no encontrado', 404)
  return formatearUsuario(f)
}

export async function actualizarPerfil(usuario, datos = {}, archivos = {}) {
  const sql = db()
  const nombre = recortar(datos.nombre ?? usuario.nombre, 150)
  const telefono = recortar(datos.telefono, 30)
  const direccion = recortar(datos.direccion, 255)
  const direccionInfo = recortar(datos.direccion_info, 255)
  const ciudad = recortar(datos.ciudad, 100)
  const correo = recortar(datos.correo ?? usuario.correo, 255).toLowerCase()

  if (!nombre || !correo) fallar('Nombre y correo son obligatorios', 400)
  if (!esCorreo(correo)) fallar('El correo no es válido', 400)

  const [existe] = await sql`select 1 as x from usuarios where lower(correo) = ${correo} and id <> ${usuario.id}`
  if (existe) fallar('Ya existe una cuenta con ese correo', 409)

  // Si no se envía foto nueva se conserva la actual; un perfil_img vacío la quita (igual que PHP).
  const [actual] = await sql`select perfil_img from usuarios where id = ${usuario.id}`
  let perfilImg = actual?.perfil_img ?? ''
  const archivo = archivos?.perfil_img?.[0]
  if (archivo) {
    perfilImg = await guardarImagen(archivo)
  } else if ('perfil_img' in datos && String(datos.perfil_img ?? '') === '') {
    perfilImg = ''
  }

  try {
    await sql`
      update usuarios set nombre = ${nombre}, correo = ${correo}, telefono = ${telefono}, direccion = ${direccion},
        direccion_info = ${direccionInfo}, ciudad = ${ciudad}, perfil_img = ${perfilImg}
      where id = ${usuario.id}`
  } catch (e) {
    if (esDuplicado(e)) fallar('Ya existe una cuenta con ese correo', 409)
    throw e
  }
  return perfilUsuario(usuario.id)
}

// ---- Direcciones ------------------------------------------------------------

export function direccionFormateada(d) {
  return {
    id: Number(d.id),
    alias: (d.alias ?? '') !== '' ? d.alias : 'Dirección',
    direccion: d.direccion ?? '',
    direccion_info: d.direccion_info ?? '',
    ciudad: d.ciudad ?? '',
    telefono: d.telefono ?? '',
    predeterminada: !!d.predeterminada,
  }
}

export async function listarDirecciones(usuario) {
  const sql = db()
  const filas = await sql`
    select id, alias, direccion, direccion_info, ciudad, telefono, predeterminada
    from direcciones where usuario_id = ${usuario.id} and activo = true
    order by predeterminada desc, id asc`
  return filas.map(direccionFormateada)
}

export async function direccionDelUsuario(usuario, id) {
  const sql = db()
  const [d] = await sql`
    select id, usuario_id, alias, direccion, direccion_info, ciudad, telefono, predeterminada
    from direcciones where id = ${Number(id)} and usuario_id = ${usuario.id} and activo = true`
  if (!d) fallar('Dirección no encontrada', 404)
  return d
}

export async function crearDireccion(usuario, datos = {}) {
  const direccion = recortar(datos.direccion, 255)
  if (direccion === '') fallar('Escribe la dirección de envío', 400)
  const alias = recortar(datos.alias, 60)
  const ciudad = recortar(datos.ciudad, 120)
  const info = recortar(datos.direccion_info, 255)
  const telefono = recortar(datos.telefono, 30)
  let predet = !vacio(datos.predeterminada)

  const sql = db()
  await sql.begin(async (tx) => {
    // Bloquea al usuario para serializar altas simultáneas (la primera dirección siempre es la predeterminada).
    await tx`select id from usuarios where id = ${usuario.id} for update`
    const [{ n }] = await tx`select count(*)::int as n from direcciones where usuario_id = ${usuario.id} and activo = true`
    if (n === 0) predet = true
    if (predet) await tx`update direcciones set predeterminada = false where usuario_id = ${usuario.id} and activo = true`
    await tx`
      insert into direcciones (usuario_id, alias, direccion, direccion_info, ciudad, telefono, predeterminada)
      values (${usuario.id}, ${nuloSiVacio(alias)}, ${direccion}, ${nuloSiVacio(info)}, ${nuloSiVacio(ciudad)},
              ${nuloSiVacio(telefono)}, ${predet})`
  })
  return { direcciones: await listarDirecciones(usuario) }
}

export async function actualizarDireccion(usuario, id, datos = {}) {
  const actual = await direccionDelUsuario(usuario, id)
  const tiene = (k) => Object.prototype.hasOwnProperty.call(datos, k)

  const direccion = tiene('direccion') ? recortar(datos.direccion, 255) : String(actual.direccion)
  if (direccion === '') fallar('Escribe la dirección de envío', 400)
  const alias = tiene('alias') ? recortar(datos.alias, 60) : String(actual.alias ?? '')
  const ciudad = tiene('ciudad') ? recortar(datos.ciudad, 120) : String(actual.ciudad ?? '')
  const info = tiene('direccion_info') ? recortar(datos.direccion_info, 255) : String(actual.direccion_info ?? '')
  const telefono = tiene('telefono') ? recortar(datos.telefono, 30) : String(actual.telefono ?? '')
  const predet = tiene('predeterminada') ? !vacio(datos.predeterminada) : !!actual.predeterminada

  const sql = db()
  await sql.begin(async (tx) => {
    if (predet) await tx`update direcciones set predeterminada = false where usuario_id = ${usuario.id} and activo = true`
    await tx`
      update direcciones set alias = ${nuloSiVacio(alias)}, direccion = ${direccion}, direccion_info = ${nuloSiVacio(info)},
        ciudad = ${nuloSiVacio(ciudad)}, telefono = ${nuloSiVacio(telefono)}, predeterminada = ${predet}
      where id = ${Number(id)} and usuario_id = ${usuario.id}`
  })
  return { direcciones: await listarDirecciones(usuario) }
}

export async function eliminarDireccion(usuario, id) {
  const actual = await direccionDelUsuario(usuario, id)
  const sql = db()
  // Baja lógica: conserva el histórico de pedidos que referencian la dirección
  await sql.begin(async (tx) => {
    await tx`update direcciones set activo = false, predeterminada = false where id = ${Number(id)} and usuario_id = ${usuario.id}`
    if (actual.predeterminada) {
      await tx`
        update direcciones set predeterminada = true
        where id = (select id from direcciones where usuario_id = ${usuario.id} and activo = true order by id asc limit 1)`
    }
  })
  return { direcciones: await listarDirecciones(usuario) }
}

// ---- Administración de cuentas ---------------------------------------------

export async function buscarUsuariosAdmin(q) {
  q = recortar(q, 100)
  const sql = db()
  const patron = '%' + q.replace(/[\\%_]/g, '\\$&') + '%'
  const filas =
    q === ''
      ? await sql`select id, nombre, correo from usuarios where estado = 1 order by nombre limit 20`
      : await sql`
          select id, nombre, correo from usuarios
          where estado = 1 and (nombre ilike ${patron} or correo ilike ${patron})
          order by nombre limit 20`
  return filas.map((u) => ({ usuario_id: Number(u.id), nombre: u.nombre, correo: u.correo }))
}

export async function contarAdmins(cliente = db()) {
  const [r] = await cliente`select count(*)::int as n from usuarios where rol = 'administrador' and estado = 1`
  return r.n
}

export async function listarCuentasAdmin() {
  const sql = db()
  const filas = await sql`
    select id, nombre, correo, rol, estado, fecha_registro from usuarios
    order by case rol when 'administrador' then 1 when 'empleado' then 2 else 3 end, nombre`
  return filas.map((u) => ({
    id: Number(u.id),
    nombre: u.nombre,
    correo: u.correo,
    rol: u.rol,
    estado: Number(u.estado),
    fecha: u.fecha_registro ?? '',
  }))
}

export async function crearCuentaAdmin(datos = {}) {
  const nombre = recortar(datos.nombre, 150)
  const correo = recortar(datos.correo, 255).toLowerCase()
  const password = String(datos.password ?? '')
  const rol = texto(datos.rol ?? 'empleado').toLowerCase()

  if (!nombre || !correo || !password) fallar('Nombre, correo y contraseña son obligatorios', 400)
  if (!esCorreo(correo)) fallar('El correo no es válido', 400)
  validarPassword(password)
  if (!ROLES_USUARIO.includes(rol)) fallar('Rol inválido', 400)

  const sql = db()
  const [existe] = await sql`select 1 as x from usuarios where lower(correo) = ${correo}`
  if (existe) fallar('Ya existe una cuenta con ese correo', 409)

  const hash = await hashPassword(password)
  try {
    await sql`insert into usuarios (nombre, correo, password, rol) values (${nombre}, ${correo}, ${hash}, ${rol})`
  } catch (e) {
    if (esDuplicado(e)) fallar('Ya existe una cuenta con ese correo', 409)
    throw e
  }
  await crearNotificacion(null, 'Nueva cuenta del equipo', `${nombre} (${correo}) fue registrada como ${rol}.`, 'usuario', '/admin')
  return listarCuentasAdmin()
}

export async function actualizarCuentaAdmin(actor, id, datos = {}) {
  id = Number(id)
  const sql = db()
  const tiene = (k) => Object.prototype.hasOwnProperty.call(datos, k)

  let hash = null
  if (!vacio(datos.password)) {
    const password = String(datos.password)
    validarPassword(password)
    hash = await hashPassword(password)
  }

  await sql.begin(async (tx) => {
    // Se bloquean los administradores activos para que dos cambios simultáneos no dejen la tienda sin admin.
    await tx`select id from usuarios where rol = 'administrador' and estado = 1 for update`
    const [actual] = await tx`select id, rol, estado from usuarios where id = ${id} for update`
    if (!actual) fallar('Cuenta no encontrada', 404)
    const eraAdminActivo = actual.rol === 'administrador' && Number(actual.estado) === 1

    const cambios = {}
    if (tiene('rol')) {
      const rol = texto(datos.rol).toLowerCase()
      if (!ROLES_USUARIO.includes(rol)) fallar('Rol inválido', 400)
      if (eraAdminActivo && rol !== 'administrador' && (await contarAdmins(tx)) <= 1) {
        fallar('Debe existir al menos un administrador', 400)
      }
      cambios.rol = rol
    }
    if (tiene('estado')) {
      const estado = !vacio(datos.estado) ? 1 : 0
      if (eraAdminActivo && estado === 0 && (await contarAdmins(tx)) <= 1) {
        fallar('No puedes desactivar al último administrador', 400)
      }
      cambios.estado = estado
    }
    if (hash) cambios.password = hash

    const columnas = Object.keys(cambios)
    if (columnas.length) await tx`update usuarios set ${tx(cambios, columnas)} where id = ${id}`
  })
  return listarCuentasAdmin()
}

// ---- Rutas -------------------------------------------------------------------

const idDireccion = (ctx) => {
  if (!/^\d+$/.test(String(ctx.seg?.[1] ?? ''))) fallar('ID de dirección inválido', 400)
  return Number(ctx.seg[1])
}

export const rutas = {
  'POST /login': async (ctx) => {
    const { datos } = await ctx.cuerpo()
    if (vacio(datos.correo) || vacio(datos.password)) fallar('Correo y contraseña son obligatorios', 400)
    const usuario = await loginCredenciales(ctx, datos.correo, datos.password)
    await iniciarSesion(ctx, usuario)
    return { usuario }
  },

  'POST /registro': async (ctx) => {
    const { datos } = await ctx.cuerpo()
    if (vacio(datos.nombre) || vacio(datos.correo) || vacio(datos.password)) {
      fallar('Nombre, correo y contraseña son obligatorios', 400)
    }
    const usuario = await registrarUsuario(datos)
    await iniciarSesion(ctx, usuario)
    return { usuario }
  },

  'POST /auth': async (ctx) => {
    if (ctx.seg?.[1] !== 'google') fallar('Ruta no encontrada', 404)
    const { datos } = await ctx.cuerpo()
    const cred = texto(datos.credential)
    if (cred === '') fallar('Falta el token de Google', 400)
    const usuario = await loginGoogle(cred)
    await iniciarSesion(ctx, usuario)
    return { usuario }
  },

  'GET /logout': async (ctx) => {
    ctx.cookies.push(cookieBorrar(ctx.req))
    return {}
  },

  'POST /recuperar': async (ctx) => {
    const { datos } = await ctx.cuerpo()
    const correo = texto(datos.correo)
    if (correo === '') fallar('Escribe tu correo electrónico', 400)
    return await solicitarRecuperacion(correo)
  },

  'POST /restablecer': async (ctx) => {
    const { datos } = await ctx.cuerpo()
    if (vacio(datos.token) || vacio(datos.password)) fallar('El enlace y la nueva contraseña son obligatorios', 400)
    await restablecerPassword(datos.token, datos.password)
    return {}
  },

  'POST /recuperar-codigo': async (ctx) => {
    const { datos } = await ctx.cuerpo()
    return await solicitarCodigoRecuperacion(texto(datos.correo))
  },

  'POST /restablecer-codigo': async (ctx) => {
    const { datos } = await ctx.cuerpo()
    await restablecerPorCodigo(datos.correo, datos.codigo, datos.password)
    return {}
  },

  'GET /perfil': async (ctx) => {
    const u = await requiereUsuario(ctx)
    return { perfil: await perfilUsuario(u.id) }
  },

  'POST /perfil': async (ctx) => {
    const u = await requiereUsuario(ctx)
    const { datos, archivos } = await ctx.cuerpo()
    return { perfil: await actualizarPerfil(u, datos, archivos) }
  },

  'GET /direcciones': async (ctx) => {
    const u = await requiereUsuario(ctx)
    return { direcciones: await listarDirecciones(u) }
  },

  'POST /direcciones': async (ctx) => {
    const u = await requiereUsuario(ctx)
    const { datos } = await ctx.cuerpo()
    return await crearDireccion(u, datos)
  },

  'PATCH /direcciones': async (ctx) => {
    const u = await requiereUsuario(ctx)
    const id = idDireccion(ctx)
    const { datos } = await ctx.cuerpo()
    return await actualizarDireccion(u, id, datos)
  },

  'DELETE /direcciones': async (ctx) => {
    const u = await requiereUsuario(ctx)
    return await eliminarDireccion(u, idDireccion(ctx))
  },
}
