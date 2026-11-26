import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../services/api'

export default function Restablecer() {
  // Token de recuperación que llega por la URL
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [estado, setEstado] = useState('') // '', 'error', 'ok'
  const [mensaje, setMensaje] = useState('')
  const navigate = useNavigate()

  // Guardar la nueva contraseña
  const handleSubmit = async (e) => {
    e.preventDefault()
    setEstado('')
    setMensaje('')

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

    try {
      await api.restablecer(token, password)
      setEstado('ok')
      setMensaje('Contraseña actualizada correctamente.')
    } catch (err) {
      setEstado('error')
      setMensaje(err.message || 'No se pudo restablecer la contraseña.')
    }
  }

// Sin token: el enlace que llegó no es válido
  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h2>Enlace inválido</h2>
          <p className="auth-sub">Este enlace no tiene token de recuperación.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Nueva contraseña</h2>
        <p className="auth-sub">Elige una contraseña segura para tu cuenta.</p>

        {estado === 'ok' ? (
          <>
            <p className="msg">{mensaje}</p>
            <button className="btn-submit" onClick={() => navigate('/login')}>
              Ir a iniciar sesión
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="pass">Nueva contraseña</label>
              <input
                id="pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                autoFocus
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
            <button type="submit" className="btn-submit">Guardar contraseña</button>
          </form>
        )}
      </div>
    </div>
  )
}