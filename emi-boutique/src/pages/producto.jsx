import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { api } from '../services/api'
import { formatoCOP, precioFinal } from '../data/products'
import ProductCard from '../components/ProductCard'

// Mercado cruzado: categorías complementarias para cada prenda
const COMPLEMENTO = {
  Vestidos: ['Accesorios', 'Chaquetas', 'Faldas', 'Blusas'],
  Blusas: ['Pantalones', 'Faldas', 'Chaquetas', 'Accesorios'],
  Pantalones: ['Blusas', 'Chaquetas', 'Accesorios'],
  Faldas: ['Blusas', 'Chaquetas', 'Accesorios'],
  Chaquetas: ['Blusas', 'Pantalones', 'Faldas'],
  Accesorios: ['Vestidos', 'Blusas', 'Chaquetas'],
  Pijamas: ['Accesorios'],
}

function Estrellas({ valor }) {
  return (
    <span className="stars" aria-label={`${valor} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= valor ? 'on' : ''}>★</span>
      ))}
    </span>
  )
}

function formatFecha(fecha) {
  if (!fecha) return ''
  try {
    return new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return ''
  }
}

export default function Producto({ id }) {
  const { addToCart, lines, updateQty, updateItem, user, products: fallback } = useStore()
  // Estado: producto, reseñas, selección de talla/color, imagen activa
  const [producto, setProducto] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [resenas, setResenas] = useState([])
  const [resenasCargadas, setResenasCargadas] = useState(false)

  const [selTalla, setSelTalla] = useState('')
  const [selColor, setSelColor] = useState('')

  const [cal, setCal] = useState(5)
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [editandoResena, setEditandoResena] = useState(null)
  const [imagenActiva, setImagenActiva] = useState('')
  const [imagenOrigen, setImagenOrigen] = useState(null)

  if (imagenOrigen !== producto) {
    setImagenActiva('')
    setImagenOrigen(producto)
  }

  useEffect(() => {
    let activo = true

    const cargar = async () => {
      try {
        const { producto: p } = await api.producto(id)
        if (activo) setProducto(p)
      } catch {
        const local = fallback.find((f) => f.id === id) || null
        if (activo) setProducto(local)
      } finally {
        if (activo) setCargando(false)
      }

      try {
        const { resenas: rs } = await api.resenas(id)
        if (activo) setResenas(rs)
      } catch {
        /* sin reseñas o sin backend */
      } finally {
        if (activo) setResenasCargadas(true)
      }
    }

    cargar()
    return () => {
      activo = false
    }
  }, [id, fallback])

  const inCart = lines.find((i) => i.id === id)

  // Registra la visita al producto (historial) para usuarios autenticados
  const productoId = producto?.id
  useEffect(() => {
    if (!user || !productoId) return
    api.registrarVista(productoId).catch(() => {
      /* el historial es best-effort */
    })
  }, [user, productoId])

  const tallaActiva = producto && producto.tallas && producto.tallas.includes(selTalla)
    ? selTalla
    : (producto && producto.tallas && producto.tallas[0]) || ''
  const colorActiva = producto && producto.colores && producto.colores.some((c) => c.nombre === selColor)
    ? selColor
    : (producto && producto.colores && producto.colores[0] && producto.colores[0].nombre) || ''

  const enviarResena = async (e) => {
    e.preventDefault()
    setError('')
    setMensaje('')
    const texto = comentario.trim()
    if (!texto) {
      setError('Escribe un comentario para publicar tu reseña.')
      return
    }
    setEnviando(true)
    try {
      if (editandoResena) {
        const { resena } = await api.editarResena(editandoResena.id, cal, texto)
        setResenas((prev) => prev.map((r) => (r.id === resena.id ? resena : r)))
        setMensaje('Reseña actualizada.')
      } else {
        const { resena } = await api.addResena(id, cal, texto)
        setResenas((prev) => [resena, ...prev])
        setMensaje('¡Gracias! Tu reseña fue publicada.')
      }
      setEditandoResena(null)
      setComentario('')
      setCal(5)
    } catch (err) {
      setError(err.message || 'No se pudo publicar la reseña.')
    } finally {
      setEnviando(false)
    }
  }

  const empezarEdicionResena = (r) => {
    setEditandoResena(r)
    setCal(r.calificacion)
    setComentario(r.comentario)
    setMensaje('')
    setError('')
  }

  const cancelarEdicionResena = () => {
    setEditandoResena(null)
    setCal(5)
    setComentario('')
    setMensaje('')
    setError('')
  }

  const eliminarResena = async (r) => {
    if (!window.confirm('¿Eliminar tu reseña?')) return
    setMensaje('')
    setError('')
    try {
      await api.borrarResena(r.id)
      setResenas((prev) => prev.filter((x) => x.id !== r.id))
      if (editandoResena?.id === r.id) cancelarEdicionResena()
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la reseña.')
    }
  }

  const promedio = resenas.length
    ? (resenas.reduce((a, r) => a + r.calificacion, 0) / resenas.length).toFixed(1)
    : null

  // Mercado cruzado: prendas de categorías que complementan el outfit,
  // priorizando las que comparten algún color con la prenda actual.
  const mercadoCruzado = useMemo(() => {
    if (!producto || !Array.isArray(fallback) || fallback.length === 0) return []
    const complementarias = COMPLEMENTO[producto.categoria] || []
    const coloresActuales = new Set((producto.colores || []).map((c) => c.nombre))
    const enCategorias = fallback.filter(
      (p) => p.id !== producto.id && complementarias.includes(p.categoria) && Number(p.stock) > 0
    )
    const conPuntaje = enCategorias
      .map((p) => {
        const compartidos = (p.colores || []).filter((c) => coloresActuales.has(c.nombre)).length
        return { ...p, _score: compartidos * 3 + 1 }
      })
      .sort((a, b) => b._score - a._score || b.es_nuevo - a.es_nuevo)
      .slice(0, 4)
    if (conPuntaje.length < 4) {
      conPuntaje.push(
        ...fallback
          .filter(
            (p) =>
              p.id !== producto.id &&
              Number(p.stock) > 0 &&
              !conPuntaje.some((r) => r.id === p.id)
          )
          .sort((a, b) => (b.es_nuevo ? 1 : 0) - (a.es_nuevo ? 1 : 0))
          .slice(0, 4 - conPuntaje.length)
      )
    }
    return conPuntaje
  }, [producto, fallback])

  return (
    <div className="producto-page">
      {cargando ? (
        <div className="empty">Cargando producto...</div>
      ) : !producto ? (
        <div className="empty">
          <p>No encontramos el producto.</p>
          <Link className="btn-primary" style={{ textDecoration: 'none' }} to="/catalogo">
            Volver al catálogo
          </Link>
        </div>
      ) : (
        <>
          <div className="detalle">
            <div className="foto">
              <img src={imagenActiva || producto.img} alt={producto.nombre} />
              {(producto.imagenes?.length || 0) > 1 && (
                <div className="galeria">
                  {producto.imagenes.map((im, i) => (
                    <button
                      key={`${im}-${i}`}
                      type="button"
                      className={im === (imagenActiva || producto.img) ? 'activa' : ''}
                      onClick={() => setImagenActiva(im)}
                      aria-label={`Foto ${i + 1}`}
                    >
                      <img src={im} alt={`${producto.nombre} ${i + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="info">
              <span className="tag">{producto.categoria}</span>
              {Boolean(producto.es_nuevo) && <span className="badge-nuevo">Nuevo</span>}
              <h1>{producto.nombre}</h1>
              <div className={Number(producto.descuento) > 0 ? 'price oferta' : 'price'}>
                {Number(producto.descuento) > 0 && (
                  <>
                    <span className="antes">{formatoCOP(producto.precio)}</span>
                    <span className="badge-oferta">-{producto.descuento}%</span>
                  </>
                )}
                <span className="ahora">{formatoCOP(precioFinal(producto))}</span>
              </div>
              <p className="desc">{producto.descripcion || 'Prenda de nuestra colección actual.'}</p>
              <div className="meta">
                <span>{producto.codigo}</span>
                <span className={producto.stock > 0 ? 'stock-ok' : 'stock-no'}>
                  {producto.stock > 0 ? `${producto.stock} disponibles` : 'Agotado'}
                </span>
              </div>
              {(producto.colores?.length > 0 || producto.tallas?.length > 0) && (
                <div className="opciones">
                  {producto.colores?.length > 0 && (
                    <div className="colores">
                      <span className="colores-label">Colores:</span>
                      {producto.colores.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          className={`circulo grande ${colorActiva === c.nombre ? 'on' : ''}`}
                          style={{ background: c.hex }}
                          title={c.nombre}
                          onClick={() => {
                            setSelColor(c.nombre)
                            if (inCart) updateItem(producto.id, { color: c.nombre })
                          }}
                        />
                      ))}
                      {colorActiva && <span className="colores-nombres">{colorActiva}</span>}
                    </div>
                  )}
                  {producto.tallas?.length > 0 && (
                    <div className="tallas">
                      <span className="colores-label">Tallas:</span>
                      {producto.tallas.map((t) => (
                        <button
                          type="button"
                          className={`talla ${tallaActiva === t ? 'on' : ''}`}
                          key={t}
                          onClick={() => {
                            setSelTalla(t)
                            if (inCart) updateItem(producto.id, { talla: t })
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="card-actions">
                {producto.stock > 0 &&
                  (inCart ? (
                    <div className="qty-stepper">
                      <button onClick={() => updateQty(producto.id, inCart.qty - 1)}>-</button>
                      <span>{inCart.qty}</span>
                      <button onClick={() => updateQty(producto.id, inCart.qty + 1)}>+</button>
                    </div>
                  ) : (
                    <button className="btn-add" onClick={() => addToCart(producto.id, { talla: tallaActiva, color: colorActiva })}>
                      <i className="bi bi-bag-plus" /> Agregar al carrito
                    </button>
                  ))}
              </div>
            </div>
          </div>

          <section className="resenas">
            <div className="resenas-head">
              <h2>Reseñas</h2>
              {promedio !== null && (
                <span className="promedio">{promedio} ★ · {resenas.length} opiniones</span>
              )}
            </div>

            {!resenasCargadas ? (
              <div className="empty">Cargando reseñas...</div>
            ) : resenas.length === 0 ? (
              <p className="empty">Aún no hay reseñas. ¡Sé la primera en opinar!</p>
            ) : (
              <div className="lista">
                {resenas.map((r) => (
                  <article className="resena" key={r.id}>
                    <div className="resena-top">
                      <span className="autor-img">{r.usuario?.charAt(0) || 'U'}</span>
                      <span className="autor">{r.usuario}</span>
                      <Estrellas valor={r.calificacion} />
                      <span className="fecha">{formatFecha(r.fecha)}</span>
                      {user && r.usuario_id === user.id && (
                        <span className="resena-mias">
                          tuya
                          <button type="button" title="Editar reseña" onClick={() => empezarEdicionResena(r)}>
                            <i className="bi bi-pencil" />
                          </button>
                          <button type="button" title="Eliminar reseña" onClick={() => eliminarResena(r)}>
                            <i className="bi bi-trash" />
                          </button>
                        </span>
                      )}
                    </div>
                    <p>{r.comentario}</p>
                  </article>
                ))}
              </div>
            )}

            <div className="resena-form">
              <h3>{editandoResena ? 'Editando tu reseña' : 'Deja tu reseña'}</h3>
              {!user ? (
                <p className="empty">
                  Para comentar necesitas{' '}
                  <Link to="/login" className="link-primario">iniciar sesión</Link>.
                </p>
              ) : (
                <form onSubmit={enviarResena}>
                  {editandoResena && (
                    <p className="editando-note">
                      <i className="bi bi-pencil" /> Estás editando tu reseña
                      <button type="button" onClick={cancelarEdicionResena}>Cancelar</button>
                    </p>
                  )}
                  <div className="campo-estrellas">
                    <span>Tu calificación:</span>
                    <div className="estrellas-input">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          className={n <= cal ? 'on' : ''}
                          onClick={() => setCal(n)}
                          aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    placeholder="Cuéntanos qué tal te pareció la prenda..."
                    maxLength={500}
                    rows={4}
                  />
                  {error && <p className="msg-error">{error}</p>}
                  {mensaje && <p className="msg-ok">{mensaje}</p>}
                  <button type="submit" className="btn-primary" disabled={enviando}>
                    {enviando ? 'Publicando...' : editandoResena ? 'Guardar cambios' : 'Publicar reseña'}
                  </button>
                </form>
              )}
            </div>
          </section>

          {/* Mercado cruzado: recomendaciones para completar el outfit */}
          {mercadoCruzado.length > 0 && (
            <section className="products-section mercado-cruzado">
              <div className="section-head">
                <h2>Mercado cruzado</h2>
                <span>Completa tu outfit con prendas que combinan con este estilo</span>
              </div>
              <div className="scroll-row">
                {mercadoCruzado.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}