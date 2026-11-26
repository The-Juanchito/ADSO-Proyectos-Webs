import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { api } from '../services/api'
import MisPedidos from '../components/MisPedidos'
import PanelSugerencias from '../components/perfil/PanelSugerencias'
import PanelMensajes from '../components/perfil/PanelMensajes'
import PanelHistoria from '../components/perfil/PanelHistoria'
import PanelDirecciones from '../components/perfil/PanelDirecciones'

const PANELES = [
  { id: 'datos', etiqueta: 'Mis datos', icono: 'bi-person-lines-fill' },
  { id: 'sugerencias', etiqueta: 'Sugerencias', icono: 'bi-magic' },
  { id: 'pedidos', etiqueta: 'Mis pedidos', icono: 'bi-receipt' },
  { id: 'mensajes', etiqueta: 'Mensajes', icono: 'bi-chat-dots' },
  { id: 'historia', etiqueta: 'Vistos', icono: 'bi-clock-history' },
]

export default function Perfil() {
  const { user, updateUser, logout } = useStore()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const panelInicial = PANELES.some((p) => p.id === params.get('panel')) ? params.get('panel') : 'datos'
  const [panel, setPanel] = useState(panelInicial)

  // Formulario con los datos del usuario
  const [form, setForm] = useState({
    nombre: user?.nombre || '',
    correo: user?.correo || '',
    telefono: user?.telefono || '',
    direccion: user?.direccion || '',
    direccion_info: user?.direccion_info || '',
    ciudad: user?.ciudad || '',
  })
  const [archivo, setArchivo] = useState(null)
  const [preview, setPreview] = useState(user?.perfil_img || '')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  if (!user) {
    return (
      <div className="perfil-page">
        <div className="perfil-card guard">
          <h2>Inicia sesión</h2>
          <p>Para ver y editar tu perfil necesitas estar conectada.</p>
          <Link to="/login" className="btn-primary" style={{ textDecoration: 'none' }}>Ir a iniciar sesión</Link>
        </div>
      </div>
    )
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  // Seleccionar imagen de perfil desde el botón
  const setImagen = (e) => {
    const f = e.target.files[0]
    if (!f) return
    if (!f.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen (JPG, PNG, WEBP o GIF).')
      return
    }
    setError('')
    setArchivo(f)
    setPreview(URL.createObjectURL(f))
  }

  const guardar = async (e) => {
    e.preventDefault()
    setError('')
    setMsg('')
    // Nombre y correo obligatorios
    if (!form.nombre.trim() || !form.correo.trim()) {
      setError('Nombre y correo son obligatorios.')
      return
    }
    setGuardando(true)
    try {
      const datos = new FormData()
      datos.append('nombre', form.nombre.trim())
      datos.append('correo', form.correo.trim())
      datos.append('telefono', form.telefono.trim())
      datos.append('direccion', form.direccion.trim())
      datos.append('direccion_info', form.direccion_info.trim())
      datos.append('ciudad', form.ciudad.trim())
      if (archivo instanceof File) datos.append('perfil_img', archivo)
      const { perfil } = await api.guardarPerfil(datos)
      updateUser(perfil)
      setArchivo(null)
      setPreview(perfil.perfil_img || '')
      setMsg('Perfil actualizado ✅')
    } catch (err) {
      setError(err.message || 'No se pudo guardar el perfil.')
    } finally {
      setGuardando(false)
    }
  }

  const inicial = user.nombre?.charAt(0).toUpperCase() || 'U'

  return (
    <div className="perfil-page">
      <header className="perfil-hero">
        <h1>Mi Perfil</h1>
        <p>Administra tus datos, revisa tus pedidos, sugerencias y conversaciones</p>
      </header>

      <div className="perfil-layout">
        {/* Barra lateral: identidad + navegación de paneles */}
        <aside className="perfil-side">
          <div className="foto-grande">
            {preview ? <img src={preview} alt={user.nombre} /> : <span>{inicial}</span>}
          </div>
          <p className="cuenta">
            <strong>{user.nombre}</strong>
            <span>{user.correo}</span>
            <span className={user.rol === 'cliente' ? 'rol' : 'rol admin'}>
              {user.rol === 'administrador' ? 'Administradora' : user.rol === 'empleado' ? 'Empleado' : 'Cliente'}
            </span>
          </p>

          <nav className="perfil-menu">
            {PANELES.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`perfil-menu-item ${panel === p.id ? 'activo' : ''}`}
                onClick={() => setPanel(p.id)}
              >
                <i className={`bi ${p.icono}`} /> {p.etiqueta}
              </button>
            ))}
          </nav>

          {user.rol !== 'cliente' && (
            <Link to="/admin" className="btn-ghost" style={{ textDecoration: 'none' }}>
              Ir al dashboard
            </Link>
          )}
        </aside>

        {/* Panel activo */}
        <main className="perfil-main">
          {panel === 'datos' && (
            <>
              <form className="perfil-card" onSubmit={guardar}>
              <div className="perfil-foto-row">
                <div className="foto-mini">
                  {preview ? <img src={preview} alt={user.nombre} /> : <span>{inicial}</span>}
                </div>
                <div className="perfil-foto-txt">
                  <label className="btn-upload">
                    {archivo ? 'Cambiar foto…' : 'Subir foto'}
                    <input type="file" accept="image/*" onChange={setImagen} hidden />
                  </label>
                  <small>JPG, PNG, WEBP o GIF. {archivo ? 'Se guardará al guardar cambios.' : 'Opcional.'}</small>
                </div>
              </div>

              <div className="field">
                <label>Nombre completo</label>
                <input value={form.nombre} onChange={set('nombre')} placeholder="Tu nombre" />
              </div>
              <div className="field">
                <label>Correo electrónico</label>
                <input type="email" value={form.correo} onChange={set('correo')} placeholder="tucorreo@ejemplo.com" />
              </div>
              <div className="field">
                <label>Teléfono</label>
                <input value={form.telefono} onChange={set('telefono')} placeholder="310 000 0000" />
              </div>
              <div className="field">
                <label>Dirección</label>
                <input value={form.direccion} onChange={set('direccion')} placeholder="Calle, número" />
              </div>
              <div className="field">
                <label>Información adicional de dirección <span className="opt">(opcional)</span></label>
                <input
                  value={form.direccion_info}
                  onChange={set('direccion_info')}
                  placeholder="Apto, torre, barrio, referencias…"
                  maxLength={255}
                />
              </div>
              <div className="field">
                <label>Ciudad</label>
                <input value={form.ciudad} onChange={set('ciudad')} placeholder="Bogotá" />
              </div>
              {error && <p className="msg-error">{error}</p>}
              {msg && <p className="msg-ok">{msg}</p>}
              <button type="submit" className="btn-save" disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar cambios'}
              </button>

              <button type="button" className="btn-logout" onClick={() => { logout(); navigate('/') }}>
                <i className="bi bi-box-arrow-right" /> Cerrar sesión
              </button>
            </form>
              <PanelDirecciones />
            </>
          )}

          {panel === 'sugerencias' && <PanelSugerencias />}
          {panel === 'pedidos' && <MisPedidos pedidoDestacado={Number(params.get('pedido')) || null} />}
          {panel === 'mensajes' && <PanelMensajes />}
          {panel === 'historia' && <PanelHistoria />}
        </main>
      </div>
    </div>
  )
}
