import { useState, useEffect, useRef, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { Chart } from 'chart.js/auto'
import { useStore } from '../context/StoreContext'
import { api } from '../services/api'
import { formatoCOP } from '../data/products'
import ScrollReveal from '../components/ScrollReveal'
import CountUp from '../components/CountUp'
import Factura from '../components/Factura'
import MensajesAdmin from '../components/admin/MensajesAdmin'
import AnunciosAdmin from '../components/admin/AnunciosAdmin'
import CuentasAdmin from '../components/admin/CuentasAdmin'

const PALETA = ['#c2577d', '#c9a24b', '#7d5ba6', '#3f8f7c', '#e07a5f', '#4f7fb0', '#8aa45c', '#b5659c', '#6b7f8f']

const ESTADOS = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado']

const MODULOS = [
  { id: 'resumen', icono: 'bi-speedometer2', etiqueta: 'Resumen' },
  { id: 'graficas', icono: 'bi-graph-up-arrow', etiqueta: 'Gráficas' },
  { id: 'pedidos', icono: 'bi-cart-check', etiqueta: 'Pedidos' },
  { id: 'mensajes', icono: 'bi-chat-dots', etiqueta: 'Mensajes' },
  { id: 'anuncios', icono: 'bi-megaphone', etiqueta: 'Anuncios' },
  { id: 'productos', icono: 'bi-grid', etiqueta: 'Tabla de productos' },
  { id: 'nuevo', icono: 'bi-plus-circle', etiqueta: 'Agregar producto' },
  { id: 'stock', icono: 'bi-box-seam', etiqueta: 'Stock' },
  { id: 'cuentas', icono: 'bi-person-badge', etiqueta: 'Cuentas' },
]

const formatFechaHora = (f) => {
  if (!f) return ''
  try {
    return new Date(f).toLocaleString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export default function Admin() {
  const { user, products, categorias, addProduct, deleteProduct, updateProduct } = useStore()
  const [todasCategorias, setTodasCategorias] = useState([])
  const [form, setForm] = useState({
    nombre: '', categoria: categorias[0] || 'Vestidos', precio: '', descripcion: '',
    es_nuevo: false, stock: 10, stock_minimo: 5, descuento: 0,
  })
  const [tallas, setTallas] = useState([])
  const [nuevaTalla, setNuevaTalla] = useState('')
  const [categoriaNueva, setCategoriaNueva] = useState('')
  const [preview, setPreview] = useState('')
  const [msg, setMsg] = useState('')
  const [colores, setColores] = useState([])
  const [nuevoColor, setNuevoColor] = useState({ nombre: '', hex: '#c2577d' })
  const [statsData, setStatsData] = useState(null)
  const [statsError, setStatsError] = useState('')
  const [pedidos, setPedidos] = useState(null)
  const [abiertos, setAbiertos] = useState({})
  const [estadoCambiando, setEstadoCambiando] = useState({})
  const [estadoModal, setEstadoModal] = useState(null)
  const [dirModal, setDirModal] = useState(null)
  const [editando, setEditando] = useState(null)
  const [busca, setBusca] = useState('')
  const [imgs, setImgs] = useState([])
  const [imgsPrev, setImgsPrev] = useState([])
  const [factura, setFactura] = useState(null)
  const [modulo, setModulo] = useState('resumen')
  const [mensajesSinLeer, setMensajesSinLeer] = useState(0)

  const doughnutRef = useRef(null)
  const barrasRef = useRef(null)
  const ventasRef = useRef(null)
  const topRef = useRef(null)

  const cargarStats = () =>
    api
      .stats()
      .then((s) => {
        setStatsData(s)
        setStatsError('')
      })
      .catch((e) => {
        setStatsData(null)
        setStatsError(e.status === 401 || e.status === 403 ? 'sesion' : 'red')
      })

  const cargarMensajesSinLeer = () =>
    api
      .mensajesAdmin()
      .then((r) => setMensajesSinLeer((r.conversaciones || []).reduce((a, c) => a + (c.sin_leer || 0), 0)))
      .catch(() => {})

  useEffect(() => {
    cargarStats()
    api.pedidosAdmin().then((r) => setPedidos(r.pedidos)).catch(() => setPedidos([]))
    api.categorias(true).then((r) => setTodasCategorias(r.categorias.map((x) => x.nombre))).catch(() => {})
    cargarMensajesSinLeer()
  }, [])

  useEffect(() => {
    const refresco = setInterval(() => {
      api.pedidosAdmin().then((r) => setPedidos(r.pedidos)).catch(() => {})
      cargarStats()
      cargarMensajesSinLeer()
    }, 15000)
    return () => clearInterval(refresco)
  }, [])

  useEffect(() => {
    if (!statsData || !doughnutRef.current || !barrasRef.current || !ventasRef.current || !topRef.current) {
      return undefined
    }
    const categorias = statsData.categorias_data || []
    const precios = statsData.precios || []
    const ventasMes = statsData.ventas_mes || []
    const masVendido = statsData.mas_vendido || []

    const dona = new Chart(doughnutRef.current, {
      type: 'doughnut',
      data: {
        labels: categorias.map((c) => c.categoria),
        datasets: [
          {
            label: 'Productos por categoría',
            data: categorias.map((c) => Number(c.total)),
            backgroundColor: categorias.map((_, i) => PALETA[i % PALETA.length]),
            borderWidth: 2,
            borderColor: '#fff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12 } } },
      },
    })

    const ventas = new Chart(ventasRef.current, {
      type: 'line',
      data: {
        labels: ventasMes.map((d) => d.dia),
        datasets: [
          {
            label: 'Ventas del mes',
            data: ventasMes.map((d) => d.ventas),
            borderColor: PALETA[0],
            backgroundColor: 'rgba(194, 87, 125, 0.12)',
            fill: true,
            tension: 0.35,
            pointBackgroundColor: PALETA[0],
            pointRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${formatoCOP(Number(ctx.raw))}`,
            },
          },
        },
        scales: {
          y: { beginAtZero: true, ticks: { callback: (v) => (v >= 1000 ? `${v / 1000}k` : v) }, grid: { color: '#f1e6ea' } },
          x: { ticks: { maxTicksLimit: 10, font: { size: 10 } }, grid: { display: false } },
        },
      },
    })

    const top = new Chart(topRef.current, {
      type: 'bar',
      data: {
        labels: masVendido.map((p) => p.nombre.length > 16 ? p.nombre.slice(0, 15) + '…' : p.nombre),
        datasets: [
          {
            label: 'Unidades vendidas',
            data: masVendido.map((p) => Number(p.cantidad)),
            backgroundColor: PALETA.map((_, i) => PALETA[masVendido.length - 1 - i % PALETA.length]),
            borderRadius: 8,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, ticks: { precision: 0, font: { size: 11 } }, grid: { color: '#f1e6ea' } },
          y: { ticks: { font: { size: 11 } }, grid: { display: false } },
        },
      },
    })

    const barras = new Chart(barrasRef.current, {
      type: 'bar',
      data: {
        labels: precios.map((p) => p.nombre.length > 18 ? p.nombre.slice(0, 17) + '…' : p.nombre),
        datasets: [
          {
            label: 'Precio (COP)',
            data: precios.map((p) => Number(p.precio)),
            backgroundColor: PALETA[0],
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { ticks: { callback: (v) => (v >= 1000 ? `${v / 1000}k` : v) }, grid: { color: '#f1e6ea' } },
          x: { ticks: { font: { size: 10 } }, grid: { display: false } },
        },
      },
    })

    return () => {
      dona.destroy()
      ventas.destroy()
      top.destroy()
      barras.destroy()
    }
  }, [statsData, modulo])

  // Proteger la ruta: solo administradores y empleados
  const esAdmin = user?.rol === 'administrador'
  const esStaff = esAdmin || user?.rol === 'empleado'
  if (!esStaff) {
    return (
      <div className="admin-page">
        <div className="guard">
          <h2>Acceso restringido</h2>
          <p>Esta sección es para el personal de la tienda.</p>
          <Link to="/login" className="btn-primary" style={{ textDecoration: 'none' }}>Ir a iniciar sesión</Link>
        </div>
      </div>
    )
  }

  const modulosVisibles = esAdmin ? MODULOS : MODULOS.filter((m) => m.id !== 'cuentas')

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const setImagenes = (e) => {
    const archivos = Array.from(e.target.files || [])
    const validos = archivos.filter((a) => a.type.startsWith('image/'))
    const invalidos = archivos.length - validos.length
    setImgs(validos)
    setImgsPrev(validos.map((a) => URL.createObjectURL(a)))
    if (invalidos) setMsg(`${invalidos} archivo(s) no eran imagen y se ignoraron.`)
    else setMsg('')
    e.target.value = ''
  }

  const empezarEdicion = (p) => {
    setForm({
      nombre: p.nombre,
      categoria: p.categoria,
      precio: String(p.precio),
      descripcion: p.descripcion || '',
      es_nuevo: Boolean(p.es_nuevo),
      stock: p.stock ?? 10,
      stock_minimo: p.stock_minimo ?? 5,
      descuento: p.descuento ?? 0,
      img: undefined,
    })
    setColores(p.colores || [])
    setTallas(p.tallas || [])
    setNuevaTalla('')
    setPreview(p.img)
    setImgs([])
    setImgsPrev([])
    setEditando(p.id)
    setMsg('')
    irA('nuevo')
  }

  const cancelarEdicion = () => {
    setEditando(null)
    setForm({ nombre: '', categoria: form.categoria, precio: '', descripcion: '', es_nuevo: false, stock: 10, stock_minimo: 5, descuento: 0 })
    setColores([])
    setTallas([])
    setNuevaTalla('')
    setCategoriaNueva('')
    setPreview('')
    setImgs([])
    setImgsPrev([])
    setMsg('')
  }

  const reiniciarForm = (categoria) => {
    setEditando(null)
    setForm({ nombre: '', categoria, precio: '', descripcion: '', es_nuevo: false, stock: 10, stock_minimo: 5, descuento: 0 })
    setPreview('')
    setColores([])
    setTallas([])
    setNuevaTalla('')
    setCategoriaNueva('')
    setImgs([])
    setImgsPrev([])
    setMsg('')
  }

  const agregarColor = () => {
    const nombre = nuevoColor.nombre.trim()
    if (!nombre) return
    setColores((prev) => {
      const hex = nuevoColor.hex.toUpperCase()
      if (prev.some((c) => c.hex === hex)) return prev
      return [...prev, { nombre, hex }]
    })
    setNuevoColor({ nombre: '', hex: '#c2577d' })
  }

  const quitarColor = (hex) => setColores((prev) => prev.filter((c) => c.hex !== hex))

  const agregarTalla = () => {
    const limpia = nuevaTalla.trim()
    if (!limpia) return
    const sep = limpia.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean)
    setTallas((prev) => {
      const unicas = sep.filter((s) => !prev.includes(s))
      return [...prev, ...unicas]
    })
    setNuevaTalla('')
  }

  const quitarTalla = (t) => setTallas((prev) => prev.filter((x) => x !== t))

  const handleAdd = async (e) => {
    e.preventDefault()
    setMsg('')
    if (!form.nombre || !form.precio) return
    const esNuevaCat = form.categoria === '__nueva__'
    const nombreCategoria = esNuevaCat ? categoriaNueva.trim() : form.categoria
    if (esNuevaCat && !nombreCategoria) {
      setMsg('Escribe el nombre de la nueva categoría')
      return
    }
    try {
      const datos = new FormData()
      datos.append('nombre', form.nombre)
      datos.append('categoria', nombreCategoria)
      datos.append('precio', form.precio)
      datos.append('descripcion', form.descripcion || '')
      datos.append('es_nuevo', form.es_nuevo ? '1' : '0')
      datos.append('stock', String(form.stock ?? 10))
      datos.append('stock_minimo', String(form.stock_minimo ?? 5))
      datos.append('descuento', String(form.descuento ?? 0))
      datos.append('tallas', JSON.stringify(tallas))
      imgs.forEach((f) => datos.append('imgs[]', f))
      if (colores.length) datos.append('colores', JSON.stringify(colores))
      if (editando) {
        await updateProduct(editando, datos)
        setMsg('Producto actualizado ✅')
      } else {
        await addProduct(datos)
        setMsg('Producto guardado ✅')
      }
      reiniciarForm(nombreCategoria)
      cargarStats()
    } catch (err) {
      setMsg('Error: ' + (err.message || 'no se pudo guardar'))
    }
  }

  const borrar = async (id) => {
    if (!window.confirm('¿Eliminar este producto?')) return
    try {
      await deleteProduct(id)
      cargarStats()
    } catch (err) {
      alert(err.message || 'No se pudo eliminar')
    }
  }

  const toggleDetalle = (id) => setAbiertos((prev) => ({ ...prev, [id]: !prev[id] }))

  const cambiarEstado = async (id, estado, mensaje = '') => {
    setEstadoCambiando((prev) => ({ ...prev, [id]: true }))
    try {
      const { pedido } = await api.estadoPedido(id, estado, mensaje)
      setPedidos((prev) => prev.map((p) => (p.id === id ? pedido : p)))
      cargarStats()
    } catch (err) {
      alert(err.message || 'No se pudo actualizar el estado')
    } finally {
      setEstadoCambiando((prev) => ({ ...prev, [id]: false }))
    }
  }

  // El trabajador elige el nuevo estado y opcionalmente escribe un mensaje para el cliente.
  const pedirMensajeEstado = (pe, estado) => {
    setEstadoModal({ pedido: pe, estado, mensaje: '' })
  }

  const confirmarEstadoModal = async () => {
    const m = estadoModal
    if (!m) return
    setEstadoModal(null)
    await cambiarEstado(m.pedido.id, m.estado, m.mensaje.trim())
  }

  const stats = statsData
    ? [
        { icono: 'bi-box-seam', valorNum: Number(statsData.productos) || 0, etiqueta: 'Productos activos', cap: 'en el catálogo', accent: 'rosa' },
        { icono: 'bi-boxes', valorNum: Number(statsData.stock_total) || 0, etiqueta: 'Unidades disponibles', cap: 'de inventario', accent: 'menta' },
        { icono: 'bi-people', valorNum: Number(statsData.usuarios) || 0, etiqueta: 'Usuarios', cap: 'cuentas registradas', accent: 'lila' },
        { icono: 'bi-receipt', valorNum: Number(statsData.pedidos) || 0, etiqueta: 'Pedidos', cap: 'recibidos', accent: 'dorado' },
        { icono: 'bi-currency-dollar', valorNum: Number(statsData.ventas) || 0, prefijo: '$', etiqueta: 'Ventas realizadas', cap: 'desde la tienda', accent: 'esmeralda' },
      ]
    : [
        { icono: 'bi-box-seam', valor: products.length, etiqueta: 'Productos activos', cap: 'en el catálogo', accent: 'rosa' },
        { icono: 'bi-boxes', valor: '-', etiqueta: 'Unidades disponibles', cap: 'de inventario', accent: 'menta' },
        { icono: 'bi-people', valor: '-', etiqueta: 'Usuarios', cap: 'cuentas registradas', accent: 'lila' },
        { icono: 'bi-receipt', valor: '-', etiqueta: 'Pedidos', cap: 'recibidos', accent: 'dorado' },
        { icono: 'bi-currency-dollar', valor: '-', etiqueta: 'Ventas realizadas', cap: 'desde la tienda', accent: 'esmeralda' },
      ]

  const categoriasDatos = statsData?.categorias_data || []
  const ventasMes = statsData?.ventas_mes || []
  const masVendido = statsData?.mas_vendido || []
  const ventasMesTotal = ventasMes.reduce((a, d) => a + d.ventas, 0)
  const tituloPrecios =
    categoriasDatos.length && statsData?.precios?.length
      ? `Top ${statsData.precios.length} precios`
      : 'Precios de los productos'

  const filtrados = products.filter((p) => {
    const texto = `${p.nombre} ${p.categoria} ${(p.colores || []).map((c) => c.nombre).join(' ')}`.toLowerCase()
    return texto.includes(busca.trim().toLowerCase())
  })

  const estadoStock = (p) => {
    const st = Number(p.stock)
    const min = Number(p.stock_minimo) || 5
    return st <= 0 ? 'agotado' : st <= min ? 'bajo' : 'ok'
  }

  const productsOrdenados = [...products].sort((a, b) => Number(a.stock) - Number(b.stock))
  const conteoStock = products.reduce(
    (acc, p) => {
      acc[estadoStock(p)] += 1
      return acc
    },
    { ok: 0, bajo: 0, agotado: 0 },
  )
  const stockCriticos = products.filter((p) => estadoStock(p) !== 'ok')

  const totalCats = categoriasDatos.reduce((a, c) => a + Number(c.total), 0)
  const fechaHero = new Date()
    .toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    .replace(/^./, (l) => l.toUpperCase())

  const irA = (m) => {
    setModulo(m)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const irAFormulario = () => irA('nuevo')

  const nombreAdmin = user?.nombre?.split?.(' ')[0] || 'Administradora'

  return (
    <div className="admin-page">
      <header className="page-hero admin-hero">
        <div className="hero-orn orn1" />
        <div className="hero-orn orn2" />
        <div className="hero-in">
          <div className="hero-text">
            <span className="crumb"><i className="bi bi-shield-lock" /> Administración · {fechaHero}</span>
            <h1>Hola, {nombreAdmin}</h1>
            <p>Revisa las ventas, administra los pedidos y gestiona el catálogo de la tienda.</p>
          </div>
          <div className="hero-acciones">
            <button className="accion primario" onClick={irAFormulario}>
              <i className="bi bi-plus-circle" /> Agregar producto
            </button>
            <button className="accion alerta" onClick={() => irA('stock')}>
              <i className="bi bi-box-seam" /> Bajo stock
              {stockCriticos.length > 0 && <span className="accion-badge">{stockCriticos.length}</span>}
            </button>
            <Link to="/" className="accion">
              <i className="bi bi-shop" /> Ver tienda
            </Link>
          </div>
        </div>
      </header>

      {/* Aviso si falló cargar las estadísticas (sesión expirada o sin API) */}
      {statsError && (
        <div className={`stats-error ${statsError === 'sesion' ? 'sesion' : ''}`}>
          {statsError === 'sesion' ? (
            <>
              <i className="bi bi-shield-lock" />
              <p>Tu sesión venció. Vuelve a iniciar sesión para ver el dashboard.</p>
              <Link to="/login" className="btn-primary" style={{ textDecoration: 'none' }}>Iniciar sesión</Link>
            </>
          ) : (
            <>
              <i className="bi bi-wifi-off" />
              <p>No se pudieron cargar las estadísticas. Verifica que la API esté activa y reintenta.</p>
              <button className="btn-primary" onClick={cargarStats}>Reintentar</button>
            </>
          )}
        </div>
      )}

      <div className="admin-layout">
        <aside className="admin-sidenav">
          <span className="nav-titulo">Panel</span>
          {modulosVisibles.map((m) => (
            <button
              key={m.id}
              className={`nav-item ${modulo === m.id ? 'activo' : ''}`}
              onClick={() => irA(m.id)}
            >
              <i className={`bi ${m.icono}`} />
              <span>{m.etiqueta}</span>
              {m.id === 'stock' && stockCriticos.length > 0 && (
                <span className="nav-badge">{stockCriticos.length}</span>
              )}
              {m.id === 'mensajes' && mensajesSinLeer > 0 && (
                <span className="nav-badge">{mensajesSinLeer}</span>
              )}
            </button>
          ))}
        </aside>

        <div className="admin-contenido">
      {/* Tarjetas con las cifras del negocio */}
      {modulo === 'resumen' && (
        <Fragment>
      <ScrollReveal as="div" className="stats">
        {stats.map((s) => (
          <div className={`stat ${s.accent}`} key={s.etiqueta}>
            <span className="stat-ico" aria-hidden="true"><i className={`bi ${s.icono}`} /></span>
            <span className="stat-label">{s.etiqueta}</span>
            <span className="stat-num">
              {s.valorNum !== undefined ? (
                <CountUp target={s.valorNum} prefix={s.prefijo || ''} />
              ) : (
                s.valor
              )}
            </span>
            <span className="stat-cap">{s.cap}</span>
          </div>
        ))}
      </ScrollReveal>

      <ScrollReveal as="div" className="stock-alert-card">
        <div className={`stock-alert ${Number(statsData?.stock_bajo) > 0 ? 'alerta' : 'ok'}`}>
          <i className="bi bi-exclamation-triangle" />
          <div className="sa-texto">
            <h3>
              {Number(statsData?.stock_bajo) > 0
                ? `${statsData.stock_bajo} producto(s) con stock bajo`
                : 'Stock en orden'}
            </h3>
            <p>
              {Number(statsData?.stock_bajo) > 0
                ? 'Hay productos por debajo de su stock mínimo. Revisa la lista y repón inventario.'
                : 'Ningún producto está por debajo de su stock mínimo.'}
            </p>
          </div>
          <button className="btn-save" onClick={() => irA('stock')}>
            <i className="bi bi-box-seam" /> Ver productos con bajo stock
          </button>
        </div>
      </ScrollReveal>
        </Fragment>
      )}

      {/* Gráficas del negocio (categorías, ventas, más vendidos, precios) */}
      {modulo === 'graficas' && (
      <ScrollReveal as="div" className="charts-grid">
        <div className="chart-card cat">
          <div className="chart-head">
            <div className="chart-title">
              <span className="chart-ico"><i className="bi bi-pie-chart-fill" /></span>
              <h2>Productos por categoría</h2>
            </div>
            <span className="chart-sub">Inventario de la tienda</span>
          </div>
          <div className="chart-box">
            <canvas ref={doughnutRef} />
            {!categoriasDatos.length && (
              <div className="chart-null"><i className="bi bi-inbox" /><p>Sin datos todavía</p></div>
            )}
          </div>
        </div>

        <div className="chart-card ventas">
          <div className="chart-head">
            <div className="chart-title">
              <span className="chart-ico"><i className="bi bi-graph-up-arrow" /></span>
              <h2>Ventas del mes</h2>
            </div>
            <span className="chart-sub"><i className="bi bi-calendar3" /> {formatoCOP(ventasMesTotal)}</span>
          </div>
          <div className="chart-box">
            <canvas ref={ventasRef} />
          </div>
        </div>

        <div className="chart-card top">
          <div className="chart-head">
            <div className="chart-title">
              <span className="chart-ico"><i className="bi bi-trophy" /></span>
              <h2>Productos más vendidos</h2>
            </div>
            <span className="chart-sub">Top {masVendido.length}</span>
          </div>
          <div className="chart-box">
            <canvas ref={topRef} />
            {!masVendido.length && (
              <div className="chart-null"><i className="bi bi-emoji-neutral" /><p>Sin ventas todavía</p></div>
            )}
          </div>
        </div>

        <div className="chart-card precios">
          <div className="chart-head">
            <div className="chart-title">
              <span className="chart-ico"><i className="bi bi-coin" /></span>
              <h2>{tituloPrecios}</h2>
            </div>
            <span className="chart-sub">Precio unitario</span>
          </div>
          <div className="chart-box">
            <canvas ref={barrasRef} />
            {!statsData?.precios?.length && (
              <div className="chart-null"><i className="bi bi-coin" /><p>Sin datos de precios</p></div>
            )}
          </div>
        </div>
      </ScrollReveal>
      )}

      {/* Lista de pedidos para gestionar su estado */}
      {modulo === 'pedidos' && (
      <ScrollReveal as="div" className="pedidos-card">
        <div className="table-head">
          <div className="hd-top">
            <h2><i className="bi bi-cart-check" /> Pedidos de clientes</h2>
            <span>{pedidos ? `${pedidos.length} pedidos` : 'Cargando…'}</span>
          </div>
          {pedidos && pedidos.length > 0 && (
            <div className="estado-sum">
              {ESTADOS.map((e) => (
                <span key={e} className={`chip ${e}`}>
                  <b>{pedidos.filter((p) => p.estado === e).length}</b>
                  {e}
                </span>
              ))}
            </div>
          )}
        </div>
        {!pedidos ? (
          <div className="empty">Cargando pedidos…</div>
        ) : pedidos.length === 0 ? (
          <div className="empty">Aún no hay pedidos registrados.</div>
        ) : (
          <div className="scroll">
            <table className="pedidos">
              <thead>
                <tr>
                  <th></th>
                  <th>N°</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Artículos</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((pe) => (
                  <Fragment key={pe.id}>
                    <tr
                      className={abiertos[pe.id] ? 'abierta' : ''}
                      onClick={() => toggleDetalle(pe.id)}
                    >
                      <td>
                        <button className="chevron" onClick={(e) => { e.stopPropagation(); toggleDetalle(pe.id) }} aria-label="Ver detalle">
                          <i className={`bi ${abiertos[pe.id] ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
                          {abiertos[pe.id] ? 'Ocultar' : 'Detalles'}
                        </button>
                      </td>
                      <td className="n">#{pe.id}</td>
                      <td>
                        <strong>{pe.cliente}</strong>
                        <br /><span className="sub">{pe.correo}</span>
                      </td>
                      <td>{formatFechaHora(pe.fecha_pedido)}</td>
                      <td>{pe.items.reduce((a, i) => a + i.cantidad, 0)}</td>
                      <td className="total">{formatoCOP(pe.total)}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <select
                          className={`estado ${pe.estado}`}
                          value={pe.estado}
                          disabled={estadoCambiando[pe.id]}
                          onChange={(e) => {
                            const nuevo = e.target.value
                            if (nuevo === pe.estado) return
                            pedirMensajeEstado(pe, nuevo)
                          }}
                        >
                          {ESTADOS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    {abiertos[pe.id] && (
                      <tr className="detalles">
                        <td colSpan={7}>
                          <p className="pedido-info">
                            <i className="bi bi-basket" /> Pedido #{pe.id}
                            <span className="sub"> · {pe.items.length} productos</span>
                          </p>
                          <div className="pedido-cliente">
                            <div><i className="bi bi-person" /><span>Nombre</span><b>{pe.cliente}</b></div>
                            <div><i className="bi bi-telephone" /><span>Contacto</span><b>{pe.contacto || 'Sin teléfono'}</b></div>
                            <div><i className="bi bi-envelope" /><span>Correo</span><b>{pe.correo}</b></div>
                            <div className="con-boton">
                              <i className="bi bi-geo-alt" />
                              <span>Dirección</span>
                              <b>{pe.ciudad || pe.direccion || 'Sin dirección'}</b>
                              <button type="button" className="btn-dir-completa" onClick={() => setDirModal(pe)}>
                                <i className="bi bi-map" /> Dirección completa
                              </button>
                            </div>
                          </div>
                          <div className="pedido-items">
                            {pe.items.map((it) => (
                              <div className="pedido-item" key={it.producto_id}>
                                <img src={it.img} alt={it.producto} />
                                <div className="mi">
                                  <strong>{it.producto}</strong>
                                  <span>{it.cantidad} × {formatoCOP(it.precio)}</span>
                                  {it.detalle && <span>{it.detalle}</span>}
                                </div>
                                <b>{formatoCOP(it.subtotal)}</b>
                              </div>
                            ))}
                          </div>
                          <div className="pedido-totales">
                            <div><span>Subtotal</span><b>{formatoCOP(pe.subtotal)}</b></div>
                            {Number(pe.descuento) > 0 && (
                              <div><span>Descuento</span><b>−{formatoCOP(pe.descuento)}</b></div>
                            )}
                            {Number(pe.costo_envio) > 0 && (
                              <div><span>Envío</span><b>{formatoCOP(pe.costo_envio)}</b></div>
                            )}
                            <div className="final"><span>Total</span><b>{formatoCOP(pe.total)}</b></div>
                          </div>
                          <div className="det-acciones">
                            <button className="btn-factura" onClick={() => setFactura(pe)}>
                              <i className="bi bi-file-earmark-text" /> Ver factura
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ScrollReveal>
      )}

      {/* Tabla resumen de precios por categoría */}
      {modulo === 'resumen' && (categoriasDatos.length > 0) && (
        <ScrollReveal as="div" className="resumen-tabla">
          <div className="table-head">
            <div className="chart-title">
              <span className="chart-ico"><i className="bi bi-grid-1x2" /></span>
              <h2>Resumen por categoría</h2>
            </div>
            <span className="chart-sub">{totalCats} productos en total</span>
          </div>
          <div className="cat-tabla">
            <div className="cat-grid cat-encabezado">
              <span>Categoría</span>
              <span className="num">Productos</span>
              <span className="num">Precio prom.</span>
              <span className="num">Precio máx.</span>
            </div>
            {categoriasDatos.map((c) => {
              const pct = totalCats ? Math.round((Number(c.total) / totalCats) * 100) : 0
              return (
                <div className="cat-grid cat-fila" key={c.categoria}>
                  <span className="cat-nombre">{c.categoria}</span>
                  <span className="num cat-cant">
                    <span className="mini-track">
                      <span className="mini-fill" style={{ width: `${pct}%` }} title={`${pct}% de los productos`} />
                    </span>
                    <b>{c.total}</b>
                  </span>
                  <span className="num"><i className="bi bi-cash-stack" /> {formatoCOP(Number(c.precio_prom))}</span>
                  <span className="num"><i className="bi bi-arrow-up-circle" /> {formatoCOP(Number(c.precio_max))}</span>
                </div>
              )
            })}
          </div>
        </ScrollReveal>
      )}

      {/* Módulo de control de stock */}
      {modulo === 'stock' && (
        <ScrollReveal as="div" className="stock-card">
          <div className="table-head">
            <h2><i className="bi bi-box-seam" /> Control de stock</h2>
            <span>{products.length} productos registrados</span>
          </div>
          {products.length === 0 ? (
            <div className="empty">No hay productos registrados.</div>
          ) : (
            <>
              <div className="stock-resumen">
                <div className="sr ok"><b>{conteoStock.ok}</b>En orden</div>
                <div className="sr bajo"><b>{conteoStock.bajo}</b>Stock bajo</div>
                <div className="sr agotado"><b>{conteoStock.agotado}</b>Agotados</div>
              </div>
              <div className="scroll">
                <table className="stock-tabla">
                  <thead>
                    <tr>
                      <th>Foto</th>
                      <th>Producto</th>
                      <th>Categoría</th>
                      <th>Stock</th>
                      <th>Stock mín.</th>
                      <th>Estado</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {productsOrdenados.map((p) => {
                      const st = estadoStock(p)
                      return (
                        <tr key={p.id} className={st}>
                          <td><img src={p.img} alt={p.nombre} /></td>
                          <td><strong>{p.nombre}</strong></td>
                          <td>{p.categoria}</td>
                          <td className={`num ${st}`}>{Number(p.stock)}</td>
                          <td>{Number(p.stock_minimo) || 5}</td>
                          <td>
                            <span className={`stock-tag ${st}`}>
                              {st === 'ok' ? 'En orden' : st === 'bajo' ? 'Stock bajo' : 'Agotado'}
                            </span>
                          </td>
                          <td className="actions">
                            <button
                              className="edit"
                              onClick={() => { empezarEdicion(p); irA('nuevo') }}
                              title="Editar producto"
                            >
                              <i className="bi bi-pencil" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </ScrollReveal>
      )}

      {/* Tabla de gestión de productos */}
      {modulo === 'productos' && (
      <ScrollReveal as="div" className="table-card">
          <div className="table-head">
            <h2><i className="bi bi-grid" /> Productos</h2>
            <div className="buscador">
              <i className="bi bi-search" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar producto…"
              />
            </div>
            <span>{busca ? `${filtrados.length} de ${products.length}` : `${products.length} registros`}</span>
          </div>
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Foto</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Stock</th>
                  <th>Colores</th>
                  <th>Precio</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtrados.length === 0 ? (
                  <tr><td colSpan={7} className="empty">No hay productos con «{busca}».</td></tr>
                ) : (
                  filtrados.map((p) => (
                    <tr key={p.id}>
                      <td><img src={p.img} alt={p.nombre} /></td>
                      <td>
                        {p.nombre}
                        {Boolean(p.es_nuevo) && <span className="badge-nuevo">Nuevo</span>}
                      </td>
                      <td>{p.categoria}</td>
                      <td>
                        <span className={`stock-tag ${Number(p.stock) <= 0 ? 'agotado' : Number(p.stock) <= (Number(p.stock_minimo) || 5) ? 'bajo' : ''}`}>
                          {p.stock <= 0 ? 'Agotado' : p.stock}
                        </span>
                        {Number(p.stock) <= (Number(p.stock_minimo) || 5) && Number(p.stock) > 0 && (
                          <span className="sub"> mín {p.stock_minimo}</span>
                        )}
                      </td>
                      <td>
                        <div className="swatches">
                          {(p.colores || []).map((c) => (
                            <span key={c.hex} className="swatch" style={{ background: c.hex }} title={c.nombre} />
                          ))}
                        </div>
                      </td>
                      <td>{formatoCOP(p.precio)}</td>
                      <td className="actions">
                        <button className="edit" onClick={() => empezarEdicion(p)} title="Editar">
                          <i className="bi bi-pencil" />
                        </button>
                        <button className="del" onClick={() => borrar(p.id)} title="Eliminar">
                          <i className="bi bi-trash" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
      </ScrollReveal>
      )}

      {/* Formulario para agregar o editar un producto */}
      {modulo === 'nuevo' && (
        <div className="form-card">
          <div className="form-head">
            <h3><i className={`bi ${editando ? 'bi-pencil' : 'bi-plus-circle'}`} /> {editando ? 'Editar producto' : 'Agregar producto'}</h3>
            {editando && (
              <button type="button" className="btn-cancel-edit" onClick={cancelarEdicion}>
                <i className="bi bi-x" /> Cancelar edición
              </button>
            )}
          </div>
          <form onSubmit={handleAdd}>
            <div className="field">
              <label>Nombre</label>
              <input value={form.nombre} onChange={set('nombre')} placeholder="Ej: Vestido de gala" />
            </div>
            <div className="field">
              <label>Categoría</label>
              <select value={form.categoria} onChange={set('categoria')}>
                {(todasCategorias.length ? todasCategorias : categorias).map((c) => <option key={c} value={c}>{c}</option>)}
                <option value="__nueva__">＋ Crear nueva categoría…</option>
              </select>
            </div>
            {form.categoria === '__nueva__' && (
              <div className="field">
                <label>Nueva categoría</label>
                <input
                  value={categoriaNueva}
                  onChange={(e) => setCategoriaNueva(e.target.value)}
                  placeholder="Ej: Vestidos de Baño, Cardigans, Sets…"
                  autoFocus
                />
              </div>
            )}
            <label className="switch">
              <span className="switch-nuevo"><i className="bi bi-stars" /> Marcar como producto nuevo</span>
              <input
                type="checkbox"
                checked={form.es_nuevo}
                onChange={(e) => setForm((f) => ({ ...f, es_nuevo: e.target.checked }))}
              />
              <span className="slider" />
            </label>
            <div className="field">
              <label>Precio (COP)</label>
              <input type="number" step="100" min="0" value={form.precio} onChange={set('precio')} placeholder="89900" />
            </div>
            <div className="row3">
              <div className="field">
                <label>Stock</label>
                <input type="number" min="0" value={form.stock} onChange={set('stock')} placeholder="10" />
              </div>
              <div className="field">
                <label>Stock mínimo</label>
                <input type="number" min="0" value={form.stock_minimo} onChange={set('stock_minimo')} placeholder="5" />
                <p className="ayuda">Alerta si el stock baja.</p>
              </div>
              <div className="field">
                <label>Descuento (%)</label>
                <input type="number" min="0" max="100" value={form.descuento} onChange={set('descuento')} placeholder="0" />
                <p className="ayuda">0 = sin descuento.</p>
              </div>
            </div>
            <div className="field">
              <label>Descripción</label>
              <textarea
                value={form.descripcion || ''}
                onChange={set('descripcion')}
                placeholder="Describe el producto (opcional)"
                rows={2}
              />
            </div>

            <div className="field">
              <label>Tallas disponibles</label>
              <div className="color-add">
                <input
                  value={nuevaTalla}
                  onChange={(e) => setNuevaTalla(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarTalla() } }}
                  placeholder="Ej: S, M, L, XL"
                />
                <button type="button" className="btn-save mini" onClick={agregarTalla}><i className="bi bi-plus-lg" /></button>
              </div>
              {tallas.length > 0 && (
                <div className="color-list">
                  {tallas.map((t) => (
                    <span key={t} className="color-chip talla">
                      {t}
                      <button type="button" onClick={() => quitarTalla(t)} aria-label={`Quitar talla ${t}`}><i className="bi bi-x" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="field">
              <label>Colores disponibles</label>
              <div className="color-add">
                <input
                  value={nuevoColor.nombre}
                  onChange={(e) => setNuevoColor((nc) => ({ ...nc, nombre: e.target.value }))}
                  placeholder="Ej: Rojo rubí"
                />
                <input
                  type="color"
                  value={nuevoColor.hex}
                  onChange={(e) => setNuevoColor((nc) => ({ ...nc, hex: e.target.value }))}
                  className="color-picker"
                  aria-label="Elegir color"
                />
                <button type="button" className="btn-save mini" onClick={agregarColor}><i className="bi bi-plus-lg" /></button>
              </div>
              {colores.length > 0 && (
                <div className="color-list">
                  {colores.map((c) => (
                    <span key={c.hex} className="color-chip">
                      <i style={{ background: c.hex }} />
                      {c.nombre}
                      <button type="button" onClick={() => quitarColor(c.hex)} aria-label={`Quitar ${c.nombre}`}><i className="bi bi-x" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="field">
              <label>Fotos del producto (elige varias)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={setImagenes}
                className="file-input"
              />
              <p className="ayuda">
                {editando
                  ? 'La primera foto seleccionada reemplaza la principal; el resto se agrega a la galería (las fotos anteriores se conservan).'
                  : 'La primera foto será la principal; puedes elegir varias a la vez.'}
              </p>
              {imgsPrev.length > 0 && (
                <div className="galeria-prev">
                  {imgsPrev.map((u, i) => (
                    <span key={`${u}-${i}`} className={i === 0 ? 'principal' : ''}>
                      <img src={u} alt={`Foto ${i + 1}`} />
                      {i === 0 && <small>Principal</small>}
                    </span>
                  ))}
                </div>
              )}
              {!imgsPrev.length && preview && (
                <img src={preview} alt="Foto actual del producto" className="img-preview" />
              )}
            </div>
            {msg && <p className="msg" style={{ textAlign: 'center' }}>{msg}</p>}
            <button type="submit" className="btn-save">
              <i className={`bi ${editando ? 'bi-check2-square' : 'bi-check2'}`} />
              {editando ? 'Guardar cambios' : 'Guardar producto'}
            </button>
          </form>
        </div>
      )}

      {modulo === 'anuncios' && <AnunciosAdmin />}

      {/* Cuentas del equipo (solo administrador) */}
      {modulo === 'cuentas' && esAdmin && <CuentasAdmin />}

      {/* Mensajería con las clientas */}
      {modulo === 'mensajes' && <MensajesAdmin />}

        </div>
      </div>

      {factura && <Factura pedido={factura} onCerrar={() => setFactura(null)} />}

      {estadoModal && (
        <div className="estado-modal-overlay" onMouseDown={() => setEstadoModal(null)}>
          <div className="estado-modal" onMouseDown={(e) => e.stopPropagation()}>
            <h3>
              <i className="bi bi-arrow-repeat" /> Cambiar estado
            </h3>
            <p className="estado-modal-sub">
              Pedido <b>#{estadoModal.pedido.id}</b> de <b>{estadoModal.pedido.cliente}</b>
            </p>
            <div className="estado-modal-cambio">
              <span className={`etiqueta ${estadoModal.pedido.estado}`}>{estadoModal.pedido.estado}</span>
              <i className="bi bi-arrow-right" />
              <span className={`etiqueta ${estadoModal.estado}`}>{estadoModal.estado}</span>
            </div>
            <div className="field">
              <label htmlFor="msg-estado">
                Mensaje para el cliente <span className="opcional">(opcional)</span>
              </label>
              <textarea
                id="msg-estado"
                rows={3}
                value={estadoModal.mensaje}
                onChange={(e) => setEstadoModal((prev) => ({ ...prev, mensaje: e.target.value }))}
                placeholder={
                  estadoModal.estado === 'cancelado'
                    ? 'Ej: Lo sentimos, tu pedido fue cancelado porque la prenda se agotó. Te ofrecemos un reembolso total.'
                    : 'Ej: Tu pedido ya salió de la tienda, llegará en 2-3 días hábiles.'
                }
                autoFocus
              />
            </div>
            <p className="estado-modal-note">
              <i className="bi bi-bell" /> El cliente recibirá una notificación con este texto.
            </p>
            <div className="estado-modal-acciones">
              <button type="button" className="btn-mini" onClick={() => setEstadoModal(null)}>
                Cancelar
              </button>
              <button type="button" className="btn-mini primario" onClick={confirmarEstadoModal}>
                {estadoCambiando[estadoModal.pedido.id] ? 'Guardando…' : 'Confirmar cambio'}
              </button>
            </div>
          </div>
        </div>
      )}

      {dirModal && (
        <div className="estado-modal-overlay" onMouseDown={() => setDirModal(null)}>
          <div className="estado-modal dir-modal" onMouseDown={(e) => e.stopPropagation()}>
            <h3>
              <i className="bi bi-geo-alt" /> Dirección completa
            </h3>
            <p className="estado-modal-sub">
              Pedido <b>#{dirModal.id}</b> de <b>{dirModal.cliente}</b>
            </p>
            <div className="dir-bloque">
              <div className="dir-linea">
                <i className="bi bi-house-door" />
                <div>
                  <span>Dirección</span>
                  <b>{dirModal.direccion || 'Sin dirección registrada'}</b>
                </div>
              </div>
              <div className="dir-linea">
                <i className="bi bi-info-circle" />
                <div>
                  <span>Información adicional</span>
                  <b>{dirModal.direccion_info || 'Sin información adicional'}</b>
                </div>
              </div>
              <div className="dir-linea">
                <i className="bi bi-buildings" />
                <div>
                  <span>Ciudad</span>
                  <b>{dirModal.ciudad || 'Sin ciudad'}</b>
                </div>
              </div>
            </div>
            <div className="dir-completa-texto">
              <i className="bi bi-signpost-split" />
              <p>
                {[
                  dirModal.direccion,
                  dirModal.direccion_info,
                  dirModal.ciudad,
                ].filter(Boolean).join(', ') || 'Este pedido no tiene dirección registrada.'}
              </p>
            </div>
            <div className="estado-modal-acciones">
              <button type="button" className="btn-mini" onClick={() => setDirModal(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}