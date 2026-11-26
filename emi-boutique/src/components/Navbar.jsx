import { useEffect, useRef, useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { useTheme } from '../context/ThemeContext'
import NotificationsPanel from './NotificationsPanel'

export default function Navbar() {
  const { user, cartCount } = useStore()
  const { tema, toggleTema } = useTheme()
  const [open, setOpen] = useState(false)
  const [oculto, setOculto] = useState(false)
  const ultimoY = useRef(0)

  useEffect(() => {
    const alScroll = () => {
      const y = window.scrollY
      setOculto(y > 180 && y > ultimoY.current)
      ultimoY.current = y
    }
    window.addEventListener('scroll', alScroll, { passive: true })
    return () => window.removeEventListener('scroll', alScroll)
  }, [])

  const close = () => setOpen(false)

  const navIcon = (to, icon, label) => (
    <NavLink to={to} end onClick={close} className={({ isActive }) => `nav-icon ${isActive ? 'active' : ''}`} aria-label={label} title={label}>
      <i className={`bi ${icon}`} />
    </NavLink>
  )

  const inicial = user?.nombre?.charAt(0).toUpperCase() || 'U'
  const esStaff = user && user.rol !== 'cliente'

  return (
    <header className={`navbar ${oculto ? 'oculta' : ''}`}>
      <div className="nav-inner">
        <Link to="/" className="brand">
          EMI<span>.</span>boutique
        </Link>

        <nav className={`nav-links ${open ? 'open' : ''}`}>
          {navIcon('/', 'bi-house', 'Inicio')}
          {navIcon('/catalogo', 'bi-grid', 'Catálogo')}
          {user && <NotificationsPanel />}
          {navIcon('/contacto', 'bi-chat-dots', 'Contacto')}
          {esStaff && navIcon('/admin', 'bi-speedometer2', 'Dashboard')}
        </nav>

        <div className="nav-actions">
          <button className="btn-tema" onClick={toggleTema} aria-label="Cambiar tema" title={tema === 'claro' ? 'Modo oscuro' : 'Modo claro'}>
            <i className={`bi ${tema === 'claro' ? 'bi-moon-stars' : 'bi-sun'}`} />
          </button>

          <Link to="/carrito" className="cart-link" aria-label="Ver carrito">
            <i className="bi bi-bag" />
            {cartCount > 0 && <span className="badge">{cartCount}</span>}
          </Link>

          {user ? (
            <Link to="/perfil" className="user-chip" title="Mi perfil" aria-label="Mi perfil">
              <span className="avatar">
                {user.perfil_img ? (
                  <img src={user.perfil_img} alt={user.nombre} />
                ) : (
                  inicial
                )}
              </span>
              <span className="user-name">{user.nombre}</span>
            </Link>
          ) : (
            <Link to="/login" className="btn-nav entrar">
              <i className="bi bi-person" /> Entrar
            </Link>
          )}

          <button className="burger" onClick={() => setOpen((o) => !o)} aria-label="Menú">
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  )
}
