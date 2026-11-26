import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'

export default function Recuperar() {
  const [paso, setPaso] = useState(1) // 1: correo, 2: código + nueva contraseña
  const [correo, setCorreo] = useState('')
  const [codigo, setCodigo] = useState('')
  const [avisoCodigo, setAvisoCodigo] = useState('')
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [estado, setEstado] = useState('') // '', 'ok', 'error'
  const [mensaje, setMensaje] = useState('')
  const [link, setLink] = useState('')
  const [cargando, setCargando] = useState(false)
  const navigate = useNavigate()

  // Paso 1: pedir el código por correo
  const pedirCodigo = async (e) => {
    e.preventDefault()
    setEstado('')
    setMensaje('')
    setLink('')

    if (!correo.includes('@')) {
      setEstado('error')
      setMensaje('Escribe un correo válido.')
      return
    }

    setCargando(true)
    try {
      const r = await api.recuperarCodigo(correo)
      setPaso(2)
      if (r.correo_enviado) {
        setAvisoCodigo(`Te enviamos un código de 6 dígitos a ${correo}. Vence en 15 minutos.`)
      } else if (r.codigo) {
        setAvisoCodigo(`Sin SMTP configurado: tu código es ${r.codigo}`)
      } else {
        setAvisoCodigo('Si el correo existe, recibirás un código de recuperación.')
      }
    } catch (err) {
      setEstado('error')
      setMensaje(err.message || 'No se pudo procesar la solicitud.')
    } finally {
      setCargando(false)
    }
  }

  // Paso 2: validar código y guardar la nueva contraseña
  const cambiarPassword = async (e) => {
    e.preventDefault()
    setEstado('')
    setMensaje('')

    if (codigo.trim().length !== 6) {
      setEstado('error')
      setMensaje('El código debe tener 6 dígitos.')
      return
    }
    if (password.length < 6) {
      setEstado('error')
      setMensaje('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirmar) {
      setEstado('error')
      setMensaje('Las contraseñas no coinciden.')
      return
    }

    setCargando(true)
    try {
      await api.restablecerCodigo(correo, codigo.trim(), password)
      setEstado('ok')
      setMensaje('Contraseña actualizada correctamente.')
    } catch (err) {
      setEstado('error')
      setMensaje(err.message || 'No se pudo restablecer la contraseña.')
    } finally {
      setCargando(false)
    }
  }

  // Alternativa: enlace mágico por correo (además del código)
  const pedirEnlace = async () => {
    try {
      const r = await api.recuperar(correo)
      if (r.link) {
        setLink(r.link)
      } else {
        setMensaje('Si el correo existe, recibirás también un enlace de recuperación.')
      }
    } catch {
      /* silencioso: el código sigue siendo la vía principal */
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Recupera tu contraseña</h2>

        {estado === 'ok' ? (
          <>
            <p className="msg">{mensaje}</p>
            <button className="btn-submit" onClick={() => navigate('/login')}>
              Ir a iniciar sesión
            </button>
          </>
        ) : paso === 1 ? (
          <>
            <p className="auth-sub">
              Escribe el correo de tu cuenta y te enviaremos un código de 6
              dígitos para restablecerla.
            </p>
            <form onSubmit={pedirCodigo}>
              <div className="field">
                <label htmlFor="correo">Correo electrónico</label>
                <input
                  id="correo"
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                  autoFocus
                />
              </div>
              {estado === 'error' && (
                <p className="msg" style={{ color: '#c0392b' }}>{mensaje}</p>
              )}
              <button type="submit" className="btn-submit" disabled={cargando}>
                {cargando ? 'Enviando…' : 'Enviar código'}
              </button>
            </form>
            <p className="auth-link">
              <Link to="/login">Volver a iniciar sesión</Link>
            </p>
          </>
        ) : (
          <>
            <p className="auth-sub">{avisoCodigo}</p>
            <form onSubmit={cambiarPassword}>
              <div className="field">
                <label htmlFor="codigo">Código de 6 dígitos</label>
                <input
                  id="codigo"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  autoFocus
                />
              </div>
              <div className="field">
                <label htmlFor="pass">Nueva contraseña</label>
                <input
                  id="pass"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="field">
                <label htmlFor="pass2">Confirmar contraseña</label>
                <input
                  id="pass2"
                  type="password"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  placeholder="Repite la contraseña"
                />
              </div>
              {estado === 'error' && (
                <p className="msg" style={{ color: '#c0392b' }}>{mensaje}</p>
              )}
              {link && (
                <p className="msg">
                  <Link to={link}>O usa el enlace enviado a tu correo</Link>
                </p>
              )}
              <button type="submit" className="btn-submit" disabled={cargando}>
                {cargando ? 'Guardando…' : 'Cambiar contraseña'}
              </button>
            </form>
            <p className="auth-link">
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setPaso(1)
                  setEstado('')
                  setMensaje('')
                  setCodigo('')
                }}
              >
                Usar otro correo
              </button>
              {' · '}
              <button type="button" className="link-btn" onClick={pedirEnlace}>
                Recibir un enlace
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
