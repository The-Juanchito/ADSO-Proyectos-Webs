import { lazy, Suspense } from 'react'
import { Routes, Route, Link, useParams, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Inicio from './pages/inicio'
import Catalogo from './pages/catalogo'
import Producto from './pages/producto'
import Login from './pages/login'
import Recuperar from './pages/recuperar'
import Restablecer from './pages/restablecer'
import Nosotros from './pages/nosotros'
import Contactos from './pages/contactos'
import CarritoCompras from './pages/carrito_compras'
import PagoResultado from './pages/pago_resultado'
import Perfil from './pages/perfil'
import Notificaciones from './pages/notificaciones'
import AnuncioPopup from './components/AnuncioPopup'
import ChatBot from './components/ChatBot'
import BotonVolver from './components/BotonVolver'

const Admin = lazy(() => import('./pages/admin'))
const BajoStock = lazy(() => import('./pages/bajo_stock'))

const RutaProducto = () => {
  const { id } = useParams()
  return <Producto key={id} id={Number(id)} />
}

// Páginas internas donde se muestra el botón "Volver".
const RUTAS_INTERNAS = ['/producto', '/carrito', '/pago', '/perfil', '/notificaciones', '/admin', '/admin/stock-bajo']

function App() {
  const location = useLocation()
  const esAdmin = location.pathname.startsWith('/admin')
  const esInterna = RUTAS_INTERNAS.some((r) => location.pathname === r || location.pathname.startsWith(`${r}/`))
  return (
    <div className="site">
      <Navbar />
      <main>
        {esInterna && <BotonVolver />}
        {/* key re-monta el contenido al cambiar de ruta para repetir la transición */}
        <div key={location.pathname} className="page-anim">
          <Suspense fallback={<div className="empty-cart"><p>Cargando…</p></div>}>
          <Routes>
            {/* Páginas públicas */}
            <Route path="/" element={<Inicio />} />
            <Route path="/catalogo" element={<Catalogo />} />
            <Route path="/producto/:id" element={<RutaProducto />} />
            <Route path="/nosotros" element={<Nosotros />} />
            <Route path="/contacto" element={<Contactos />} />

            {/* Autenticación */}
            <Route path="/login" element={<Login />} />
            <Route path="/recuperar" element={<Recuperar />} />
            <Route path="/restablecer" element={<Restablecer />} />

            {/* Tienda */}
            <Route path="/carrito" element={<CarritoCompras />} />
            <Route path="/pago/resultado" element={<PagoResultado />} />

            {/* Cuenta del usuario */}
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/notificaciones" element={<Notificaciones />} />

            {/* Administración */}
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/stock-bajo" element={<BajoStock />} />

            {/* 404 */}
            <Route
              path="*"
              element={
                <div className="empty-cart">
                  <h3>Página no encontrada</h3>
                  <p>La página que buscas no existe o fue movida.</p>
                  <Link to="/" className="btn-primary" style={{ textDecoration: 'none' }}>Ir al inicio</Link>
                </div>
              }
            />
          </Routes>
          </Suspense>
        </div>
      </main>
      <Footer />
      {/* Asistente virtual con IA (no se muestra en el dashboard) */}
      {!esAdmin && <ChatBot />}
      <AnuncioPopup />
    </div>
  )
}

export default App