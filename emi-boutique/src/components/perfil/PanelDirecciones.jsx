import { useState, useEffect } from 'react'
import { api } from '../../services/api'

const VACIO = { alias: '', direccion: '', direccion_info: '', ciudad: '', telefono: '' }

export default function PanelDirecciones() {
  const [lista, setLista] = useState(null)
  const [form, setForm] = useState(VACIO)
  const [editando, setEditando] = useState(null)
  const [abierto, setAbierto] = useState(false)
  const [predet, setPredet] = useState(false)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const cargar = () =>
    api
      .direcciones()
      .then((r) => setLista(r.direcciones || []))
      .catch(() => setLista([]))

  useEffect(() => {
    cargar()
  }, [])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const abrirNueva = () => {
    setForm(VACIO)
    setEditando(null)
    setPredet(false)
    setError('')
    setAbierto(true)
  }

  const abrirEditar = (d) => {
    setForm({
      alias: d.alias || '',
      direccion: d.direccion || '',
      direccion_info: d.direccion_info || '',
      ciudad: d.ciudad || '',
      telefono: d.telefono || '',
    })
    setEditando(d.id)
    setPredet(d.predeterminada)
    setError('')
    setAbierto(true)
  }

  const cerrar = () => {
    setAbierto(false)
    setEditando(null)
    setError('')
  }

  const guardar = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.direccion.trim()) {
      setError('Escribe la dirección de envío.')
      return
    }
    setGuardando(true)
    try {
      const datos = {
        alias: form.alias.trim(),
        direccion: form.direccion.trim(),
        direccion_info: form.direccion_info.trim(),
        ciudad: form.ciudad.trim(),
        telefono: form.telefono.trim(),
        predeterminada: predet,
      }
      const r = editando
        ? await api.actualizarDireccion(editando, datos)
        : await api.crearDireccion(datos)
      setLista(r.direcciones || [])
      cerrar()
    } catch (err) {
      setError(err.message || 'No se pudo guardar la dirección.')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta dirección?')) return
    try {
      const r = await api.eliminarDireccion(id)
      setLista(r.direcciones || [])
    } catch {
      /* nada */
    }
  }

  const marcarPredeterminada = async (id) => {
    try {
      const r = await api.actualizarDireccion(id, { predeterminada: true })
      setLista(r.direcciones || [])
    } catch {
      /* nada */
    }
  }

  return (
    <section className="perfil-card dirs-card">
      <div className="dirs-head">
        <h3><i className="bi bi-geo-alt" /> Mis direcciones</h3>
        {!abierto && (
          <button type="button" className="btn-save btn-mini" onClick={abrirNueva}>
            <i className="bi bi-plus-lg" /> Agregar
          </button>
        )}
      </div>
      <p className="dirs-nota">Guarda varias direcciones y elige a cuál enviar cada pedido al pagar.</p>

      {lista === null ? (
        <div className="pf-empty">Cargando direcciones…</div>
      ) : lista.length === 0 ? (
        <div className="pf-empty">Aún no tienes direcciones guardadas.</div>
      ) : (
        <ul className="dirs-list">
          {lista.map((d) => (
            <li className={`dirs-item ${d.predeterminada ? 'principal' : ''}`} key={d.id}>
              <div className="dirs-info">
                <span className="dirs-alias">
                  {d.alias}
                  {d.predeterminada && <span className="dirs-badge">Predeterminada</span>}
                </span>
                <span className="dirs-texto">
                  {d.direccion}
                  {d.direccion_info ? ` · ${d.direccion_info}` : ''}
                  {d.ciudad ? ` · ${d.ciudad}` : ''}
                  {d.telefono ? ` · Tel. ${d.telefono}` : ''}
                </span>
              </div>
              <div className="dirs-acciones">
                {!d.predeterminada && (
                  <button
                    type="button"
                    className="btn-ghost-mini"
                    onClick={() => marcarPredeterminada(d.id)}
                    title="Enviar aquí los pedidos por defecto"
                  >
                    <i className="bi bi-check2-circle" /> Usar esta dirección
                  </button>
                )}
                <button type="button" className="btn-ghost-mini" onClick={() => abrirEditar(d)} title="Editar">
                  <i className="bi bi-pencil" />
                </button>
                <button type="button" className="btn-ghost-mini peligro" onClick={() => eliminar(d.id)} title="Eliminar">
                  <i className="bi bi-trash" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {abierto && (
        <form className="dirs-form" onSubmit={guardar}>
          <div className="field">
            <label>Nombre de la dirección <span className="opt">(opcional)</span></label>
            <input value={form.alias} onChange={set('alias')} placeholder="Casa, Oficina, Novio…" maxLength={60} />
          </div>
          <div className="field">
            <label>Dirección</label>
            <input value={form.direccion} onChange={set('direccion')} placeholder="Calle, número" />
          </div>
          <div className="field">
            <label>Información adicional <span className="opt">(opcional)</span></label>
            <input value={form.direccion_info} onChange={set('direccion_info')} placeholder="Apto, torre, barrio, referencias…" maxLength={255} />
          </div>
          <div className="field">
            <label>Ciudad</label>
            <input value={form.ciudad} onChange={set('ciudad')} placeholder="Bogotá" />
          </div>
          <div className="field">
            <label>Teléfono de contacto <span className="opt">(opcional)</span></label>
            <input value={form.telefono} onChange={set('telefono')} placeholder="310 000 0000" maxLength={30} />
          </div>
          <label className="dirs-check">
            <input type="checkbox" checked={predet} onChange={(e) => setPredet(e.target.checked)} />
            Usar como dirección predeterminada
          </label>

          {error && <p className="msg-error">{error}</p>}

          <div className="dirs-form-acciones">
            <button type="submit" className="btn-save" disabled={guardando}>
              {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Guardar dirección'}
            </button>
            <button type="button" className="btn-ghost-mini" onClick={cerrar}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
