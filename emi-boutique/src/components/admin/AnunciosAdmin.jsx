import { useState, useEffect } from 'react'
import { api } from '../../services/api'

const VACIO = { titulo: '', mensaje: '', activo: true }

export default function AnunciosAdmin() {
  const [lista, setLista] = useState(null)
  const [form, setForm] = useState(VACIO)
  const [archivo, setArchivo] = useState(null)
  const [preview, setPreview] = useState('')
  const [editando, setEditando] = useState(null)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const cargar = () =>
    api
      .anunciosAdmin()
      .then((r) => setLista(r.anuncios || []))
      .catch(() => setLista([]))

  useEffect(() => {
    cargar()
  }, [])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const limpiar = () => {
    setForm(VACIO)
    setArchivo(null)
    setPreview('')
    setEditando(null)
    setError('')
  }

  const elegirImagen = (e) => {
    const f = e.target.files[0]
    if (!f) return
    if (!f.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen.')
      return
    }
    setError('')
    setArchivo(f)
    setPreview(URL.createObjectURL(f))
  }

  const guardar = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.titulo.trim() || !form.mensaje.trim()) {
      setError('Escribe el título y el mensaje del anuncio.')
      return
    }
    setGuardando(true)
    try {
      const datos = new FormData()
      datos.append('titulo', form.titulo.trim())
      datos.append('mensaje', form.mensaje.trim())
      datos.append('activo', form.activo ? '1' : '0')
      if (archivo instanceof File) datos.append('imagen', archivo)
      const r = editando
        ? await api.actualizarAnuncio(editando, datos)
        : await api.crearAnuncio(datos)
      setLista(r.anuncios || [])
      limpiar()
    } catch (err) {
      setError(err.message || 'No se pudo guardar el anuncio.')
    } finally {
      setGuardando(false)
    }
  }

  const editar = (a) => {
    setEditando(a.id)
    setForm({ titulo: a.titulo, mensaje: a.mensaje, activo: a.activo })
    setArchivo(null)
    setPreview(a.imagen || '')
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const alternar = async (a) => {
    try {
      const r = await api.actualizarAnuncio(a.id, { activo: !a.activo })
      setLista(r.anuncios || [])
    } catch {
      /* nada */
    }
  }

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este anuncio?')) return
    try {
      const r = await api.borrarAnuncio(id)
      setLista(r.anuncios || [])
      if (editando === id) limpiar()
    } catch {
      /* nada */
    }
  }

  return (
    <div className="anu-admin">
      <div className="form-card">
        <div className="form-head">
          <h3><i className="bi bi-megaphone" /> {editando ? 'Editar anuncio' : 'Nuevo anuncio'}</h3>
          {editando && (
            <button type="button" className="btn-cancel-edit" onClick={limpiar}>
              <i className="bi bi-x" /> Cancelar edición
            </button>
          )}
        </div>
        <p className="anu-ayuda">
          El anuncio se mostrará a los usuarios cuando inicien sesión. Puedes subir una foto.
        </p>
        <form onSubmit={guardar}>
          <div className="field">
            <label>Título</label>
            <input value={form.titulo} onChange={set('titulo')} placeholder="Ej: Envío gratis esta semana" maxLength={150} />
          </div>
          <div className="field">
            <label>Mensaje</label>
            <textarea value={form.mensaje} onChange={set('mensaje')} placeholder="Escribe el anuncio…" rows={3} maxLength={1000} />
          </div>
          <div className="field">
            <label>Foto <span className="opt">(opcional)</span></label>
            <div className="anu-img-row">
              {preview && <img className="anu-preview" src={preview} alt="Vista previa" />}
              <label className="btn-upload">
                {archivo ? 'Cambiar foto…' : 'Subir foto'}
                <input type="file" accept="image/*" onChange={elegirImagen} hidden />
              </label>
            </div>
            <p className="ayuda">JPG, PNG, WEBP o GIF. Máximo 4 MB.</p>
          </div>
          <label className="switch">
            <span className="switch-nuevo"><i className="bi bi-broadcast" /> Publicar (visible al iniciar sesión)</span>
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
            />
            <span className="slider" />
          </label>
          {error && <p className="msg-error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={guardando}>
            {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Publicar anuncio'}
          </button>
        </form>
      </div>

      <div className="anu-lista-card">
        <div className="form-head">
          <h3><i className="bi bi-collection" /> Anuncios publicados</h3>
          {lista && <span className="anu-count">{lista.length}</span>}
        </div>
        {lista === null ? (
          <p className="anu-vacio">Cargando…</p>
        ) : lista.length === 0 ? (
          <p className="anu-vacio">Aún no has creado anuncios.</p>
        ) : (
          <ul className="anu-lista">
            {lista.map((a) => (
              <li className={`anu-item ${a.activo ? 'activo' : 'inactivo'}`} key={a.id}>
                {a.imagen ? (
                  <img src={a.imagen} alt={a.titulo} />
                ) : (
                  <span className="anu-sinimg"><i className="bi bi-image" /></span>
                )}
                <div className="anu-info">
                  <strong>{a.titulo}</strong>
                  <span>{a.mensaje}</span>
                  <span className={`anu-estado ${a.activo ? 'on' : 'off'}`}>
                    <i className={`bi ${a.activo ? 'bi-check-circle-fill' : 'bi-pause-circle'}`} />{' '}
                    {a.activo ? 'Publicado' : 'Oculto'}
                  </span>
                </div>
                <div className="anu-acciones">
                  <button type="button" className="anu-btn" onClick={() => alternar(a)} title={a.activo ? 'Ocultar' : 'Publicar'}>
                    <i className={`bi ${a.activo ? 'bi-eye-slash' : 'bi-eye'}`} />
                  </button>
                  <button type="button" className="anu-btn" onClick={() => editar(a)} title="Editar">
                    <i className="bi bi-pencil" />
                  </button>
                  <button type="button" className="anu-btn peligro" onClick={() => eliminar(a.id)} title="Eliminar">
                    <i className="bi bi-trash" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
