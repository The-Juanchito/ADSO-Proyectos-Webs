import { useEffect, useRef, useState } from 'react'

export default function ScrollReveal({ children, as = 'div', className = '', ...props }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const revelar = () => {
      setVisible(true)
      io.unobserve(el)
      window.removeEventListener('scroll', verifica)
    }

    const io = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && revelar()),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    io.observe(el)

    // Failsafe: si el elemento ya está en pantalla al montar se revela igual
    // (el IO a veces no emite su callback inicial dentro de animaciones del padre).
    const enPantalla = () => {
      const r = el.getBoundingClientRect()
      const alto = window.innerHeight || document.documentElement.clientHeight
      return r.top < alto && r.bottom > 0
    }
    const verifica = () => {
      if (enPantalla()) revelar()
    }
    window.addEventListener('scroll', verifica, { passive: true })
    const t = setTimeout(() => {
      if (enPantalla()) revelar()
    }, 250)

    return () => {
      clearTimeout(t)
      window.removeEventListener('scroll', verifica)
      io.disconnect()
    }
  }, [])

  const Tag = as
  return (
    <Tag ref={ref} className={`reveal ${visible ? 'visible' : ''} ${className}`} {...props}>
      {children}
    </Tag>
  )
}