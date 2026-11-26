import { useState } from 'react'

export default function Contactos() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ nombre: '', email: '', mensaje: '' })

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  // Simular envío del mensaje
  const handleSubmit = (e) => {
    e.preventDefault()
    setSent(true)
    setForm({ nombre: '', email: '', mensaje: '' })
  }

  const info = (titulo, icono, datos) => ({ titulo, icono, datos })

  const redes = [
    { nombre: 'WhatsApp', icono: 'bi-whatsapp', url: 'https://wa.me/3015939779', color: '#25d366' },
    { nombre: 'Instagram', icono: 'bi-instagram', url: 'https://instagram.com/emi.boutique_22', color: '#e1306c' },
  ]

  const tarjetas = [
    info('Dirección', '📍', [['Calle', 'FREDONIA  CALLE 10 '], ['Ciudad', 'cartagena'], ['País', 'Colombia']]),
    info('Contacto', '☎️', [
      ['Teléfono', '301 593 9779'],
      ['Correo', 'maryurisherediamorels@gmail.com'],
    ]),
    info('Horario', '🕐', [['Lun - Vie', '9:00 am - 7:00 pm'], ['Sábado - Domingo', '10:00 am - 8:00 pm']]),
    info('Síguenos', '💫', []),
  ]

  return (
    <>
      <header className="page-hero">
        <span className="crumb">Contacto</span>
        <h1>Estamos para ti</h1>
        <p>
          EMI Boutique — Moda femenina con más de 5 años vistiendo a la mujer que
          ama sentirse única.
        </p>
      </header>

      {/* Tarjetas con la información de la tienda */}
      <div className="contact-grid">
        <div>
          {tarjetas.map((t) => (
            <div className="info-card" key={t.titulo}>
              <h3>{t.icono} {t.titulo}</h3>
              {t.titulo === 'Contacto' && (
                <p className="whatsapp-row">
                  <b>WhatsApp:</b>
                  <a href={redes[0].url} target="_blank" rel="noreferrer">
                    <i className={`bi ${redes[0].icono}`} style={{ color: redes[0].color }} />
                    +57 301 593 9779
                  </a>
                </p>
              )}
              {t.datos.map(([k, v]) => (
                v !== '' ? <p key={k}><b>{k}:</b> {v}</p> : null
              ))}
              {t.titulo === 'Síguenos' && (
                <div className="social-row">
                  {redes.map((r) => (
                    <a
                      key={r.nombre}
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="social-btn"
                      style={{ '--color': r.color }}
                      title={r.nombre}
                      aria-label={r.nombre}
                    >
                      <i className={`bi ${r.icono}`} />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Formulario de contacto */}
        <div className="contact-form">
          <h3>Escríbenos</h3>
          <p>Te respondemos en menos de 24 horas.</p>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="c-nombre">Nombre</label>
              <input id="c-nombre" value={form.nombre} onChange={set('nombre')} placeholder="Tu nombre" required />
            </div>
            <div className="field">
              <label htmlFor="c-email">Correo</label>
              <input id="c-email" type="email" value={form.email} onChange={set('email')} placeholder="tucorreo@ejemplo.com" required />
            </div>
            <div className="field">
              <label htmlFor="c-mensaje">Mensaje</label>
              <textarea id="c-mensaje" rows="5" value={form.mensaje} onChange={set('mensaje')} placeholder="¿En qué podemos ayudarte?" required />
            </div>
            <button type="submit" className="btn-submit">
              {sent ? '¡Mensaje enviado! ✨' : 'Enviar mensaje'}
            </button>
          </form>
        </div>
      </div>

      {/* Bloque final de la marca */}
      <section className="store-info">
        <div className="inner">
          <h3>EMI Boutique</h3>
          <p>Vestimos tu esencia. Moda femenina, calidad y buen gusto desde el corazón.</p>
        </div>
      </section>
    </>
  )
}