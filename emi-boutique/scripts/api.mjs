// Servidor local de la API (misma lógica que la función de Netlify). Uso: npm run api
import { createServer } from 'node:http'
import { Readable } from 'node:stream'
import { existsSync } from 'node:fs'

if (existsSync('.env')) process.loadEnvFile('.env')
process.env.ALLOW_DEV_CODES ??= '1'
const { manejar } = await import('../server/router.mjs')
const PUERTO = Number(process.env.API_PORT || 8888)

createServer(async (rq, rs) => {
  try {
    const host = rq.headers.host || `localhost:${PUERTO}`
    const init = { method: rq.method, headers: rq.headers }
    if (!['GET', 'HEAD'].includes(rq.method)) {
      init.body = Readable.toWeb(rq)
      init.duplex = 'half'
    }
    const res = await manejar(new Request(`http://${host}${rq.url}`, init))
    const cab = {}
    for (const [k, v] of res.headers) if (k !== 'set-cookie') cab[k] = v
    const cookies = res.headers.getSetCookie?.() ?? []
    if (cookies.length) cab['set-cookie'] = cookies
    rs.writeHead(res.status, cab)
    rs.end(Buffer.from(await res.arrayBuffer()))
  } catch (e) {
    console.error(e)
    rs.writeHead(500, { 'content-type': 'application/json' })
    rs.end(JSON.stringify({ ok: false, error: 'Error interno' }))
  }
}).listen(PUERTO, () => console.log(`API local en http://localhost:${PUERTO}/api  (usa .env para las claves)`))
