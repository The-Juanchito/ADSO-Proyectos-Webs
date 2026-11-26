// Helpers pequeños compartidos por todo el backend.

export const bool = (v) => v === true || v === 1 || v === '1' || v === 'true' || v === 'on'

export const texto = (v, def = '') => (v === undefined || v === null ? def : String(v)).trim()

export const entero = (v, def = 0) => {
  const n = parseInt(String(v), 10)
  return Number.isFinite(n) ? n : def
}

export const recortar = (v, largo) => Array.from(texto(v)).slice(0, largo).join('')

export const esCorreo = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || ''))

export const esId = (v) => typeof v === 'string' && /^\d+$/.test(v)

export const escaparHtml = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export const formatoCOP = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('es-CO')

/** URL pública del sitio (para enlaces en correos y retorno de pagos). */
export function siteUrl() {
  const u = process.env.SITE_URL || process.env.URL || process.env.DEPLOY_PRIME_URL || 'http://localhost:8888'
  return u.replace(/\/+$/, '')
}

export const enlaceAbsoluto = (ruta) => {
  if (!ruta) return ''
  if (/^https?:\/\//i.test(ruta)) return ruta
  return siteUrl() + '/' + String(ruta).replace(/^\/+/, '')
}

/** Precio final con descuento porcentual (mismo cálculo que el frontend). */
export const precioFinal = (precio, descuento) => {
  const d = Number(descuento) || 0
  return d > 0 ? Math.round(Number(precio) * (1 - d / 100)) : Number(precio)
}
