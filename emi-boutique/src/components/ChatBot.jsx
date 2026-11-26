import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'

const SUGERENCIAS = [
  '¿Qué vestidos tienen disponibles?',
  '¿Cuánto cuesta una blusa?',
  '¿Hacen envíos a todo el país?',
  '¿Qué medios de pago aceptan?',
]

const BIENVENIDA = {
  rol: 'assistant',
  contenido:
    '¡Hola! Soy Emi, tu asesora de moda de EMI Boutique. 💕 Pregúntame por productos, precios, tallas, disponibilidad, envíos o servicios de pago.',
}

function precioFinal(p) {
  const precio = Number(p.precio) || 0
  const dcto = Number(p.descuento) || 0
  return Math.round(precio - (precio * dcto) / 100)
}

function formatoPrecio(n) {
  return '$' + Number(n).toLocaleString('es-CO')
}

function TarjetaProductoChat({ p }) {
  const final = precioFinal(p)
  const tieneDcto = Number(p.descuento) > 0
  const agotado = Number(p.stock) <= 0

  return (
    <Link to={`/producto/${p.id}`} className="chat-prod">
      <div className="chat-prod-img">
        {p.img ? (
          <img src={p.img} alt={p.nombre} loading="lazy" />
        ) : (
          <span className="chat-prod-sin-foto"><i className="bi bi-image" /></span>
        )}
        {tieneDcto && <span className="chat-prod-dcto">-{p.descuento}%</span>}
        {agotado && <span className="chat-prod-agotado">Agotado</span>}
      </div>
      <div className="chat-prod-info">
        <span className="chat-prod-cat">{p.categoria}</span>
        <strong className="chat-prod-nombre">{p.nombre}</strong>
        {p.descripcion && <p className="chat-prod-desc">{p.descripcion}</p>}
        <div className="chat-prod-meta">
          {Number(p.num_resenas) > 0 && (
            <span className="chat-prod-stars">
              <i className="bi bi-star-fill" /> {p.promedio}
            </span>
          )}
          {Array.isArray(p.tallas) && p.tallas.length > 0 && (
            <span className="chat-prod-tallas">{p.tallas.join(' · ')}</span>
          )}
        </div>
        <div className="chat-prod-precio">
          <b>{formatoPrecio(final)}</b>
          {tieneDcto && <s>{formatoPrecio(p.precio)}</s>}
        </div>
      </div>
      <span className="chat-prod-ver"><i className="bi bi-arrow-right" /></span>
    </Link>
  )
}

export default function ChatBot() {
  const [abierto, setAbierto] = useState(false)
  const [mensajes, setMensajes] = useState([BIENVENIDA])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const finRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (abierto && finRef.current) {
      finRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [mensajes, abierto, enviando])

  useEffect(() => {
    if (abierto) inputRef.current?.focus()
  }, [abierto])

  const enviar = async (textoUsuario) => {
    const pregunta = (textoUsuario ?? texto).trim()
    if (!pregunta || enviando) return
    const historial = mensajes.map((m) => ({ rol: m.rol, contenido: m.contenido }))
    setMensajes((prev) => [...prev, { rol: 'user', contenido: pregunta }])
    setTexto('')
    setEnviando(true)
    try {
      const { respuesta, productos } = await api.chat(pregunta, historial)
      setMensajes((prev) => [...prev, { rol: 'assistant', contenido: respuesta, productos: productos || [] }])
    } catch (e) {
      setMensajes((prev) => [
        ...prev,
        { rol: 'assistant', contenido: e.message || 'Lo siento, no pude responder en este momento. Intenta de nuevo. 💕' },
      ])
    } finally {
      setEnviando(false)
    }
  }

  const onSubmit = (e) => {
    e.preventDefault()
    enviar()
  }

  return (
    <>
      <button
        type="button"
        className={`chat-fab ${abierto ? 'abierto' : ''}`}
        onClick={() => setAbierto((v) => !v)}
        aria-label={abierto ? 'Cerrar asistente' : 'Abrir asistente'}
      >
        <i className={`bi ${abierto ? 'bi-x-lg' : 'bi-chat-dots-fill'}`} />
        {!abierto && <span className="chat-fab-punto" />}
      </button>

      {abierto && (
        <div className="chat-panel" role="dialog" aria-label="Asistente de EMI Boutique">
          <header className="chat-head">
            <span className="chat-avatar"><i className="bi bi-stars" /></span>
            <div className="chat-head-txt">
              <b>Emi · Asistente</b>
              <small><i className="bi bi-circle-fill" /> En línea</small>
            </div>
            <button type="button" className="chat-cerrar" onClick={() => setAbierto(false)} aria-label="Cerrar">
              <i className="bi bi-x-lg" />
            </button>
          </header>

          <div className="chat-cuerpo">
            {mensajes.map((m, i) => (
              <div key={i} className={`chat-grupo ${m.rol}`}>
                <div className={`chat-msg ${m.rol}`}>{m.contenido}</div>
                {Array.isArray(m.productos) && m.productos.length > 0 && (
                  <div className="chat-productos">
                    <span className="chat-productos-titulo">
                      <i className="bi bi-bag-heart" /> Productos que te pueden interesar
                    </span>
                    {m.productos.map((p) => (
                      <TarjetaProductoChat key={p.id} p={p} />
                    ))}
                  </div>
                )}
              </div>
            ))}
            {enviando && (
              <div className="chat-msg assistant escribiendo" aria-label="Escribiendo">
                <span /><span /><span />
              </div>
            )}
            <div ref={finRef} />
          </div>

          {mensajes.length <= 1 && (
            <div className="chat-sugerencias">
              {SUGERENCIAS.map((s) => (
                <button key={s} type="button" onClick={() => enviar(s)}>{s}</button>
              ))}
            </div>
          )}

          <form className="chat-input" onSubmit={onSubmit}>
            <input
              ref={inputRef}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escribe tu pregunta…"
              aria-label="Escribe tu pregunta"
            />
            <button type="submit" disabled={enviando || !texto.trim()} aria-label="Enviar">
              <i className="bi bi-send-fill" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
