import { db } from './db.mjs'
import { fallar } from './http.mjs'
import { bool, entero, texto } from './util.mjs'
import { guardarImagen } from './storage.mjs'

// ---------------------------------------------------------------------------
//  Lectura de productos (una consulta base + colores/tallas/imágenes en lote)
// ---------------------------------------------------------------------------

const COLUMNAS = (sql) => sql`
  p.id, p.codigo, p.nombre, p.descripcion, c.nombre as categoria, c.id as categoria_id,
  p.precio, p.stock, p.stock_minimo, p.es_nuevo, p.descuento,
  (select avg(r.calificacion) from resenas r where r.producto_id = p.id) as promedio,
  (select count(*) from resenas r where r.producto_id = p.id) as num_resenas,
  coalesce((select i.imagen from imagenes_producto i where i.producto_id = p.id
            order by i.principal desc, i.id limit 1), '') as img`

function darForma(f) {
  return {
    id: f.id,
    codigo: f.codigo,
    nombre: f.nombre,
    descripcion: f.descripcion ?? '',
    categoria: f.categoria,
    categoria_id: f.categoria_id,
    precio: f.precio,
    stock: f.stock,
    stock_minimo: f.stock_minimo ?? 5,
    img: f.img,
    descuento: f.descuento ?? 0,
    promedio: Math.round((f.promedio ?? 0) * 10) / 10,
    num_resenas: f.num_resenas ?? 0,
    es_nuevo: f.es_nuevo ?? 0,
  }
}

async function enriquecer(productos, { galeria = false } = {}) {
  if (!productos.length) return productos
  const sql = db()
  const ids = productos.map((p) => p.id)
  const colores = await sql`select producto_id, nombre, hex from producto_colores where producto_id = any(${ids}) order by id`
  const tallas = await sql`select producto_id, nombre from producto_tallas where producto_id = any(${ids}) order by id`
  const imagenes = galeria
    ? await sql`select producto_id, imagen from imagenes_producto where producto_id = any(${ids}) order by principal desc, id`
    : []
  for (const p of productos) {
    p.colores = colores.filter((c) => c.producto_id === p.id).map((c) => ({ nombre: c.nombre, hex: c.hex }))
    p.tallas = tallas.filter((t) => t.producto_id === p.id).map((t) => t.nombre)
    if (galeria) p.imagenes = imagenes.filter((i) => i.producto_id === p.id).map((i) => i.imagen)
  }
  return productos
}

export async function listarProductos(q = null, cat = null) {
  const sql = db()
  const busqueda = texto(q)
  const like = `%${busqueda.replace(/[%_\\]/g, '\\$&')}%`
  const filas = await sql`
    select ${COLUMNAS(sql)}
    from productos p join categorias c on c.id = p.categoria_id
    where p.estado = 1
      ${cat ? sql`and c.nombre = ${cat}` : sql``}
      ${busqueda ? sql`and (p.nombre ilike ${like} or p.descripcion ilike ${like} or c.nombre ilike ${like})` : sql``}
    order by p.fecha_registro desc, p.id desc`
  return enriquecer(filas.map(darForma))
}

/** Detalle de un producto (con galería). `soloActivos` oculta los dados de baja. */
export async function detalleProducto(id, { soloActivos = false } = {}) {
  const r = await productosPorIds([id], { soloActivos, galeria: true })
  return r[0] ?? null
}

/** Varios productos de una sola vez (carrito, vistas, sugerencias). */
export async function productosPorIds(ids, { soloActivos = false, galeria = false } = {}) {
  const lista = [...new Set(ids.map(Number).filter((n) => n > 0))]
  if (!lista.length) return []
  const sql = db()
  const filas = await sql`
    select ${COLUMNAS(sql)}
    from productos p join categorias c on c.id = p.categoria_id
    where p.id = any(${lista}) ${soloActivos ? sql`and p.estado = 1` : sql``}`
  const productos = await enriquecer(filas.map(darForma), { galeria: true })
  if (!galeria) for (const p of productos) delete p.imagenes
  return productos
}

export async function listarCategorias(todas = false) {
  const sql = db()
  return todas
    ? sql`select id, nombre from categorias where estado = 1 order by nombre`
    : sql`select distinct c.id, c.nombre from categorias c
          join productos p on p.categoria_id = c.id
          where c.estado = 1 and p.estado = 1 order by c.nombre`
}

async function categoriaOCrear(nombre) {
  const sql = db()
  const n = texto(nombre) || 'Otros'
  const [c] = await sql`select id, nombre from categorias where lower(nombre) = lower(${n})`
  if (c) return c
  const [nueva] = await sql`insert into categorias (nombre, descripcion, estado) values (${n}, null, 1) returning id, nombre`
  return nueva
}

// ---------------------------------------------------------------------------
//  Administración de productos
// ---------------------------------------------------------------------------

function normalizarTallas(valor) {
  let lista = valor
  if (typeof lista === 'string') {
    try {
      const dec = JSON.parse(lista)
      lista = Array.isArray(dec) ? dec : lista.split(',')
    } catch {
      lista = lista.split(',')
    }
  }
  if (!Array.isArray(lista)) return []
  const salida = []
  for (const t of lista) {
    for (const parte of String(t).split(',')) {
      const n = parte.trim()
      if (n) salida.push(n.slice(0, 40))
    }
  }
  return [...new Set(salida)]
}

function normalizarColores(valor) {
  let lista = valor
  if (typeof lista === 'string') {
    try {
      lista = JSON.parse(lista)
    } catch {
      lista = []
    }
  }
  if (!Array.isArray(lista)) return []
  return lista
    .map((c) => ({ nombre: texto(c?.nombre).slice(0, 50), hex: texto(c?.hex, '#').toUpperCase() }))
    .filter((c) => c.nombre && /^#[0-9A-F]{6}$/.test(c.hex))
}

async function guardarVariantes(tx, id, colores, tallas) {
  await tx`delete from producto_colores where producto_id = ${id}`
  for (const c of normalizarColores(colores)) {
    await tx`insert into producto_colores (producto_id, nombre, hex) values (${id}, ${c.nombre}, ${c.hex})`
  }
  await tx`delete from producto_tallas where producto_id = ${id}`
  for (const t of normalizarTallas(tallas)) {
    await tx`insert into producto_tallas (producto_id, nombre) values (${id}, ${t})`
  }
}

async function subirImagenes(archivos) {
  const principal = archivos.img?.[0] ? await guardarImagen(archivos.img[0]) : ''
  const galeria = []
  for (const f of archivos.imgs ?? []) galeria.push(await guardarImagen(f))
  return { principal, galeria }
}

async function guardarImagenesProducto(tx, id, principal, galeria) {
  let img = principal
  if (!img && galeria.length) img = galeria.shift()
  if (img) {
    await tx`update imagenes_producto set principal = 0 where producto_id = ${id}`
    await tx`insert into imagenes_producto (producto_id, imagen, principal) values (${id}, ${img}, 1)`
  }
  for (const g of galeria) {
    await tx`insert into imagenes_producto (producto_id, imagen, principal) values (${id}, ${g}, 0)`
  }
}

export async function crearProducto(datos, archivos = {}) {
  const nombre = texto(datos.nombre)
  const precio = Number(datos.precio) || 0
  if (!nombre || precio <= 0) fallar('Nombre y precio válido son obligatorios')

  const categoria = await categoriaOCrear(datos.categoria ?? 'Otros')
  const descuento = Math.min(Math.max(entero(datos.descuento), 0), 100)
  const subidas = await subirImagenes(archivos)
  const urlImg = texto(datos.img)
  const sql = db()
  const codigo = `E-${categoria.nombre.toLowerCase().replace(/\s+/g, '')}-${100 + Math.floor(Math.random() * 900)}`

  const id = await sql.begin(async (tx) => {
    const [p] = await tx`
      insert into productos (codigo, nombre, descripcion, categoria_id, precio, stock, stock_minimo, descuento, es_nuevo, estado)
      values (${codigo}, ${nombre}, ${texto(datos.descripcion)}, ${categoria.id}, ${precio},
              ${Math.max(0, entero(datos.stock, 10))}, ${Math.max(0, entero(datos.stock_minimo, 5))},
              ${descuento}, ${bool(datos.es_nuevo) ? 1 : 0}, 1)
      returning id`
    await guardarImagenesProducto(tx, p.id, subidas.principal || urlImg, subidas.galeria)
    await guardarVariantes(tx, p.id, datos.colores ?? [], datos.tallas ?? [])
    return p.id
  })
  return detalleProducto(id)
}

export async function actualizarProducto(id, datos, archivos = {}) {
  const actual = await detalleProducto(id)
  if (!actual) fallar('Producto no encontrado', 404)

  const nombre = texto(datos.nombre)
  const precio = Number(datos.precio) || 0
  if (!nombre || precio <= 0) fallar('Nombre y precio válido son obligatorios')

  const categoria = await categoriaOCrear(datos.categoria ?? actual.categoria)
  const descuento = Math.min(Math.max(entero(datos.descuento ?? actual.descuento), 0), 100)
  const subidas = await subirImagenes(archivos)
  const urlImg = texto(datos.img)
  const sql = db()

  await sql.begin(async (tx) => {
    await tx`
      update productos set nombre = ${nombre},
        descripcion = ${texto(datos.descripcion ?? actual.descripcion)},
        categoria_id = ${categoria.id}, precio = ${precio},
        stock = ${Math.max(0, entero(datos.stock ?? actual.stock))},
        stock_minimo = ${Math.max(0, entero(datos.stock_minimo ?? actual.stock_minimo))},
        descuento = ${descuento},
        es_nuevo = ${bool(datos.es_nuevo ?? !!actual.es_nuevo) ? 1 : 0}
      where id = ${id}`
    // Si solo llega la URL actual (sin foto nueva) no se duplica la imagen.
    const nueva = subidas.principal || (urlImg && urlImg !== actual.img && !actual.imagenes.includes(urlImg) ? urlImg : '')
    await guardarImagenesProducto(tx, id, nueva, subidas.galeria)
    await guardarVariantes(tx, id, datos.colores ?? actual.colores, datos.tallas ?? actual.tallas)
  })
  return detalleProducto(id)
}

export async function eliminarProducto(id) {
  const sql = db()
  await sql`update productos set estado = 0 where id = ${id}`
}

export async function productosBajoStock() {
  const sql = db()
  const filas = await sql`
    select p.id, p.codigo, p.nombre, c.nombre as categoria, p.stock, p.stock_minimo,
           coalesce((select i.imagen from imagenes_producto i where i.producto_id = p.id
                     order by i.principal desc, i.id limit 1), '') as img
    from productos p join categorias c on c.id = p.categoria_id
    where p.estado = 1 and p.stock <= p.stock_minimo
    order by p.stock asc, p.nombre`
  return filas.map((f) => ({ ...f }))
}

// ---------------------------------------------------------------------------
//  Estadísticas del panel
// ---------------------------------------------------------------------------

export async function statsAdmin() {
  const sql = db()
  const [t] = await sql`
    select
      (select count(*) from productos where estado = 1) as productos,
      (select count(*) from usuarios) as usuarios,
      (select count(*) from pedidos) as pedidos,
      (select coalesce(sum(total), 0) from pedidos where estado <> 'cancelado') as ventas,
      (select count(*) from productos where estado = 1 and stock <= stock_minimo) as stock_bajo,
      (select coalesce(sum(stock), 0) from productos where estado = 1) as stock_total,
      (extract(day from (now() at time zone 'America/Bogota')))::int as hoy`
  const categorias_data = await sql`
    select c.nombre as categoria, count(p.id) as total,
           coalesce(avg(p.precio - (p.precio * p.descuento / 100.0)), 0) as precio_prom,
           coalesce(max(p.precio), 0) as precio_max
    from categorias c join productos p on p.categoria_id = c.id and p.estado = 1
    group by c.nombre order by total desc`
  const precios = await sql`select nombre, precio from productos where estado = 1 order by precio desc limit 10`
  const filas = await sql`
    select (extract(day from (fecha_pedido at time zone 'America/Bogota')))::int as dia,
           count(*) as pedidos, coalesce(sum(total), 0) as ventas
    from pedidos
    where estado <> 'cancelado'
      and (fecha_pedido at time zone 'America/Bogota') >= date_trunc('month', now() at time zone 'America/Bogota')
    group by 1 order by 1`
  const mapa = new Map(filas.map((f) => [f.dia, f]))
  const ventas_mes = []
  for (let d = 1; d <= t.hoy; d++) {
    ventas_mes.push({ dia: d, ventas: mapa.get(d)?.ventas ?? 0, pedidos: mapa.get(d)?.pedidos ?? 0 })
  }
  const mas_vendido = await sql`
    select p.nombre, sum(d.cantidad) as cantidad, coalesce(sum(d.subtotal), 0) as ingresos
    from detalle_pedido d
    join pedidos pe on pe.id = d.pedido_id
    join productos p on p.id = d.producto_id
    where pe.estado <> 'cancelado' and p.estado = 1
    group by p.nombre order by cantidad desc, ingresos desc limit 5`
  return {
    productos: t.productos,
    usuarios: t.usuarios,
    pedidos: t.pedidos,
    ventas: t.ventas,
    stock_bajo: t.stock_bajo,
    stock_total: t.stock_total,
    categorias_data,
    precios,
    ventas_mes,
    mas_vendido,
  }
}
