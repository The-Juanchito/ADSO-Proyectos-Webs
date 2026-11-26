import postgres from 'postgres'
import { HttpError } from './http.mjs'

let conexion = null

/**
 * Conexión a Postgres (Supabase). Usa la cadena del "Transaction pooler"
 * en la variable DATABASE_URL (ver README).
 */
export function db() {
  if (conexion) return conexion
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new HttpError(500, 'El servidor no tiene configurada la base de datos (falta DATABASE_URL).')
  }
  const local = /@(localhost|127\.0\.0\.1)(:|\/)/.test(url) || process.env.DATABASE_SSL === 'off'
  conexion = postgres(url, {
    max: 1, // una conexión por instancia de la función (el pooler de Supabase hace el resto)
    prepare: false, // obligatorio con el pooler en modo transacción
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: local ? false : 'require',
    connection: { TimeZone: 'America/Bogota' },
    types: {
      // bigint/numeric llegan como número (no como texto)
      bigint: { to: 20, from: [20], serialize: (x) => String(x), parse: (x) => Number(x) },
      numeric: { to: 1700, from: [1700], serialize: (x) => String(x), parse: (x) => Number(x) },
      // Fechas como "YYYY-MM-DD HH:MM:SS" en hora de Bogotá (mismo formato que devolvía la API PHP)
      timestamptz: {
        to: 1184,
        from: [1184, 1114],
        serialize: (x) => (x instanceof Date ? x.toISOString() : String(x)),
        parse: (x) => String(x).slice(0, 19),
      },
    },
  })
  return conexion
}

/** Solo para pruebas: cierra y olvida la conexión. */
export async function cerrarDb() {
  if (conexion) {
    await conexion.end({ timeout: 2 })
    conexion = null
  }
}
