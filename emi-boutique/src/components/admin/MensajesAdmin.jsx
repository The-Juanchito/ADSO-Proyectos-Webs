import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../../services/api'

const fechaHora = (f) => {
  if (!f) return ''
  try {
    return new Date(f).toLocaleString('es-CO', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export default function MensajesAdmin() {
  const [busca, setBusca] = useState('')
  const [convs, setConvs] = useState(null)
  const [extra, setExtra] = useState([])
  const [sel, setSel] = useState(null)
  const [hilo, setHilo] = useState(null)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const boxRef = useRef(null)

  const cargarConvs = useCallback((q) => {
    Promise.all([
      api.mensajesAdmin(q),
      q.trim() ? api.buscarUsuarios(q) : Promise.resolve({ usuarios: [] }),
    ])
      .then(([c, u]) => {
        const lista = c.conversaciones || []
        setConvs(lista)
        const ids = new Set(lista.map((x) => x.usuario_id))
        setExtra((u.usuarios || []).filter((x) => !ids.has(x.usuario_id)))
      })
      .catch(() => {
        setConvs([])
        setExtra([])
      })
  }, [])

  useEffect(() => {
    const t = setTimeout(() => cargarConvs(busca), 350)
    return () => clearTimeout(t)
  }, [busca, cargarConvs])

  useEffect(() => {
    const el = boxRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [hilo])

  const abrir = (usuario) => {
    setSel(usuario)
    setHilo(null)
    setError('')
    api
      .mensajesAdminUsuario(usuario.usuario_id)
      .then((r) => {
        setHilo(r.mensajes || [])
        setConvs((prev) => (prev ? prev.map((c) => (c.usuario_id === usuario.usuario_id ? { ...c, sin_leer: 0 } : c)) : prev))
      })
      .catch(() => setHilo([]))
  }

  const enviar = async (e) => {
    e.preventDefault()
    const t = texto.trim()
    if (!t || enviando || !sel) return
    setEnviando(true)
    setError('')
    try {
      const r = await api.enviarMensajeAdmin(sel.usuario_id, t)
      setHilo(r.mensajes || [])
      setTexto('')
      cargarConvs(busca)
    } catch (err) {
      setError(err.message || 'No se pudo enviar el mensaje.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="adm-msg">
      {/* Lista de conversaciones */}
      <aside className={`adm-msg-lista ${sel ? 'oculto-movil' : ''}`}>
        <div className="adm-msg-busca">
          <i className="bi bi-search" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nombre o correo…"
          />
        </div>

        {!convs ? (
          <div className="empty">Cargando conversaciones…</div>
        ) : (
          <>
            {convs.length === 0 && extra.length === 0 && (
              <div className="empty">No hay conversaciones{busca ? ' con esa búsqueda' : 'aún'}.</div>
            )}
            {convs.map((c) => (
              <button
                key={c.usuario_id}
                className={`adm-msg-conv ${sel?.usuario_id === c.usuario_id ? 'activo' : ''}`}
                onClick={() => abrir(c)}
              >
                <span className="avatar">{c.nombre?.charAt(0)?.toUpperCase() || 'U'}</span>
                <span className="info">
                  <span className="fila">
                    <strong>{c.nombre}</strong>
                    <small>{fechaHora(c.fecha)}</small>
                  </span>
                  <span className="extracto">{c.ultimo || 'Sin mensajes'}</span>
                </span>
                {c.sin_leer > 0 && <span className="sin-leer">{c.sin_leer}</span>}
              </button>
            ))}

            {extra.length > 0 && (
              <>
                <div className="adm-msg-sub">Otros usuarios</div>
                {extra.map((u) => (
                  <button key={u.usuario_id} className="adm-msg-conv" onClick={() => abrir(u)}>
                    <span className="avatar">{u.nombre?.charAt(0)?.toUpperCase() || 'U'}</span>
                    <span className="info">
                      <span className="fila"><strong>{u.nombre}</strong></span>
                      <span className="extracto">{u.correo}</span>
                    </span>
                    <span className="nuevo-tag">Escribir</span>
                  </button>
                ))}
              </>
            )}
          </>
        )}
      </aside>

      {/* Hilo seleccionado */}
      <section className={`adm-msg-hilo ${sel ? '' : 'oculto-movil'}`}>
        {!sel ? (
          <div className="adm-msg-vacio">
            <i className="bi bi-chat-square-dots" />
            <p>Elige una conversación para ver y responder los mensajes de tus clientas.</p>
          </div>
        ) : (
          <>
            <header className="adm-msg-head">
              <button className="volver" onClick={() => setSel(null)} aria-label="Volver">
                <i className="bi bi-arrow-left" />
              </button>
              <span className="avatar">{sel.nombre?.charAt(0)?.toUpperCase() || 'U'}</span>
              <div>
                <strong>{sel.nombre}</strong>
                <small>{sel.correo}</small>
              </div>
            </header>

            <div className="adm-msg-box" ref={boxRef}>
              {!hilo ? (
                <div className="empty">Cargando…</div>
              ) : hilo.length === 0 ? (
                <div className="empty">Aún no hay mensajes. Escribe el primero.</div>
              ) : (
                hilo.map((m) => (
                  <div key={m.id} className={`pf-burbuja ${m.autor === 'admin' ? 'mio' : 'de-admin'}`}>
                    <div className="pf-burbuja-txt">{m.cuerpo}</div>
                    <span className="pf-burbuja-fecha">{fechaHora(m.fecha)}</span>
                  </div>
                ))
              )}
            </div>

            {error && <p className="msg-error">{error}</p>}

            <form className="adm-msg-form" onSubmit={enviar}>
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder={`Responder a ${sel.nombre}…`}
                maxLength={1000}
                rows={2}
              />
              <button type="submit" disabled={enviando || !texto.trim()}>
                <i className={`bi ${enviando ? 'bi-hourglass-split' : 'bi-send'}`} /> {enviando ? 'Enviando' : 'Enviar'}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  )
}
