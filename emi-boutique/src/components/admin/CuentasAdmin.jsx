import { useState, useEffect } from 'react'
import { api } from '../../services/api'

const ROLES = [
  { id: 'cliente', etiqueta: 'Cliente', icono: 'bi-bag-heart' },
  { id: 'empleado', etiqueta: 'Empleado', icono: 'bi-person-badge' },
  { id: 'administrador', etiqueta: 'Administrador', icono: 'bi-shield-check' },
]

const VACIO = { nombre: '', correo: '', password: '', rol: 'empleado' }

const rolInfo = (rol) => ROLES.find((r) => r.id === rol) || ROLES[0]

const formatFecha = (f) => {
  if (!f) return ''
  const d = new Date(String(f).replace(' ', 'T'))
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function CuentasAdmin() {
  const [cuentas, setCuentas] = useState(null)
  const [form, setForm] = useState(VACIO)
  const [verPass, setVerPass] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [guardando, setGuardando] = useState(false)

  const cargar = () =>
    api
      .cuentas()
      .then((r) => setCuentas(r.cuentas || []))
      .catch(() => setCuentas([]))

  useEffect(() => {
    cargar()
  }, [])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const crear = async (e) => {
    e.preventDefault()
    setError('')
    setOk('')
    if (!form.nombre.trim() || !form.correo.trim() || !form.password) {
      setError('Completa el nombre, el correo y la contraseña.')
      return
    }
    setGuardando(true)
    try {
      const r = await api.crearCuenta({
        nombre: form.nombre.trim(),
        correo: form.correo.trim(),
        password: form.password,
        rol: form.rol,
      })
      setCuentas(r.cuentas || [])
      setOk(`Cuenta creada para ${form.correo.trim()} como ${rolInfo(form.rol).etiqueta}.`)
      setForm({ ...VACIO, rol: form.rol })
      setVerPass(false)
    } catch (err) {
      setError(err.message || 'No se pudo crear la cuenta.')
    } finally {
      setGuardando(false)
    }
  }

  const cambiarRol = async (c, rol) => {
    if (rol === c.rol) return
    setError('')
    setOk('')
    try {
      const r = await api.actualizarCuenta(c.id, { rol })
      setCuentas(r.cuentas || [])
      setOk(`${c.nombre} ahora es ${rolInfo(rol).etiqueta}.`)
    } catch (err) {
      setError(err.message || 'No se pudo cambiar el rol.')
    }
  }

  const alternarEstado = async (c) => {
    setError('')
    setOk('')
    try {
      const r = await api.actualizarCuenta(c.id, { estado: c.estado ? 0 : 1 })
      setCuentas(r.cuentas || [])
      setOk(`${c.nombre} ${c.estado ? 'desactivada' : 'activada'}.`)
    } catch (err) {
      setError(err.message || 'No se pudo cambiar el estado.')
    }
  }

  const cambiarClave = async (c) => {
    const nueva = window.prompt(`Nueva contraseña para ${c.nombre}:`)
    if (!nueva) return
    setError('')
    setOk('')
    try {
      const r = await api.actualizarCuenta(c.id, { password: nueva })
      setCuentas(r.cuentas || [])
      setOk('Contraseña actualizada.')
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la contraseña.')
    }
  }

  return (
    <div className="cuentas-admin">
      <div className="form-card">
        <div className="form-head">
          <h3><i className="bi bi-person-plus" /> Nueva cuenta del equipo</h3>
        </div>
        <p className="cta-ayuda">
          Crea cuentas para <b>empleados</b> (acceso al panel), clientes o administradores.
        </p>
        <form onSubmit={crear}>
          <div className="field">
            <label>Nombre completo</label>
            <input value={form.nombre} onChange={set('nombre')} placeholder="Ej: María Pérez" maxLength={100} />
          </div>
          <div className="field">
            <label>Correo</label>
            <input
              type="email"
              value={form.correo}
              onChange={set('correo')}
              placeholder="correo@ejemplo.com"
              maxLength={150}
              autoComplete="off"
            />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <div className="cta-pass">
              <input
                type={verPass ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="cta-ojo"
                onClick={() => setVerPass((v) => !v)}
                title={verPass ? 'Ocultar' : 'Mostrar'}
              >
                <i className={`bi ${verPass ? 'bi-eye-slash' : 'bi-eye'}`} />
              </button>
            </div>
          </div>
          <div className="field">
            <label>Rol</label>
            <div className="cta-roles">
              {ROLES.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  className={`cta-rol ${r.id} ${form.rol === r.id ? 'activo' : ''}`}
                  onClick={() => setForm((f) => ({ ...f, rol: r.id }))}
                >
                  <i className={`bi ${r.icono}`} /> {r.etiqueta}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="msg-error">{error}</p>}
          {ok && <p className="msg-ok">{ok}</p>}
          <button type="submit" className="btn-primary" disabled={guardando}>
            {guardando ? 'Creando…' : 'Crear cuenta'}
          </button>
        </form>
      </div>

      <div className="table-card">
        <div className="table-head">
          <h2><i className="bi bi-people" /> Cuentas registradas</h2>
          {cuentas && <span>{cuentas.length} cuentas</span>}
        </div>
        {cuentas === null ? (
          <p className="td empty">Cargando…</p>
        ) : cuentas.length === 0 ? (
          <p className="td empty">Aún no hay cuentas.</p>
        ) : (
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cuentas.map((c) => {
                  const info = rolInfo(c.rol)
                  return (
                    <tr key={c.id}>
                      <td><b>{c.nombre}</b></td>
                      <td className="cta-correo">{c.correo}</td>
                      <td>
                        <span className={`rol-badge ${c.rol}`}>
                          <i className={`bi ${info.icono}`} /> {info.etiqueta}
                        </span>
                      </td>
                      <td>
                        <span className={`cta-estado ${c.estado ? 'on' : 'off'}`}>
                          <i className={`bi ${c.estado ? 'bi-check-circle-fill' : 'bi-pause-circle'}`} />{' '}
                          {c.estado ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="cta-fecha">{formatFecha(c.fecha)}</td>
                      <td>
                        <div className="cta-acciones">
                          <select value={c.rol} onChange={(e) => cambiarRol(c, e.target.value)} title="Cambiar rol">
                            {ROLES.map((r) => (
                              <option key={r.id} value={r.id}>{r.etiqueta}</option>
                            ))}
                          </select>
                          <button type="button" className="cta-btn" onClick={() => cambiarClave(c)} title="Cambiar contraseña">
                            <i className="bi bi-key" />
                          </button>
                          <button
                            type="button"
                            className={`cta-btn ${c.estado ? 'peligro' : ''}`}
                            onClick={() => alternarEstado(c)}
                            title={c.estado ? 'Desactivar' : 'Activar'}
                          >
                            <i className={`bi ${c.estado ? 'bi-slash-circle' : 'bi-arrow-counterclockwise'}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
