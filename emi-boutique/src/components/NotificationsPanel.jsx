import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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

function parseFecha(fecha) {
  if (!fecha) return null
  const s = String(fecha).replace(' ', 'T').replace(/(\.\d{3})\d+/, '$1')
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

function hace(fecha) {
  const d = parseFecha(fecha)
  if (!d) return ''
  const seg = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000))
  if (seg < 60) return 'hace un momento'
  if (seg < 3600) return `hace ${Math.floor(seg / 60)} min`
  if (seg < 86400) return `hace ${Math.floor(seg / 3600)} h`
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
}

// Toast individual (isla dinámica)
function NotificacionToast({ notif, onClose, onClick }) {
  const icono = ICONOS[notif.tipo] || ICONOS.info

  return (
    <div className={`notif-toast ${notif.leida ? '' : 'nueva'}`} onClick={() => { onClick(notif.id); onClose(notif.id); }}>
      <span className={`notif-toast-ico ${notif.tipo}`}>
        <i className={`bi ${icono}`} />
      </span>
      <div className="notif-toast-body">
        <strong className="notif-toast-titulo">{notif.titulo}</strong>
        <p>{notif.mensaje}</p>
        <span className="notif-toast-fecha">{hace(notif.fecha)}</span>
      </div>
      <button type="button" className="notif-toast-cerrar" onClick={(e) => { e.stopPropagation(); onClose(notif.id); }}>
        <i className="bi bi-x" />
      </button>
    </div>
  )
}

// Panel dropdown (clic en la campana)
function NotificacionesDropdown({ items, noLeidas, abierto, setAbierto, marcarTodas, marcarUna }) {
  if (!abierto) return null

  return (
    <div className="notif-panel">
      <div className="notif-head">
        <strong>Notificaciones</strong>
        {noLeidas > 0 && (
          <button type="button" onClick={marcarTodas}>Marcar leídas</button>
        )}
      </div>

      <div className="notif-list">
        {items.length === 0 ? (
          <p className="notif-empty">No tienes notificaciones por ahora.</p>
        ) : (
          items.map((n) => (
            <div key={n.id} className={`notif-item ${n.leida ? '' : 'nueva'}`}>
              <span className={`notif-ico ${n.tipo}`}>
                <i className={`bi ${ICONOS[n.tipo] || ICONOS.info}`} />
              </span>
              <div className="notif-body">
                <div className="notif-top">
                  <span className="notif-titulo">{n.titulo}</span>
                  <span className="notif-fecha">{hace(n.fecha)}</span>
                </div>
                <p>{n.mensaje}</p>
                <Link
                  to={n.enlace || `/notificaciones?id=${n.id}`}
                  className="notif-link"
                  onClick={() => { marcarUna(n.id); setAbierto(false); }}
                >
                  Ver detalle →
                </Link>
              </div>
              {!n.leida && <span className="notif-dot" />}
            </div>
          ))
        )}
      </div>

      <Link to="/notificaciones" className="notif-ver-todas" onClick={() => setAbierto(false)}>
        Ver todas las notificaciones
      </Link>
    </div>
  )
}

export default function NotificationsPanel() {
  const [items, setItems] = useState([])
  const [noLeidas, setNoLeidas] = useState(0)
  const [abierto, setAbierto] = useState(false)
  const [toasts, setToasts] = useState([])
  const ref = useRef(null)
  const idsVistos = useRef(new Set())
  const primerCarga = useRef(true)
  const navigate = useNavigate()

  const aplicar = (r) => {
    if (!r) return
    const nuevosItems = r.items || []
    const nuevasNoLeidas = r.no_leidas || 0
    setItems(nuevosItems)
    setNoLeidas(nuevasNoLeidas)

    // Detectar notificaciones nuevas para mostrar toast
    if (!primerCarga.current) {
      const anteriores = idsVistos.current
      const nuevos = nuevosItems.filter((n) => !anteriores.has(n.id) && !n.leida)
      if (nuevos.length > 0) {
        setToasts((prev) => [...nuevos, ...prev].slice(0, 5))
      }
    }
    idsVistos.current = new Set(nuevosItems.map((n) => n.id))
    primerCarga.current = false
  }

  const cargar = useCallback(() => {
    api
      .notificaciones()
      .then(aplicar)
      .catch(() => {})
  }, [])

  useEffect(() => {
    cargar()
    const t = setInterval(cargar, 30000)
    return () => clearInterval(t)
  }, [cargar])

  // Cerrar panel al hacer clic fuera
  useEffect(() => {
    const alClicFuera = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false)
    }
    document.addEventListener('mousedown', alClicFuera)
    return () => document.removeEventListener('mousedown', alClicFuera)
  }, [])

  const alternar = () => {
    setAbierto((a) => {
      if (!a) cargar()
      return !a
    })
  }

  const marcarTodas = async () => {
    try {
      aplicar(await api.marcarTodasNotificaciones())
    } catch {
      /* sin conexión */
    }
  }

  const marcarUna = async (id) => {
    try {
      aplicar(await api.marcarNotificacion(id))
    } catch {
      /* sin conexión */
    }
  }

  const cerrarToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const clickToast = (id) => {
    marcarUna(id)
    const n = items.find((i) => i.id === id)
    if (n?.enlace) {
      setAbierto(false)
      navigate(n.enlace)
    }
  }

  return (
    <div className="notif" ref={ref}>
      <button
        type="button"
        className="notif-btn"
        onClick={alternar}
        aria-label="Notificaciones"
        title="Notificaciones"
      >
        <i className="bi bi-bell" />
        {noLeidas > 0 && <span className="notif-badge">{noLeidas > 9 ? '9+' : noLeidas}</span>}
      </button>

      <NotificacionesDropdown
        items={items}
        noLeidas={noLeidas}
        abierto={abierto}
        setAbierto={setAbierto}
        marcarTodas={marcarTodas}
        marcarUna={marcarUna}
      />

      {/* Toasts / Islas dinámicas */}
      {toasts.length > 0 && (
        <div className="notif-toasts-container" role="region" aria-label="Notificaciones nuevas">
          {toasts.map((n) => (
            <NotificacionToast
              key={n.id}
              notif={n}
              onClose={cerrarToast}
              onClick={clickToast}
            />
          ))}
        </div>
      )}
    </div>
  )
}