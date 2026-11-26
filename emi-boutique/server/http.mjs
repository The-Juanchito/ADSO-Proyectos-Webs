// Utilidades HTTP, errores y lectura del cuerpo de la petición.

export class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message)
    this.status = status
    this.extra = extra
  }
}

/** Lanza un error HTTP con el mismo formato que usaba la API PHP: { ok:false, error }. */
export const fallar = (mensaje, status = 400, extra = {}) => {
  throw new HttpError(status, mensaje, extra)
}

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...headers,
    },
  })

export const ok = (datos = {}) => ({ ok: true, ...datos })

const TIPOS_IMAGEN = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

/** Detecta el tipo real de imagen por sus primeros bytes (no confía en el nombre ni en el MIME). */
export function tipoImagen(bytes) {
  const b = bytes
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png'
  if (b.length > 6 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return 'image/gif'
  if (
    b.length > 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) return 'image/webp'
  return null
}
export const extensionDe = (mime) => TIPOS_IMAGEN[mime]

/**
 * Lee el cuerpo: JSON o multipart/form-data.
 * Devuelve { datos, archivos } donde archivos[campo] = [File, ...]
 * (los campos tipo "imgs[]" se normalizan a "imgs").
 */
export async function leerCuerpo(req) {
  const tipo = req.headers.get('content-type') || ''
  if (tipo.includes('multipart/form-data')) {
    const fd = await req.formData()
    const datos = {}
    const archivos = {}
    for (const [clave, valor] of fd.entries()) {
      const k = clave.replace(/\[\]$/, '')
      if (typeof valor === 'string') {
        datos[k] = valor
      } else if (valor && valor.size > 0) {
        ;(archivos[k] ||= []).push(valor)
      }
    }
    return { datos, archivos }
  }
  if (tipo.includes('application/json')) {
    const d = await req.json().catch(() => null)
    return { datos: d && typeof d === 'object' && !Array.isArray(d) ? d : {}, archivos: {} }
  }
  return { datos: {}, archivos: {} }
}
