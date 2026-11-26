// Pruebas de extremo a extremo de la API contra un Postgres real.
//   DATABASE_URL=postgres://postgres@localhost:5433/emi_test npm run test:api
import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

process.env.DATABASE_SSL = 'off'
process.env.SESSION_SECRET = process.env.SESSION_SECRET || '0123456789abcdef0123456789abcdef'
process.env.MAIL_CAPTURE = '1'
process.env.SITE_URL = 'https://tienda.test'
process.env.SUPABASE_URL = 'https://proyecto.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
if (!process.env.DATABASE_URL) throw new Error('Define DATABASE_URL para correr las pruebas')

const { manejar } = await import('../server/router.mjs')
const { db, cerrarDb } = await import('../server/db.mjs')
const { bandeja } = await import('../server/mail.mjs')
const sql = db()

// ---- utilidades -----------------------------------------------------------
class Cliente {
  cookie = ''
  async pedir(metodo, ruta, cuerpo, extra = {}) {
    const headers = { ...(cuerpo !== undefined && !(cuerpo instanceof FormData) ? { 'content-type': 'application/json' } : {}), ...extra }
    if (this.cookie) headers.cookie = this.cookie
    const res = await manejar(new Request(`https://tienda.test/api${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo === undefined ? undefined : cuerpo instanceof FormData ? cuerpo : JSON.stringify(cuerpo),
    }))
    const sc = res.headers.getSetCookie?.() ?? []
    if (sc.length) this.cookie = sc.map((c) => c.split(';')[0]).join('; ')
    return { status: res.status, data: await res.json() }
  }
  get = (r) => this.pedir('GET', r)
  post = (r, b, h) => this.pedir('POST', r, b ?? {}, h)
  patch = (r, b) => this.pedir('PATCH', r, b ?? {})
  del = (r) => this.pedir('DELETE', r)
}

const sha = (s) => createHash('sha256').update(s).digest('hex')
const sufijo = Date.now().toString(36)
let cat, p1, p2, p3
const cliente = new Cliente()
const admin = new Cliente()
let idCliente

// ---- Wompi simulado -------------------------------------------------------
const wompiTx = new Map() // id -> transacción
const fetchReal = globalThis.fetch
const subidas = []
globalThis.fetch = async (url, init) => {
  const u = String(url)
  if (u.includes('wompi.co')) {
    const m = u.match(/transactions\/([^/?]+)$/)
    if (m) return wompiTx.has(m[1]) ? Response.json({ data: wompiTx.get(m[1]) }) : new Response('{}', { status: 404 })
    const r = new URL(u).searchParams.get('reference')
    return Response.json({ data: [...wompiTx.values()].filter((t) => t.reference === r) })
  }
  if (u.includes('supabase.test/storage')) {
    subidas.push({ url: u, tipo: init.headers['Content-Type'] })
    return new Response('{}', { status: 200 })
  }
  return fetchReal(url, init)
}

test.before(async () => {
  await sql`truncate pagos, detalle_pedido, pedidos, detalle_carrito, carrito, notificaciones, vistas, resenas,
            imagenes_producto, producto_colores, producto_tallas, productos, categorias, direcciones,
            recuperaciones, recuperaciones_codigo, login_intentos, mensajes, anuncios, usuarios restart identity cascade`
  ;[cat] = await sql`insert into categorias (nombre) values (${'Vestidos ' + sufijo}) returning id`
  ;[p1] = await sql`insert into productos (codigo, nombre, descripcion, categoria_id, precio, stock, descuento)
                    values ('A1', 'Vestido rojo', 'x', ${cat.id}, 100000, 5, 20) returning id`
  ;[p2] = await sql`insert into productos (codigo, nombre, descripcion, categoria_id, precio, stock, stock_minimo)
                    values ('A2', 'Blusa blanca', 'x', ${cat.id}, 50000, 2, 1) returning id`
  ;[p3] = await sql`insert into productos (codigo, nombre, descripcion, categoria_id, precio, stock, estado)
                    values ('A3', 'Descontinuado', 'x', ${cat.id}, 30000, 9, 0) returning id`
  await sql`insert into imagenes_producto (producto_id, imagen, principal) values (${p1.id}, 'https://x/y.jpg', 1)`
})
test.after(async () => {
  globalThis.fetch = fetchReal
  await cerrarDb()
})

// ---- catálogo -------------------------------------------------------------
test('salud, catálogo público y 404', async () => {
  const c = new Cliente()
  assert.equal((await c.get('/salud')).data.ok, true)
  const lista = (await c.get('/productos')).data.productos
  assert.equal(lista.length, 2, 'no lista productos dados de baja')
  assert.equal(lista.find((p) => p.id === p1.id).img, 'https://x/y.jpg')
  assert.equal((await c.get(`/productos/${p1.id}`)).data.producto.nombre, 'Vestido rojo')
  assert.equal((await c.get(`/productos/${p3.id}`)).status, 404)
  assert.equal((await c.get('/productos/abc')).status, 400)
  assert.equal((await c.get('/inexistente')).status, 404)
  assert.equal((await c.get('/categorias')).data.categorias.length, 1)
})

test('rechaza escrituras desde otro origen (CSRF)', async () => {
  const r = await new Cliente().post('/login', { correo: 'a@b.co', password: 'x' }, { origin: 'https://malo.example' })
  assert.equal(r.status, 403)
})

// ---- sesión ---------------------------------------------------------------
test('registro, sesión y protección de rutas', async () => {
  assert.equal((await new Cliente().get('/pedidos')).status, 401)
  const r = await cliente.post('/registro', { nombre: 'Ana Prueba', correo: `Ana${sufijo}@Correo.co`, password: 'secreta123' })
  assert.equal(r.status, 200, JSON.stringify(r.data))
  idCliente = r.data.usuario.id
  assert.ok(cliente.cookie.includes('EMISESS='))
  assert.equal((await cliente.get('/perfil')).data.perfil.correo, `ana${sufijo}@correo.co`)
  const mal = await new Cliente().post('/login', { correo: `ana${sufijo}@correo.co`, password: 'incorrecta' })
  assert.equal(mal.status, 401)
  const bien = await new Cliente().post('/login', { correo: `ANA${sufijo}@correo.co`, password: 'secreta123' })
  assert.equal(bien.status, 200)
  // La cookie falsificada no sirve
  const falsa = new Cliente()
  falsa.cookie = 'EMISESS=eyJhbGciOiJIUzI1NiJ9.eyJ1aWQiOjF9.firma'
  assert.equal((await falsa.get('/perfil')).status, 401)
})

test('un cliente no puede entrar a rutas de administración', async () => {
  assert.equal((await cliente.get('/admin/pedidos')).status, 403)
  assert.equal((await cliente.get('/stats')).status, 403)
  assert.equal((await cliente.post('/admin/productos', { nombre: 'x', precio: 5 })).status, 403)
})

// ---- pedido contra entrega ------------------------------------------------
let pedidoEfectivo
test('pedido contra entrega: precios y stock se toman de la BD (con descuento)', async () => {
  const r = await cliente.post('/pedidos', {
    metodo_pago: 'efectivo',
    items: [{ id: p1.id, cantidad: 2, talla: 'M', color: 'Rojo', precio: 1 }, { id: p2.id, cantidad: 1 }],
  })
  assert.equal(r.status, 200, JSON.stringify(r.data))
  const ped = r.data.pedido
  pedidoEfectivo = ped.pedido_id
  assert.equal(ped.subtotal, 250000)
  assert.equal(ped.total, 210000, '2 x 80.000 (con 20% desc.) + 50.000; el precio enviado por el navegador se ignora')
  assert.equal(ped.estado, 'pendiente')
  assert.equal(ped.checkout_url, null)
  assert.equal(ped.detalle.items[0].detalle, 'Talla: M · Color: Rojo')
  const [s] = await sql`select stock from productos where id = ${p1.id}`
  assert.equal(s.stock, 3)
  assert.ok(bandeja.some((m) => /pedido/i.test(m.asunto)), 'envía correo de pedido')
})

test('no se puede comprar más que el stock ni productos dados de baja', async () => {
  const r = await cliente.post('/pedidos', { items: [{ id: p2.id, cantidad: 2 }] })
  assert.equal(r.status, 409)
  assert.match(r.data.error, /stock/i)
  assert.equal((await cliente.post('/pedidos', { items: [{ id: p3.id, cantidad: 1 }] })).status, 400)
  assert.equal((await cliente.post('/pedidos', { items: [] })).status, 400)
  const [s] = await sql`select stock from productos where id = ${p2.id}`
  assert.equal(s.stock, 1, 'el intento fallido no deja stock a medias')
})

test('ATAQUE: pedir "nequi/paypal" ya no regala pedidos pagados', async () => {
  for (const metodo of ['nequi', 'paypal', 'daviplata', 'bancolombia']) {
    const r = await cliente.post('/pedidos', { metodo_pago: metodo, items: [{ id: p1.id, cantidad: 1 }] })
    assert.equal(r.data.pedido.estado, 'pendiente')
    assert.equal(r.data.pedido.metodo_pago, 'efectivo')
    await cliente.patch(`/pedidos/${r.data.pedido.pedido_id}`)
  }
})

test('cancelar un pedido pendiente devuelve el stock; uno ajeno da 404', async () => {
  const otro = new Cliente()
  await otro.post('/registro', { nombre: 'Otro', correo: `otro${sufijo}@correo.co`, password: 'secreta123' })
  assert.equal((await otro.patch(`/pedidos/${pedidoEfectivo}`)).status, 404)
  const antes = (await sql`select stock from productos where id = ${p1.id}`)[0].stock
  const r = await cliente.patch(`/pedidos/${pedidoEfectivo}`)
  assert.equal(r.data.pedido.estado, 'cancelado')
  const despues = (await sql`select stock from productos where id = ${p1.id}`)[0].stock
  assert.equal(despues, antes + 2)
  assert.equal((await cliente.patch(`/pedidos/${pedidoEfectivo}`)).status, 400)
})

// ---- Wompi ----------------------------------------------------------------
test('Wompi desactivado: se informa y no se crea el pedido', async () => {
  delete process.env.WOMPI_PUBLIC_KEY
  assert.equal((await cliente.get('/wompi/config')).data.habilitado, false)
  const r = await cliente.post('/pedidos', { metodo_pago: 'wompi', items: [{ id: p1.id, cantidad: 1 }] })
  assert.equal(r.status, 503)
})

test('Wompi: checkout firmado, webhook, idempotencia y verificación', async () => {
  process.env.WOMPI_PUBLIC_KEY = 'pub_test_ABC'
  process.env.WOMPI_INTEGRITY_SECRET = 'test_integrity_XYZ'
  process.env.WOMPI_EVENTS_SECRET = 'test_events_QWE'
  assert.equal((await cliente.get('/wompi/config')).data.entorno, 'pruebas')

  const r = await cliente.post('/pedidos', { metodo_pago: 'wompi', items: [{ id: p1.id, cantidad: 1 }, { id: p2.id, cantidad: 1 }] })
  assert.equal(r.status, 200, JSON.stringify(r.data))
  const ped = r.data.pedido
  assert.equal(ped.total, 130000)
  assert.equal(ped.estado, 'pendiente')
  assert.match(ped.referencia, /^EMI-\d+-[0-9A-F]{8}$/)
  const url = new URL(ped.checkout_url)
  assert.equal(url.origin + url.pathname, 'https://checkout.wompi.co/p/')
  assert.equal(url.searchParams.get('amount-in-cents'), '13000000')
  assert.equal(url.searchParams.get('currency'), 'COP')
  assert.equal(url.searchParams.get('signature:integrity'), sha(`${ped.referencia}13000000COPtest_integrity_XYZ`))
  assert.equal(url.searchParams.get('redirect-url'), `https://tienda.test/pago/resultado?pedido=${ped.pedido_id}`)

  const evento = (tx, ts = 1700000000) => ({
    event: 'transaction.updated', timestamp: ts, data: { transaction: tx },
    signature: {
      properties: ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'],
      checksum: sha(`${tx.id}${tx.status}${tx.amount_in_cents}${ts}test_events_QWE`),
    },
  })
  const mover = (tx) => admin.constructor === Cliente && new Cliente().post('/wompi/webhook', evento(tx))

  // 1) aviso con firma falsa -> rechazado
  const falso = evento({ id: 'T1', status: 'APPROVED', amount_in_cents: 13000000 })
  falso.signature.checksum = 'x'.repeat(64)
  assert.equal((await new Cliente().post('/wompi/webhook', falso)).status, 401)

  // 2) transacción rechazada: el pedido sigue pendiente y se puede reintentar
  const txMal = { id: 'T1', status: 'DECLINED', reference: ped.referencia, amount_in_cents: 13000000, currency: 'COP' }
  wompiTx.set('T1', txMal)
  assert.equal((await mover(txMal)).status, 200)
  assert.equal((await cliente.get('/pedidos')).data.pedidos.find((x) => x.id === ped.pedido_id).estado, 'pendiente')
  assert.ok((await cliente.post(`/pedidos/${ped.pedido_id}/pagar`)).data.checkout_url.includes(ped.referencia))

  // 3) intento de fraude: aprobada por un monto menor -> NO se marca pagado
  const txBarata = { id: 'T2', status: 'APPROVED', reference: ped.referencia, amount_in_cents: 100000, currency: 'COP' }
  wompiTx.set('T2', txBarata)
  await mover(txBarata)
  assert.equal((await sql`select estado from pedidos where id = ${ped.pedido_id}`)[0].estado, 'pendiente')

  // 4) un aviso falso que dice "aprobada" pero Wompi dice otra cosa -> se ignora (se consulta a Wompi)
  wompiTx.set('T3', { id: 'T3', status: 'PENDING', reference: ped.referencia, amount_in_cents: 13000000, currency: 'COP' })
  await mover({ id: 'T3', status: 'APPROVED', amount_in_cents: 13000000 })
  assert.equal((await sql`select estado from pedidos where id = ${ped.pedido_id}`)[0].estado, 'pendiente')

  // 5) aprobada por el monto correcto -> pagado (dos veces: idempotente)
  const txOk = { id: 'T4', status: 'APPROVED', reference: ped.referencia, amount_in_cents: 13000000, currency: 'COP', payment_method_type: 'NEQUI' }
  wompiTx.set('T4', txOk)
  const antes = bandeja.length
  assert.equal((await mover(txOk)).status, 200)
  assert.equal((await mover(txOk)).status, 200)
  const [fin] = await sql`select p.estado, pg.estado as pago, pg.medio, pg.transaccion_id from pedidos p join pagos pg on pg.pedido_id = p.id where p.id = ${ped.pedido_id}`
  assert.deepEqual({ ...fin }, { estado: 'pagado', pago: 'aprobado', medio: 'NEQUI', transaccion_id: 'T4' })
  assert.equal(bandeja.slice(antes).filter((m) => /Pago aprobado/.test(m.asunto)).length, 1, 'el aviso de pago sale una sola vez')

  // 6) un pedido pagado ya no lo cancela el cliente
  assert.equal((await cliente.patch(`/pedidos/${ped.pedido_id}`)).status, 400)
})

test('Wompi: la página de resultado concilia aunque el webhook no llegue', async () => {
  const r = await cliente.post('/pedidos', { metodo_pago: 'wompi', items: [{ id: p2.id, cantidad: 1 }] })
  const ped = r.data.pedido
  wompiTx.set('T9', { id: 'T9', status: 'APPROVED', reference: ped.referencia, amount_in_cents: 5000000, currency: 'COP' })
  const v = await cliente.get(`/wompi/verificar?pedido=${ped.pedido_id}&id=T9`)
  assert.equal(v.data.estado_transaccion, 'APPROVED')
  assert.equal(v.data.pedido.estado, 'pagado')
  // otro usuario no puede consultar pedidos ajenos
  const intruso = new Cliente()
  await intruso.post('/registro', { nombre: 'Intruso', correo: `intruso${sufijo}@correo.co`, password: 'secreta123' })
  assert.equal((await intruso.get(`/wompi/verificar?pedido=${ped.pedido_id}`)).status, 404)
})

test('Wompi: pedidos sin pagar vencen y devuelven el stock', async () => {
  const [antes] = await sql`select stock from productos where id = ${p1.id}`
  const r = await cliente.post('/pedidos', { metodo_pago: 'wompi', items: [{ id: p1.id, cantidad: 1 }] })
  const id = r.data.pedido.pedido_id
  await sql`update pedidos set fecha_pedido = now() - interval '4 hours' where id = ${id}`
  const lista = (await cliente.get('/pedidos')).data.pedidos
  assert.equal(lista.find((x) => x.id === id).estado, 'cancelado')
  const [despues] = await sql`select stock from productos where id = ${p1.id}`
  assert.equal(despues.stock, antes.stock)
})

// ---- panel del equipo -----------------------------------------------------
test('administrador: pedidos, estados, stock bajo y estadísticas', async () => {
  const { hashPassword } = await import('../server/auth.mjs')
  await sql`insert into usuarios (nombre, correo, password, rol) values ('Jefa', ${`jefa${sufijo}@emi.co`}, ${await hashPassword('claveadmin1')}, 'administrador')`
  assert.equal((await admin.post('/login', { correo: `jefa${sufijo}@emi.co`, password: 'claveadmin1' })).data.usuario.rol, 'administrador')

  const pedidos = (await admin.get('/admin/pedidos')).data.pedidos
  assert.ok(pedidos.length >= 3)
  const efectivo = (await cliente.post('/pedidos', { items: [{ id: p1.id, cantidad: 1 }] })).data.pedido.pedido_id
  assert.equal((await admin.patch(`/admin/pedidos/${efectivo}`, { estado: 'inventado' })).status, 400)
  const e = await admin.patch(`/admin/pedidos/${efectivo}`, { estado: 'enviado', mensaje: 'Sale hoy' })
  assert.equal(e.data.pedido.estado, 'enviado')
  const cancelado = await admin.patch(`/admin/pedidos/${efectivo}`, { estado: 'cancelado' })
  assert.equal(cancelado.data.pedido.estado, 'cancelado')
  assert.equal((await admin.patch(`/admin/pedidos/${efectivo}`, { estado: 'pagado' })).status, 409, 'no se reactiva')

  // un pago Wompi sin aprobar no se puede marcar como pagado a mano
  const w = (await cliente.post('/pedidos', { metodo_pago: 'wompi', items: [{ id: p1.id, cantidad: 1 }] })).data.pedido.pedido_id
  assert.equal((await admin.patch(`/admin/pedidos/${w}`, { estado: 'pagado' })).status, 409)

  const bajo = (await admin.get('/admin/stock-bajo')).data.productos
  assert.ok(bajo.some((p) => p.id === p2.id))
  const st = (await admin.get('/stats')).data
  assert.ok(st.ventas > 0 && st.productos === 2 && Array.isArray(st.ventas_mes))
  assert.equal((await admin.get('/admin/cuentas')).data.cuentas.length >= 2, true)
})

test('administrador: crear producto con imagen sube a Supabase Storage', async () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0])
  const fd = new FormData()
  fd.append('nombre', 'Falda plisada')
  fd.append('precio', '75000')
  fd.append('categoria', 'Faldas')
  fd.append('stock', '7')
  fd.append('tallas', JSON.stringify(['S', 'M']))
  fd.append('colores', JSON.stringify([{ nombre: 'Negro', hex: '#000000' }]))
  fd.append('img', new File([png], 'f.png', { type: 'image/png' }))
  const r = await admin.pedir('POST', '/admin/productos', fd)
  assert.equal(r.status, 200, JSON.stringify(r.data))
  assert.match(r.data.producto.img, /^https:\/\/proyecto\.supabase\.test\/storage\/v1\/object\/public\/emi\/p_[0-9a-f]+\.png$/)
  assert.deepEqual(r.data.producto.tallas, ['S', 'M'])
  assert.equal(subidas.length, 1)

  // un archivo que no es imagen (aunque diga serlo) se rechaza
  const mal = new FormData()
  mal.append('nombre', 'Malo'); mal.append('precio', '1000')
  mal.append('img', new File(['<?php echo 1;'], 'x.png', { type: 'image/png' }))
  assert.equal((await admin.pedir('POST', '/admin/productos', mal)).status, 400)

  const id = r.data.producto.id
  assert.equal((await admin.del(`/admin/productos/${id}`)).data.eliminado, id)
  assert.equal((await new Cliente().get(`/productos/${id}`)).status, 404)
})

test('carrito, reseñas y notificaciones funcionan con sesión', async () => {
  const g = await cliente.post('/carrito', { items: [{ id: p1.id, cantidad: 2, talla: 'M' }] })
  assert.equal(g.status, 200, JSON.stringify(g.data))
  assert.equal((await cliente.get('/carrito')).data.items?.length ?? (await cliente.get('/carrito')).data.carrito?.length, 1)
  const rs = await cliente.post('/resenas', { producto_id: p1.id, calificacion: 5, comentario: 'Hermoso' })
  assert.equal(rs.status, 200, JSON.stringify(rs.data))
  const n = (await admin.get('/notificaciones')).data
  assert.ok(n.items.length > 0 && n.no_leidas > 0)
  assert.equal((await admin.patch('/notificaciones')).data.no_leidas, 0)
})
