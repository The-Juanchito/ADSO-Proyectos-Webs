import { useEffect, useRef } from 'react'

export default function HorizontalScroller({ className, children, ...rest }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined

    let activo = false
    let inicioX = 0
    let inicioScroll = 0
    let movido = false

    const UMBRAL = 6

    const alBajar = (e) => {
      if (e.pointerType === 'touch' || e.button !== 0) return
      activo = true
      movido = false
      inicioX = e.clientX
      inicioScroll = el.scrollLeft
    }

    const alMover = (e) => {
      if (!activo) return
      const dx = e.clientX - inicioX
      if (!movido && Math.abs(dx) > UMBRAL) {
        movido = true
        el.classList.add('arrastrando')
      }
      if (!movido) return
      el.scrollLeft = inicioScroll - dx
      e.preventDefault()
    }

    const alSoltar = () => {
      if (!activo) return
      activo = false
      el.classList.remove('arrastrando')
    }

    const alClick = (e) => {
      if (movido) {
        e.preventDefault()
        e.stopPropagation()
        movido = false
      }
    }

    el.addEventListener('pointerdown', alBajar)
    window.addEventListener('pointermove', alMover, { passive: false })
    window.addEventListener('pointerup', alSoltar)
    window.addEventListener('pointercancel', alSoltar)
    el.addEventListener('click', alClick, true)

    return () => {
      el.removeEventListener('pointerdown', alBajar)
      window.removeEventListener('pointermove', alMover)
      window.removeEventListener('pointerup', alSoltar)
      window.removeEventListener('pointercancel', alSoltar)
      el.removeEventListener('click', alClick, true)
    }
  }, [])

  return (
    <div ref={ref} className={className} {...rest}>
      {children}
    </div>
  )
}
