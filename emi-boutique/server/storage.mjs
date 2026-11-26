import { randomBytes } from 'node:crypto'
import { fallar, tipoImagen, extensionDe } from './http.mjs'

const BUCKET = 'emi'
const MAX_BYTES = 4 * 1024 * 1024

const base = () => (process.env.SUPABASE_URL || '').replace(/\/+$/, '')

/**
 * Guarda una imagen subida en Supabase Storage y devuelve su URL pública.
 * Valida por contenido real (JPG/PNG/WEBP/GIF) y tamaño (4 MB).
 */
export async function guardarImagen(archivo) {
  if (!base() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    fallar('El almacenamiento de imágenes no está configurado (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).', 500)
  }
  if (archivo.size > MAX_BYTES) fallar('La imagen no debe superar los 4 MB')
  const bytes = new Uint8Array(await archivo.arrayBuffer())
  const mime = tipoImagen(bytes)
  if (!mime) fallar('El archivo debe ser una imagen (JPG, PNG, WEBP o GIF)')

  const ruta = `p_${randomBytes(8).toString('hex')}.${extensionDe(mime)}`
  const res = await fetch(`${base()}/storage/v1/object/${BUCKET}/${ruta}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': mime,
      'x-upsert': 'false',
      'cache-control': 'max-age=31536000',
    },
    body: bytes,
  }).catch(() => null)
  if (!res || !res.ok) {
    console.error('[storage] fallo al subir', res?.status, res ? await res.text().catch(() => '') : '')
    fallar('No se pudo guardar la imagen', 502)
  }
  return urlPublica(ruta)
}

export const urlPublica = (ruta) => `${base()}/storage/v1/object/public/${BUCKET}/${ruta}`
