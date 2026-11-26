import { useEffect, useRef, useState } from 'react'

export default function CountUp({ target, duration = 1200, prefix = '', suffix = '', decimals = 0 }) {
  const [display, setDisplay] = useState(`${prefix}0${suffix}`)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || started.current) return

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return
        started.current = true
        io.unobserve(el)

        const num = Number(target) || 0
        const startTime = performance.now()

        const tick = (now) => {
          const elapsed = now - startTime
          const progress = Math.min(elapsed / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          const current = eased * num

          if (num >= 1000) {
            setDisplay(`${prefix}${Math.round(current).toLocaleString('es-CO')}${suffix}`)
          } else if (decimals > 0) {
            setDisplay(`${prefix}${current.toFixed(decimals)}${suffix}`)
          } else {
            setDisplay(`${prefix}${Math.round(current)}${suffix}`)
          }

          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { threshold: 0.3 }
    )

    io.observe(el)
    return () => io.disconnect()
  }, [target, duration, prefix, suffix, decimals])

  return (
    <span ref={ref} className="countup">
      {display}
    </span>
  )
}
