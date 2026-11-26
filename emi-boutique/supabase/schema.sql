-- ============================================================
--  EMI Boutique · esquema para Supabase (PostgreSQL)
--  Ejecútalo UNA vez en: Supabase → SQL Editor → New query → Run
--  Es idempotente: puedes volver a correrlo sin perder datos.
-- ============================================================

create table if not exists categorias (
  id          serial primary key,
  nombre      varchar(100) not null unique,
  descripcion text,
  estado      smallint not null default 1
);

create table if not exists usuarios (
  id             serial primary key,
  nombre         varchar(150) not null,
  correo         varchar(255) not null,
  password       varchar(255) not null,
  rol            varchar(20)  not null default 'cliente'
                 check (rol in ('administrador', 'cliente', 'empleado')),
  telefono       varchar(30),
  direccion      varchar(255),
  direccion_info varchar(255),
  ciudad         varchar(100),
  perfil_img     varchar(500),
  google_sub     varchar(100),
  estado         smallint not null default 1,
  fecha_registro timestamptz not null default now()
);
create unique index if not exists uq_usuarios_correo on usuarios (lower(correo));

create table if not exists productos (
  id             serial primary key,
  codigo         varchar(60),
  nombre         varchar(200) not null,
  descripcion    text,
  categoria_id   int not null references categorias(id),
  precio         numeric(12,2) not null check (precio > 0),
  stock          int not null default 0 check (stock >= 0),
  stock_minimo   int not null default 5,
  descuento      int not null default 0 check (descuento between 0 and 100),
  es_nuevo       smallint not null default 0,
  estado         smallint not null default 1,
  fecha_registro timestamptz not null default now()
);
create index if not exists ix_productos_categoria on productos (categoria_id);

create table if not exists imagenes_producto (
  id          serial primary key,
  producto_id int not null references productos(id) on delete cascade,
  imagen      varchar(500) not null,
  principal   smallint not null default 0
);
create index if not exists ix_imagenes_producto on imagenes_producto (producto_id);

create table if not exists producto_colores (
  id          serial primary key,
  producto_id int not null references productos(id) on delete cascade,
  nombre      varchar(50) not null,
  hex         varchar(7)  not null
);
create index if not exists ix_colores_producto on producto_colores (producto_id);

create table if not exists producto_tallas (
  id          serial primary key,
  producto_id int not null references productos(id) on delete cascade,
  nombre      varchar(40) not null
);
create index if not exists ix_tallas_producto on producto_tallas (producto_id);

create table if not exists resenas (
  id           serial primary key,
  usuario_id   int not null references usuarios(id) on delete cascade,
  producto_id  int not null references productos(id) on delete cascade,
  calificacion smallint not null check (calificacion between 1 and 5),
  comentario   varchar(1500),
  fecha        timestamptz not null default now()
);
create index if not exists ix_resenas_producto on resenas (producto_id);

create table if not exists carrito (
  id         serial primary key,
  usuario_id int not null unique references usuarios(id) on delete cascade
);

create table if not exists detalle_carrito (
  id          serial primary key,
  carrito_id  int not null references carrito(id) on delete cascade,
  producto_id int not null references productos(id) on delete cascade,
  cantidad    int not null default 1 check (cantidad > 0),
  talla       varchar(20),
  color       varchar(40)
);
create unique index if not exists uq_detalle_carrito on detalle_carrito (carrito_id, producto_id);

create table if not exists direcciones (
  id             serial primary key,
  usuario_id     int not null references usuarios(id) on delete cascade,
  alias          varchar(60),
  direccion      varchar(255) not null,
  direccion_info varchar(255),
  ciudad         varchar(120),
  telefono       varchar(30),
  predeterminada boolean not null default false,
  activo         boolean not null default true,
  fecha          timestamptz not null default now()
);
create index if not exists ix_direcciones_usuario on direcciones (usuario_id);

create table if not exists pedidos (
  id           serial primary key,
  usuario_id   int not null references usuarios(id),
  direccion_id int references direcciones(id),
  subtotal     numeric(12,2) not null,
  descuento    numeric(12,2) not null default 0,
  costo_envio  numeric(12,2) not null default 0,
  total        numeric(12,2) not null,
  estado       varchar(20) not null default 'pendiente'
               check (estado in ('pendiente','pagado','enviado','entregado','cancelado')),
  fecha_pedido timestamptz not null default now()
);
create index if not exists ix_pedidos_usuario on pedidos (usuario_id);

create table if not exists detalle_pedido (
  id          serial primary key,
  pedido_id   int not null references pedidos(id) on delete cascade,
  producto_id int not null references productos(id),
  cantidad    int not null,
  precio      numeric(12,2) not null,
  subtotal    numeric(12,2) not null,
  detalle     varchar(120)
);
create index if not exists ix_detalle_pedido on detalle_pedido (pedido_id);

-- Pagos: 'efectivo' (contra entrega) o 'wompi' (Nequi, PSE, tarjeta, Bancolombia, Daviplata…)
create table if not exists pagos (
  id             serial primary key,
  pedido_id      int not null references pedidos(id) on delete cascade,
  metodo_pago    varchar(20) not null check (metodo_pago in ('efectivo','wompi')),
  monto          numeric(12,2) not null,
  estado         varchar(20) not null check (estado in ('pendiente','aprobado','rechazado')),
  referencia     varchar(64),
  transaccion_id varchar(80),
  medio          varchar(40),
  fecha          timestamptz not null default now()
);
create index if not exists ix_pagos_pedido on pagos (pedido_id);
create unique index if not exists uq_pagos_referencia on pagos (referencia) where referencia is not null;

create table if not exists notificaciones (
  id         serial primary key,
  usuario_id int,
  titulo     varchar(150) not null,
  mensaje    varchar(600) not null,
  tipo       varchar(30) not null default 'info',
  enlace     varchar(200),
  leida      boolean not null default false,
  fecha      timestamptz not null default now()
);
create index if not exists ix_notif_usuario on notificaciones (usuario_id);

create table if not exists vistas (
  id          serial primary key,
  usuario_id  int not null references usuarios(id) on delete cascade,
  producto_id int not null references productos(id) on delete cascade,
  fecha       timestamptz not null default now()
);
create unique index if not exists uq_vistas on vistas (usuario_id, producto_id);

create table if not exists mensajes (
  id            serial primary key,
  usuario_id    int not null references usuarios(id) on delete cascade,
  autor         varchar(10) not null,
  cuerpo        varchar(1000) not null,
  leido_cliente boolean not null default false,
  leido_admin   boolean not null default false,
  fecha         timestamptz not null default now()
);
create index if not exists ix_mensajes_usuario on mensajes (usuario_id);

create table if not exists anuncios (
  id      serial primary key,
  titulo  varchar(150) not null,
  mensaje varchar(1000) not null,
  imagen  varchar(500),
  activo  boolean not null default true,
  fecha   timestamptz not null default now()
);

create table if not exists recuperaciones (
  id             serial primary key,
  usuario_id     int not null references usuarios(id) on delete cascade,
  token          varchar(64) not null unique,
  usado          boolean not null default false,
  expira         timestamptz not null,
  fecha_creacion timestamptz not null default now()
);

create table if not exists recuperaciones_codigo (
  id             serial primary key,
  usuario_id     int not null references usuarios(id) on delete cascade,
  correo         varchar(255) not null,
  codigo         varchar(10) not null,
  usado          boolean not null default false,
  intentos       int not null default 0,
  expira         timestamptz not null,
  fecha_creacion timestamptz not null default now()
);

-- Freno a la fuerza bruta en el login
create table if not exists login_intentos (
  id     bigserial primary key,
  clave  varchar(255) not null,
  fecha  timestamptz not null default now()
);
create index if not exists ix_login_intentos on login_intentos (clave, fecha);

-- ------------------------------------------------------------
--  Seguridad: la API pública de Supabase (anon key) NO debe poder
--  leer ni escribir estas tablas. Solo nuestro servidor (que usa la
--  conexión directa de la base de datos) accede a los datos.
-- ------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'categorias','usuarios','productos','imagenes_producto','producto_colores','producto_tallas',
    'resenas','carrito','detalle_carrito','direcciones','pedidos','detalle_pedido','pagos',
    'notificaciones','vistas','mensajes','anuncios','recuperaciones','recuperaciones_codigo','login_intentos'
  ] loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- Bucket público para las fotos de productos, anuncios y perfiles
-- (solo existe en Supabase; en una base Postgres normal se ignora).
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    insert into storage.buckets (id, name, public) values ('emi', 'emi', true)
    on conflict (id) do update set public = true;
  end if;
end $$;
