import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../context/StoreContext' 
import { api } from '../services/api'
import ProductCard from '../components/ProductCard'
import ScrollReveal from '../components/ScrollReveal'

export default function Catalogo() {
  const { categorias, products: fallback } = useStore()
  // Filtros de la URL (categoría seleccionada)
  const [params, setParams] = useSearchParams()
  const active = params.get('cat') || ''
  // Búsqueda por texto y listado visible
  const [search, setSearch] = useState('')
  const [listado, setListado] = useState([])
  const [cargando, setCargando] = useState(true)
  const [offline, setOffline] = useState(false)

  const setCategory = (cat) => setParams(cat ? { cat } : {})

  // La búsqueda se hace contra la API (PHP + base de datos) con debounce.
  useEffect(() => {
    let activo = true
    const timer = setTimeout(async () => {
      setCargando(true)
      try {
        const { productos } = await api.productos({ q: search, cat: active })
        if (activo) {
          setListado(productos)
          setOffline(false)
        }
      } catch {
        // Sin backend: filtramos localmente para que siga funcionando2.
        const filtrados = fallback.filter((p) => {
          const matchCat = !active || p.categoria === active
          const matchSearch =
            !search || p.nombre.toLowerCase().includes(search.toLowerCase())
          return matchCat && matchSearch
        })
        if (activo) {
          setListado(filtrados)
          setOffline(true)
        }
      } finally {
        if (activo) setCargando(false)
      }
    }, 400)
    return () => {
      activo = false
      clearTimeout(timer)
    }
  }, [search, active, fallback])

  return (
    <div className="catalog-page">
      {/* Encabezado */}
      <header className="page-hero">
        <span className="crumb">Catálogo</span>
        <h1>Nuestra Colección</h1>
        <p>Explora todas las prendas disponibles y encuentra la pieza perfecta.</p>
      </header>

      {/* Filtros: búsqueda y categorías */}
      <div className="filters">
        <div className="search">
          <input
            type="search"
            placeholder="Buscar por nombre, descripción o categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className={!active ? 'on' : ''} onClick={() => setCategory('')}>
          Todas
        </button>
        {categorias.map((c) => (
          <button
            key={c}
            className={active === c ? 'on' : ''}
            onClick={() => setCategory(active === c ? '' : c)}
          >
            {c}
          </button>
        ))}
      </div>

      {offline && (
        <p className="empty" style={{ textAlign: 'center' }}>
          ⚠️ No se pudo conectar con la API (revisa `npm run api`). Mostrando datos locales.
        </p>
      )}

      {/* Cuadrícula de productos */}
      <ScrollReveal className={`grid ${cargando ? 'cargando' : ''}`}>
        {cargando ? (
          <div className="empty">Buscando...</div>
        ) : listado.length ? (
          listado.map((p) => <ProductCard key={p.id} product={p} />)
        ) : (
          <div className="empty">No encontramos productos con esos filtros.</div>
        )}
      </ScrollReveal>
    </div>
  )
}