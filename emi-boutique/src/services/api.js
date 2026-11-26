const base = '/api'

// ---- Petición base (fetch con reintento y manejo de errores) ----
async function request(method, ruta, body, optsChat = {}) {
  const esFormData = typeof FormData !== 'undefined' && body instanceof FormData
  const opts = {
    method,
    credentials: 'include',
    headers: esFormData ? {} : { 'Content-Type': 'application/json' },
  }
  if (body !== undefined) opts.body = esFormData ? body : JSON.stringify(body)

  const { timeout = 0, reintentar = true } = optsChat
  const hacerFetch = async () => {
    if (!timeout) return fetch(base + ruta, opts)
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), timeout)
    try {
      return await fetch(base + ruta, { ...opts, signal: ctrl.signal })
    } finally {
      clearTimeout(t)
    }
  }

  let res
  try {
    res = await hacerFetch()
  } catch (e) {
    if (e?.name === 'AbortError') {
      throw new Error('El asistente está tardando demasiado. Intenta de nuevo. 💕', { cause: e })
    }
    if (!reintentar) throw new Error('Sin conexión con el servidor. Intenta de nuevo en un momento.', { cause: e })
    // Primer intento falló: puede ser un reinicio de la API; reintentamos una vez.
    await new Promise((r) => setTimeout(r, 900))
    try {
      res = await hacerFetch()
    } catch {
      res = null
    }
  }
  if (!res) {
    throw new Error('Sin conexión con el servidor. Revisa tu internet e inténtalo de nuevo.')
  }

  let data = {}
  let esJson = true
  try {
    data = await res.json()
  } catch {
    esJson = false // la respuesta no era JSON (p. ej. el servidor aún no está listo)
  }
  if (res.ok && (!esJson || data === null || typeof data !== 'object' || Array.isArray(data))) {
    const err = new Error('El servidor no respondió como se esperaba. Recarga la página e inténtalo de nuevo.')
    err.status = 502
    throw err
  }

  if (!res.ok) {
    const mensaje =
      data.error ||
      (res.status >= 502
        ? 'El servidor no respondió. Inténtalo de nuevo en unos segundos.'
        : `Error ${res.status}`)
    const err = new Error(mensaje)
    err.status = res.status
    throw err
  }
  return data
}

const get = (ruta) => request('GET', ruta)
const post = (ruta, cuerpo) => request('POST', ruta, cuerpo)

// ---- Endpoints de la API ----
export const api = {
  // Catálogo
  productos: (params = {}) => {
    const qs = new URLSearchParams()
    if (params.q) qs.set('q', params.q)
    if (params.cat) qs.set('cat', params.cat)
    const cadena = qs.toString()
    return get(`/productos${cadena ? `?${cadena}` : ''}`)
  },
  categorias: (todas = false) => get(`/categorias${todas ? '?todas=1' : ''}`),
  producto: (id) => get(`/productos/${id}`),

  // Asistente virtual (chatbot con IA)
  chat: (mensaje, historial = []) => request('POST', '/chat', { mensaje, historial }, { timeout: 30000, reintentar: false }),

  // Reseñas
  resenas: (productoId) => get(`/resenas?producto=${productoId}`),
  addResena: (productoId, calificacion, comentario) =>
    post('/resenas', { producto_id: productoId, calificacion, comentario }),
  editarResena: (id, calificacion, comentario) =>
    request('PATCH', `/resenas/${id}`, { calificacion, comentario }),
  borrarResena: (id) => request('DELETE', `/resenas/${id}`),

  // Autenticación
  login: (correo, password) => post('/login', { correo, password }),
  registro: (nombre, correo, password) => post('/registro', { nombre, correo, password }),
  loginGoogle: (credential) => post('/auth/google', { credential }),
  logout: () => get('/logout'),
  recuperar: (correo) => post('/recuperar', { correo }),
  restablecer: (token, password) => post('/restablecer', { token, password }),
  recuperarCodigo: (correo) => post('/recuperar-codigo', { correo }),
  restablecerCodigo: (correo, codigo, password) => post('/restablecer-codigo', { correo, codigo, password }),

  // Pedidos
  pedido: (items, metodoPago = 'efectivo', direccionId = null) =>
    post('/pedidos', { items, metodo_pago: metodoPago, direccion_id: direccionId }),
  pedidosMios: () => get('/pedidos'),
  cancelarPedido: (id) => request('PATCH', `/pedidos/${id}`),
  // Pagos en línea (Wompi)
  wompiConfig: () => get('/wompi/config'),
  pagarPedido: (id) => post(`/pedidos/${id}/pagar`, {}),
  verificarPago: (pedidoId, transaccionId = '') =>
    get(`/wompi/verificar?pedido=${pedidoId}${transaccionId ? `&id=${encodeURIComponent(transaccionId)}` : ''}`),

  // Carrito (por usuario)
  carrito: () => get('/carrito'),
  guardarCarrito: (items) => post('/carrito', { items }),

  // Perfil
  perfil: () => get('/perfil'),
  guardarPerfil: (datos) => post('/perfil', datos),

  // Direcciones de envío
  direcciones: () => get('/direcciones'),
  crearDireccion: (datos) => post('/direcciones', datos),
  actualizarDireccion: (id, datos) => request('PATCH', `/direcciones/${id}`, datos),
  eliminarDireccion: (id) => request('DELETE', `/direcciones/${id}`),

  // Sugerencias / historial de productos vistos
  sugerencias: () => get('/sugerencias'),
  vistas: () => get('/vistas'),
  registrarVista: (productoId) => post('/vistas', { producto_id: productoId }),

  // Mensajería (cliente <-> administrador)
  mensajes: () => get('/mensajes'),
  enviarMensaje: (cuerpo) => post('/mensajes', { cuerpo }),
  marcarMensajesLeidos: () => request('PATCH', '/mensajes'),
  mensajesAdmin: (q = '') => get(`/admin/mensajes${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  mensajesAdminUsuario: (usuarioId) => get(`/admin/mensajes/${usuarioId}`),
  enviarMensajeAdmin: (usuarioId, cuerpo) => post(`/admin/mensajes/${usuarioId}`, { cuerpo }),
  buscarUsuarios: (q = '') => get(`/admin/usuarios${q ? `?q=${encodeURIComponent(q)}` : ''}`),

  // Notificaciones (panel)
  notificaciones: (todas = false) => get(`/notificaciones${todas ? '?todas=1' : ''}`),
  marcarNotificacion: (id) => request('PATCH', `/notificaciones/${id}`),
  marcarTodasNotificaciones: () => request('PATCH', '/notificaciones'),

  // Anuncios (aviso al iniciar sesión)
  anuncios: () => get('/anuncios'),
  anunciosAdmin: () => get('/admin/anuncios'),
  crearAnuncio: (datos) => post('/admin/anuncios', datos),
  actualizarAnuncio: (id, datos) => request('PATCH', `/admin/anuncios/${id}`, datos),
  borrarAnuncio: (id) => request('DELETE', `/admin/anuncios/${id}`),

  // Administración
  stats: () => get('/stats'),
  crearProducto: (datos) => post('/admin/productos', datos),
  borrarProducto: (id) => request('DELETE', `/admin/productos/${id}`),
  actualizarProducto: (id, datos) => request('PATCH', `/admin/productos/${id}`, datos),
  pedidosAdmin: () => get('/admin/pedidos'),
  stockBajo: () => get('/admin/stock-bajo'),
  estadoPedido: (id, estado, mensaje = '') => request('PATCH', `/admin/pedidos/${id}`, { estado, mensaje }),

  // Cuentas del equipo (solo administrador)
  cuentas: () => get('/admin/cuentas'),
  crearCuenta: (datos) => post('/admin/cuentas', datos),
  actualizarCuenta: (id, datos) => request('PATCH', `/admin/cuentas/${id}`, datos),
}