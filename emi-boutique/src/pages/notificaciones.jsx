import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { api } from '../services/api'

const ICONOS = {
  pedido: 'bi-bag-check',
  stock: 'bi-exclamation-triangle',
  resena: 'bi-star',
  usuario: 'bi-person-plus',
  mensaje: 'bi-chat-dots',
  info: 'bi-bell',
  promo: 'bi-tags',
}

const ETIQUETAS = {
  pedido: 'Pedido',
  stock: 'Inventario',
  resena: 'Reseña',
  usuario: 'Cuenta',
  mensaje: 'Mensaje',
  info: 'Información',
  promo: 'Promoción',
}

function parseFecha(fecha) {
  if (!fecha) return null
  const s = String(fecha).replace(' ', 'T').replace(/(\.\d{3})\d+/, '$1')
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

function fechaLarga(fecha) {
  const d = parseFecha(fecha)
  if (!d) return ''
  return d.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function hace(fecha) {
  const d = parseFecha(fecha)
  if (!d) return ''
  const seg = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000))
  if (seg < 60) return 'hace un momento'
  if (seg < 3600) return `hace ${Math.floor(seg / 60)} min`
  if (seg < 86400) return `hace ${Math.floor(seg / 3600)} h`
  if (seg < 604800) return `hace ${Math.floor(seg / 86400)} d`
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
}

export default function Notificaciones() {
  const { user } = useStore()
  const [params, setParams] = useSearchParams()
  const [items, setItems] = useState([])
  const [noLeidas, setNoLeidas] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('todas')

  const selId = Number(params.get('id')) || null

  const cargar = useCallback(() => {
    if (!user) return
    api
      .notificaciones(true)
      .then((r) => {
        setItems(r.items || [])
        setNoLeidas(r.no_leidas || 0)
      })
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [user])

  useEffect(() => {
    cargar()
  }, [cargar])

  const lista = useMemo(
    () => (filtro === 'no_leidas' ? items.filter((n) => !n.leida) : items),
    [items, filtro]
  )

  const seleccionada = useMemo(
    () => items.find((n) => n.id === selId) || null,
    [items, selId]
  )

  // Al abrir una notificación, se marca como leída.
  useEffect(() => {
    if (!seleccionada || seleccionada.leida) return
    api.marcarNotificacion(seleccionada.id).then((r) => {
      setItems(r.items || [])
      setNoLeidas(r.no_leidas || 0)
    }).catch(() => {})
    // Solo cuando cambia la notificación seleccionada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selId])

  const marcarTodas = async () => {
    try {
      const r = await api.marcarTodasNotificaciones()
      setItems(r.items || [])
      setNoLeidas(r.no_leidas || 0)
    } catch {
      /* sin conexión */
    }
  }

  const seleccionar = (id) => setParams({ id: String(id) })
  const cerrarDetalle = () => setParams({})

  if (!user) {
    return (
      <div className="notif-page">
        <div className="notif-page-head">
          <h1>Notificaciones</h1>
        </div>
        <div className="empty">
          <p>Inicia sesión para ver tus notificaciones.</p>
          <Link className="btn-primary" style={{ textDecoration: 'none' }} to="/login">
            Iniciar sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`notif-page ${selId ? 'con-detalle' : ''}`}>
      <div className="notif-page-head">
        <div>
          <h1>Notificaciones</h1>
          <p className="notif-page-sub">
            {noLeidas > 0 ? `Tienes ${noLeidas} sin leer` : 'Estás al día'} · {items.length} en total
          </p>
        </div>
        {noLeidas > 0 && (
          <button type="button" className="btn-primary notif-marcar" onClick={marcarTodas}>
            <i className="bi bi-check2-all" /> Marcar todas como leídas
          </button>
        )}
      </div>

      <div className="notif-filtros">
        <button
          type="button"
          className={filtro === 'todas' ? 'on' : ''}
          onClick={() => setFiltro('todas')}
        >
          Todas <span>{items.length}</span>
        </button>
        <button
          type="button"
          className={filtro === 'no_leidas' ? 'on' : ''}
          onClick={() => setFiltro('no_leidas')}
        >
          Sin leer <span>{noLeidas}</span>
        </button>
      </div>

      <div className="notif-grid">
        {/* Panel con TODAS las notificaciones */}
        <div className="notif-col-lista">
          {cargando ? (
            <p className="notif-empty">Cargando notificaciones...</p>
          ) : lista.length === 0 ? (
            <p className="notif-empty">
              {filtro === 'no_leidas' ? 'No tienes notificaciones sin leer.' : 'No tienes notificaciones por ahora.'}
            </p>
          ) : (
            lista.map((n) => (
              <button
                key={n.id}
                type="button"
                className={`notif-card ${n.leida ? '' : 'nueva'} ${n.id === selId ? 'activa' : ''}`}
                onClick={() => seleccionar(n.id)}
              >
                <span className={`notif-ico ${n.tipo}`}>
                  <i className={`bi ${ICONOS[n.tipo] || ICONOS.info}`} />
                </span>
                <div className="notif-card-body">
                  <div className="notif-card-top">
                    <span className="notif-card-titulo">{n.titulo}</span>
                    <span className="notif-card-fecha">{hace(n.fecha)}</span>
                  </div>
                  <p>{n.mensaje}</p>
                </div>
                {!n.leida && <span className="notif-dot" />}
              </button>
            ))
          )}
        </div>

        {/* Detalle completo de la notificación seleccionada */}
        <aside className="notif-col-detalle">
          {!seleccionada ? (
            <div className="notif-detalle-vacio">
              <i className="bi bi-envelope-open" />
              <p>Selecciona una notificación para ver todo su detalle.</p>
            </div>
          ) : (
            <article className="notif-detalle">
              <button type="button" className="notif-detalle-volver" onClick={cerrarDetalle}>
                <i className="bi bi-arrow-left" /> Volver a la lista
              </button>

              <span className={`notif-ico grande ${seleccionada.tipo}`}>
                <i className={`bi ${ICONOS[seleccionada.tipo] || ICONOS.info}`} />
              </span>
              <span className="notif-detalle-tipo">
                {ETIQUETAS[seleccionada.tipo] || 'Notificación'}
              </span>
              <h2>{seleccionada.titulo}</h2>
              <span className="notif-detalle-fecha">
                <i className="bi bi-clock" /> {fechaLarga(seleccionada.fecha)}
              </span>
              <p className="notif-detalle-mensaje">{seleccionada.mensaje}</p>

              {seleccionada.enlace ? (
                <Link className="btn-primary notif-detalle-ir" to={seleccionada.enlace} style={{ textDecoration: 'none' }}>
                  Ir al detalle <i className="bi bi-arrow-right" />
                </Link>
              ) : null}
            </article>
          )}
        </aside>
      </div>
    </div>
  )
}
