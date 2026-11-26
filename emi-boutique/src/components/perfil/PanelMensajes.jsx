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

export default function PanelMensajes() {
  const [mensajes, setMensajes] = useState(null)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const boxRef = useRef(null)

  const cargar = useCallback(() => {
    api
      .marcarMensajesLeidos()
      .then((r) => setMensajes(r.mensajes || []))
      .catch(() =>
        api
          .mensajes()
          .then((r) => setMensajes(r.mensajes || []))
          .catch(() => setMensajes([]))
      )
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  useEffect(() => {
    const el = boxRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [mensajes])

  const enviar = async (e) => {
    e.preventDefault()
    const t = texto.trim()
    if (!t || enviando) return
    setEnviando(true)
    setError('')
    try {
      const r = await api.enviarMensaje(t)
      setMensajes(r.mensajes || [])
      setTexto('')
    } catch (err) {
      setError(err.message || 'No se pudo enviar el mensaje.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="pf-chat">
      <div className="pf-chat-head">
        <span className="pf-chat-avatar"><i className="bi bi-shop" /></span>
        <div>
          <strong>EMI Boutique</strong>
          <small>Te respondemos lo antes posible</small>
        </div>
      </div>

      <div className="pf-chat-box" ref={boxRef}>
        {!mensajes ? (
          <div className="pf-chat-vacio">Cargando conversación…</div>
        ) : mensajes.length === 0 ? (
          <div className="pf-chat-vacio">
            <i className="bi bi-chat-heart" />
            <p>¿Tienes alguna duda sobre una prenda, un pedido o un envío? Escríbenos y te ayudamos.</p>
          </div>
        ) : (
          mensajes.map((m) => (
            <div key={m.id} className={`pf-burbuja ${m.autor === 'admin' ? 'de-admin' : 'mio'}`}>
              <div className="pf-burbuja-txt">{m.cuerpo}</div>
              <span className="pf-burbuja-fecha">{fechaHora(m.fecha)}</span>
            </div>
          ))
        )}
      </div>

      {error && <p className="msg-error">{error}</p>}

      <form className="pf-chat-form" onSubmit={enviar}>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribe tu mensaje…"
          maxLength={1000}
        />
        <button type="submit" disabled={enviando || !texto.trim()}>
          <i className={`bi ${enviando ? 'bi-hourglass-split' : 'bi-send'}`} /> {enviando ? 'Enviando' : 'Enviar'}
        </button>
      </form>
    </div>
  )
}
