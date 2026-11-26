import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../context/StoreContext'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export default function Login() {
  const { login, registro, loginGoogle } = useStore()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({ nombre: '', email: '', password: '' })

  // Referencias para el botón de Google
  const googleBoton = useRef(null)
  const loginGoogleRef = useRef(loginGoogle)

  useEffect(() => {
    loginGoogleRef.current = loginGoogle
  })

  // Cargar el botón "Continuar con Google" cuando se muestra el login
  useEffect(() => {
    let timer = null
    let fallo = null
    if (!GOOGLE_CLIENT_ID || mode !== 'login' || !googleBoton.current) return

    const render = () => {
      if (!window.google?.accounts?.id || !googleBoton.current) return false
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (resp) => {
          if (!resp?.credential) return
          setMsg('Verificando con Google...')
          loginGoogleRef
            .current(resp.credential)
            .then((usuario) => navigate(usuario.rol !== 'cliente' ? '/admin' : '/'))
            .catch((e) => {
              setMsg('')
              setError(e.message || 'No se pudo iniciar sesión con Google.')
            })
        },
      })
      window.google.accounts.id.renderButton(googleBoton.current, {
        type: 'standard',
        shape: 'pill',
        theme: 'outline',
        text: 'continue_with',
        size: 'large',
      })
      return true
    }

    if (!render()) {
      timer = setInterval(() => {
        if (render()) clearInterval(timer)
      }, 200)
      fallo = setTimeout(() => clearInterval(timer), 8000)
    }
    return () => {
      if (timer) clearInterval(timer)
      if (fallo) clearTimeout(fallo)
    }
  }, [mode, navigate])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  // Enviar login o registro según el modo activo
  const handleSubmit = async (e) => {
    e.preventDefault()
    setMsg('')
    setError('')

    if (!form.email || !form.password || (mode === 'register' && !form.nombre)) {
      setError('Completa todos los campos.')
      return
    }

    setMsg('Un momento...')

    try {
      const usuario =
        mode === 'register'
          ? await registro(form.nombre, form.email, form.password)
          : await login(form.email, form.password)
      navigate(usuario.rol !== 'cliente' ? '/admin' : '/')
    } catch (err) {
      setMsg('')
      setError(err.message || 'No se pudo iniciar sesión.')
    }
  }

  const cambiarModo = (m) => {
    setMode(m)
    setMsg('')
    setError('')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Pestañas de inicio de sesión / registro */}
        <div className="auth-tabs">
          <button className={mode === 'login' ? 'on' : ''} onClick={() => cambiarModo('login')}>
            Iniciar sesión
          </button>
          <button className={mode === 'register' ? 'on' : ''} onClick={() => cambiarModo('register')}>
            Registrarse
          </button>
        </div>

        <h2>{mode === 'register' ? 'Crear cuenta' : 'Bienvenida de vuelta'}</h2>
        <p className="auth-sub">
          {mode === 'register'
            ? 'Únete a EMI Boutique y descubre tu próxima prenda favorita.'
            : 'Inicia sesión para continuar tu compra.'}
        </p>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="field">
              <label htmlFor="nombre">Nombre</label>
              <input id="nombre" value={form.nombre} onChange={set('nombre')} placeholder="Tu nombre" />
            </div>
          )}
          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input id="email" type="email" value={form.email} onChange={set('email')} placeholder="tucorreo@ejemplo.com" />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input id="password" type="password" value={form.password} onChange={set('password')} placeholder="••••••••" />
          </div>
          {msg && !error && <p className="msg">{msg}</p>}
          {error && <p className="msg" style={{ color: '#c0392b' }}>{error}</p>}
          <button type="submit" className="btn-submit">
            {msg && !error ? 'Cargando...' : mode === 'register' ? 'Crear cuenta' : 'Entrar'}
          </button>
        </form>

        {mode === 'login' && GOOGLE_CLIENT_ID && (
          <div className="google-block">
            <div className="google-divider">
              <span>o continúa con</span>
            </div>
            <div ref={googleBoton} className="google-btn" />
          </div>
        )}

        {mode === 'login' && (
          <Link to="/recuperar" className="auth-link" onClick={() => cambiarModo('login')}>
            ¿Olvidaste tu contraseña?
          </Link>
        )}
      </div>
    </div>
  )
}