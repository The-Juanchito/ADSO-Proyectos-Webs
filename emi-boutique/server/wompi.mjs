// Integración con Wompi (pasarela de pagos de Colombia): Nequi, PSE, tarjetas,
// botón Bancolombia, Daviplata… Todo el cobro ocurre en la página segura de Wompi;
// nuestro servidor solo genera la firma, recibe el aviso (webhook) y verifica el resultado.
import { createHash, timingSafeEqual } from 'node:crypto'
import { fallar } from './http.mjs'
import { siteUrl } from './util.mjs'

export const wompiConfigurado = () =>
  !!(process.env.WOMPI_PUBLIC_KEY && process.env.WOMPI_INTEGRITY_SECRET)

export const wompiEntorno = () =>
  (process.env.WOMPI_PUBLIC_KEY || '').startsWith('pub_prod_') ? 'produccion' : 'pruebas'

const baseApi = () =>
  wompiEntorno() === 'produccion' ? 'https://production.wompi.co/v1' : 'https://sandbox.wompi.co/v1'

const sha256 = (s) => createHash('sha256').update(s).digest('hex')

/** URL del checkout de Wompi (con firma de integridad) para un pedido. */
export function urlCheckout({ referencia, total, correo, pedidoId }) {
  if (!wompiConfigurado()) fallar('Los pagos en línea no están disponibles por ahora.', 503)
  const centavos = Math.round(Number(total) * 100)
  const firma = sha256(`${referencia}${centavos}COP${process.env.WOMPI_INTEGRITY_SECRET}`)
  const p = new URLSearchParams({
    'public-key': process.env.WOMPI_PUBLIC_KEY,
    currency: 'COP',
    'amount-in-cents': String(centavos),
    reference: referencia,
    'signature:integrity': firma,
    'redirect-url': `${siteUrl()}/pago/resultado?pedido=${pedidoId}`,
  })
  if (correo) p.set('customer-data:email', correo)
  return `https://checkout.wompi.co/p/?${p.toString()}`
}

async function pedirApi(ruta) {
  const res = await fetch(`${baseApi()}${ruta}`, { signal: AbortSignal.timeout(10000) }).catch(() => null)
  if (!res || !res.ok) return null
  return res.json().catch(() => null)
}

/** Consulta una transacción por su id (fuente de verdad: Wompi, no el navegador). */
export async function consultarTransaccion(id) {
  const r = await pedirApi(`/transactions/${encodeURIComponent(id)}`)
  return r?.data ?? null
}

/** Busca la transacción más relevante de una referencia (aprobada primero, si existe). */
export async function consultarPorReferencia(referencia) {
  const r = await pedirApi(`/transactions?reference=${encodeURIComponent(referencia)}`)
  const lista = Array.isArray(r?.data) ? r.data : []
  if (!lista.length) return null
  return lista.find((t) => t.status === 'APPROVED') ?? lista[0]
}

/**
 * Verifica la firma de un evento (webhook) de Wompi:
 * SHA256( valores de signature.properties + timestamp + secreto de eventos ).
 */
export function checksumValido(evento, cabecera = '') {
  const secreto = process.env.WOMPI_EVENTS_SECRET
  if (!secreto) return false
  const props = evento?.signature?.properties
  if (!Array.isArray(props) || evento?.timestamp === undefined) return false
  let concat = ''
  for (const ruta of props) {
    const valor = String(ruta)
      .split('.')
      .reduce((o, k) => (o == null ? undefined : o[k]), evento.data)
    concat += valor === undefined || valor === null ? '' : String(valor)
  }
  const esperado = sha256(`${concat}${evento.timestamp}${secreto}`)
  const recibido = String(evento?.signature?.checksum || cabecera || '').toLowerCase()
  const a = Buffer.from(esperado)
  const b = Buffer.from(recibido)
  return a.length === b.length && timingSafeEqual(a, b)
}
