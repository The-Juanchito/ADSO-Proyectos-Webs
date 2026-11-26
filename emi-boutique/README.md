# EMI Boutique

Tienda en línea de moda femenina. **React + Vite** (frontend) · **Netlify Functions** (API en Node) · **Supabase** (base de datos Postgres + imágenes) · **Wompi** (pagos reales en Colombia).

```
Navegador ──► Netlify (sitio + /api/*) ──► Supabase (datos e imágenes)
                       │
                       └──► Wompi (cobro)  ──► webhook ──► /api/wompi/webhook
```

## 1. Qué necesitas (todo con plan gratis)

| Servicio | Para qué | Cuenta |
|---|---|---|
| GitHub | Guardar el código | github.com |
| Supabase | Base de datos + fotos | supabase.com |
| Netlify | Publicar la página | netlify.com |
| Wompi | Cobrar (tarjeta, PSE, Nequi…) | comercios.wompi.co |

## 2. Paso a paso

### A. Base de datos (Supabase)
1. Crea un proyecto en Supabase (guarda la contraseña de la base de datos).
2. **SQL Editor** → pega todo `supabase/schema.sql` → *Run*. (Crea las 20 tablas y el bucket de imágenes `emi`.)
3. *(Opcional)* pega `supabase/seed.sql` → *Run* para cargar categorías y 16 productos de ejemplo.
4. Copia tres datos:
   - **Connect → Transaction pooler** → `DATABASE_URL` (puerto 6543, reemplaza `[YOUR-PASSWORD]`).
   - **Project Settings → API** → `SUPABASE_URL` y la llave `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (¡secreta!).

### B. Wompi
1. Crea cuenta de comercio → **Desarrolladores** → copia las llaves de **pruebas**: pública (`pub_test_…`), secreto de integridad y secreto de eventos.
2. En *Eventos* configura la URL: `https://TU-SITIO.netlify.app/api/wompi/webhook`.
3. Para cobrar de verdad: completa la verificación del comercio en Wompi, cambia a llaves `pub_prod_…`/producción y vuelve a desplegar. El código detecta solo si es pruebas o producción.

### C. GitHub + Netlify
1. Sube esta carpeta a un repositorio nuevo (`.env` ya está ignorado).
2. Netlify → *Add new site → Import from Git* → elige el repo. Netlify lee `netlify.toml` (build `npm run build`, carpeta `dist`).
3. **Site configuration → Environment variables**, agrega las de `.env.example`. Obligatorias:

| Variable | Valor |
|---|---|
| `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | del paso A |
| `SESSION_SECRET` | cadena aleatoria de 32+ caracteres (`openssl rand -base64 32`) |
| `WOMPI_PUBLIC_KEY`, `WOMPI_INTEGRITY_SECRET`, `WOMPI_EVENTS_SECRET` | del paso B |
| `SITE_URL` | `https://tu-sitio.netlify.app` (o tu dominio) |

   Opcionales: `MAIL_*` (correos de pedidos/recuperación; Gmail con *contraseña de aplicación*), `GOOGLE_CLIENT_ID` + `VITE_GOOGLE_CLIENT_ID`, `AI_API_KEY` (asistente virtual).
4. *Deploy*. Comprueba `https://tu-sitio.netlify.app/api/salud` → debe responder `{"ok":true,...}`.

### D. Primer administrador
Con `DATABASE_URL` en tu `.env` local:
```
npm install
node scripts/crear-admin.mjs tucorreo@dominio.com "Tu Nombre" "UnaClaveSegura123"
```

## 3. Migrar tus datos actuales (SQL Server → Supabase)
1. Copia `migracion/exportar.php` a tu proyecto antiguo y ejecuta: `php -c api\conf\php.ini migracion\exportar.php` → genera `datos.json`.
2. En este proyecto (con `.env` lleno): `npm run db:importar -- ruta/datos.json --uploads ruta/a/api/uploads`
   - Importa solo las columnas que existen en el esquema nuevo, conserva los ids, y sube tus fotos locales a Supabase Storage.
   - Las contraseñas antiguas (`$2y$`) siguen funcionando.

## 4. Cómo funciona el pago
1. El cliente confirma → el servidor **recalcula precios desde la base de datos** (ignora los del navegador) y descuenta stock.
2. Se redirige a Wompi con una firma de integridad; el cliente paga allí.
3. Wompi avisa al webhook y/o el cliente vuelve a `/pago/resultado`; el servidor **consulta la transacción directamente a Wompi**, verifica monto y moneda y marca el pedido como pagado (idempotente).
4. Pago rechazado → el pedido sigue pendiente (botón *Pagar ahora*). Pedidos Wompi sin pagar se cancelan a las 3 h y se devuelve el stock.

## 5. Desarrollo local
```
cp .env.example .env     # llena las variables
npm install
npm start                # API local (8888) + sitio (5173)
npm run lint && npm run build
npm run test:api         # requiere un Postgres local: DATABASE_URL=postgres://... DATABASE_SSL=off
```

## 6. Lista de seguridad antes de salir a producción
- [ ] **Rota** cualquier clave que estuviera en el proyecto antiguo (PayPal, Gemini, contraseña SMTP de Gmail): estaban escritas en archivos PHP.
- [ ] Llaves Wompi de producción y webhook apuntando al dominio real.
- [ ] `SITE_URL` con tu dominio final.
- [ ] Admin creado con clave fuerte; no uses cuentas demo.
- [ ] Haz una compra real pequeña y confirma que el pedido pasa a *pagado*.
