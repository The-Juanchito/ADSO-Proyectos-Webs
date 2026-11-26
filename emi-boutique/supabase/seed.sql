-- Datos de ejemplo: categorías y 15 productos. Seguro de ejecutar varias veces.

insert into categorias (nombre, estado)
select v, 1 from (values ('Vestidos'),('Blusas'),('Pantalones'),('Faldas'),('Chaquetas'),('Accesorios'),('Pijamas')) t(v)
where not exists (select 1 from categorias c where c.nombre = t.v);

with p as (
  insert into productos (codigo, nombre, descripcion, categoria_id, precio, stock, stock_minimo, estado)
  select 'E-VD-001', 'Vestido Floral Primavera', 'Vestido ligero con estampado floral ideal para primavera.', (select id from categorias where nombre='Vestidos'), 149900, 25, 5, 1
  where not exists (select 1 from productos where codigo='E-VD-001')
  returning id)
insert into imagenes_producto (producto_id, imagen, principal) select id, 'https://picsum.photos/seed/emi-vestido-floral-primavera/600/800', 1 from p;

with p as (
  insert into productos (codigo, nombre, descripcion, categoria_id, precio, stock, stock_minimo, estado)
  select 'E-VD-002', 'Vestido Elegante de Noche', 'Vestido largo de gala con toque sofisticado.', (select id from categorias where nombre='Vestidos'), 219900, 12, 5, 1
  where not exists (select 1 from productos where codigo='E-VD-002')
  returning id)
insert into imagenes_producto (producto_id, imagen, principal) select id, 'https://picsum.photos/seed/emi-vestido-elegante-de-noche/600/800', 1 from p;

with p as (
  insert into productos (codigo, nombre, descripcion, categoria_id, precio, stock, stock_minimo, estado)
  select 'E-VD-003', 'Vestido Casual de Verano', 'Vestido fresco y cómodo para el día a día.', (select id from categorias where nombre='Vestidos'), 129900, 20, 5, 1
  where not exists (select 1 from productos where codigo='E-VD-003')
  returning id)
insert into imagenes_producto (producto_id, imagen, principal) select id, 'https://picsum.photos/seed/emi-vestido-casual-de-verano/600/800', 1 from p;

with p as (
  insert into productos (codigo, nombre, descripcion, categoria_id, precio, stock, stock_minimo, estado)
  select 'E-BL-001', 'Blusa de Seda Sencilla', 'Blusa fluida de seda con acabado elegante.', (select id from categorias where nombre='Blusas'), 99000, 18, 5, 1
  where not exists (select 1 from productos where codigo='E-BL-001')
  returning id)
insert into imagenes_producto (producto_id, imagen, principal) select id, 'https://picsum.photos/seed/emi-blusa-de-seda-sencilla/600/800', 1 from p;

with p as (
  insert into productos (codigo, nombre, descripcion, categoria_id, precio, stock, stock_minimo, estado)
  select 'E-BL-002', 'Blusa de Encaje', 'Blusa romántica con detalles de encaje.', (select id from categorias where nombre='Blusas'), 85000, 15, 5, 1
  where not exists (select 1 from productos where codigo='E-BL-002')
  returning id)
insert into imagenes_producto (producto_id, imagen, principal) select id, 'https://picsum.photos/seed/emi-blusa-de-encaje/600/800', 1 from p;

with p as (
  insert into productos (codigo, nombre, descripcion, categoria_id, precio, stock, stock_minimo, estado)
  select 'E-BL-003', 'Blusa Off Shoulder', 'Blusa fuera de hombro con estilo veraniego.', (select id from categorias where nombre='Blusas'), 89000, 22, 5, 1
  where not exists (select 1 from productos where codigo='E-BL-003')
  returning id)
insert into imagenes_producto (producto_id, imagen, principal) select id, 'https://picsum.photos/seed/emi-blusa-off-shoulder/600/800', 1 from p;

with p as (
  insert into productos (codigo, nombre, descripcion, categoria_id, precio, stock, stock_minimo, estado)
  select 'E-PN-001', 'Pantalón Palazzo', 'Pantalón ancho y fluido, súper elegante.', (select id from categorias where nombre='Pantalones'), 119900, 14, 5, 1
  where not exists (select 1 from productos where codigo='E-PN-001')
  returning id)
insert into imagenes_producto (producto_id, imagen, principal) select id, 'https://picsum.photos/seed/emi-pantalón-palazzo/600/800', 1 from p;

with p as (
  insert into productos (codigo, nombre, descripcion, categoria_id, precio, stock, stock_minimo, estado)
  select 'E-PN-002', 'Jeans Tiro Alto', 'Jeans clásicos de tiro alto con perfecto ajuste.', (select id from categorias where nombre='Pantalones'), 135000, 30, 5, 1
  where not exists (select 1 from productos where codigo='E-PN-002')
  returning id)
insert into imagenes_producto (producto_id, imagen, principal) select id, 'https://picsum.photos/seed/emi-jeans-tiro-alto/600/800', 1 from p;

with p as (
  insert into productos (codigo, nombre, descripcion, categoria_id, precio, stock, stock_minimo, estado)
  select 'E-FA-001', 'Falda Plisada', 'Falda plisada con movimiento y estilo.', (select id from categorias where nombre='Faldas'), 98000, 19, 5, 1
  where not exists (select 1 from productos where codigo='E-FA-001')
  returning id)
insert into imagenes_producto (producto_id, imagen, principal) select id, 'https://picsum.photos/seed/emi-falda-plisada/600/800', 1 from p;

with p as (
  insert into productos (codigo, nombre, descripcion, categoria_id, precio, stock, stock_minimo, estado)
  select 'E-FA-002', 'Falda Midi Floral', 'Falda midi estampada con caída perfecta.', (select id from categorias where nombre='Faldas'), 95000, 16, 5, 1
  where not exists (select 1 from productos where codigo='E-FA-002')
  returning id)
insert into imagenes_producto (producto_id, imagen, principal) select id, 'https://picsum.photos/seed/emi-falda-midi-floral/600/800', 1 from p;

with p as (
  insert into productos (codigo, nombre, descripcion, categoria_id, precio, stock, stock_minimo, estado)
  select 'E-CQ-001', 'Chaqueta de Mezclilla', 'Chaqueta denim versátil para cualquier look.', (select id from categorias where nombre='Chaquetas'), 159900, 11, 5, 1
  where not exists (select 1 from productos where codigo='E-CQ-001')
  returning id)
insert into imagenes_producto (producto_id, imagen, principal) select id, 'https://picsum.photos/seed/emi-chaqueta-de-mezclilla/600/800', 1 from p;

with p as (
  insert into productos (codigo, nombre, descripcion, categoria_id, precio, stock, stock_minimo, estado)
  select 'E-CQ-002', 'Blazer Oversize', 'Blazer holgado que eleva cualquier outfit.', (select id from categorias where nombre='Chaquetas'), 179900, 9, 5, 1
  where not exists (select 1 from productos where codigo='E-CQ-002')
  returning id)
insert into imagenes_producto (producto_id, imagen, principal) select id, 'https://picsum.photos/seed/emi-blazer-oversize/600/800', 1 from p;

with p as (
  insert into productos (codigo, nombre, descripcion, categoria_id, precio, stock, stock_minimo, estado)
  select 'E-AC-001', 'Bolso Tote Elegante', 'Bolso amplio y práctico para el día a día.', (select id from categorias where nombre='Accesorios'), 74000, 24, 5, 1
  where not exists (select 1 from productos where codigo='E-AC-001')
  returning id)
insert into imagenes_producto (producto_id, imagen, principal) select id, 'https://picsum.photos/seed/emi-bolso-tote-elegante/600/800', 1 from p;

with p as (
  insert into productos (codigo, nombre, descripcion, categoria_id, precio, stock, stock_minimo, estado)
  select 'E-AC-002', 'Collar de Perlas', 'Collar clásico de perlas que nunca pasa de moda.', (select id from categorias where nombre='Accesorios'), 59000, 40, 5, 1
  where not exists (select 1 from productos where codigo='E-AC-002')
  returning id)
insert into imagenes_producto (producto_id, imagen, principal) select id, 'https://picsum.photos/seed/emi-collar-de-perlas/600/800', 1 from p;

with p as (
  insert into productos (codigo, nombre, descripcion, categoria_id, precio, stock, stock_minimo, estado)
  select 'E-AC-003', 'Sombrero de Paja', 'Sombrero ideal para protegerte con estilo.', (select id from categorias where nombre='Accesorios'), 62000, 28, 5, 1
  where not exists (select 1 from productos where codigo='E-AC-003')
  returning id)
insert into imagenes_producto (producto_id, imagen, principal) select id, 'https://picsum.photos/seed/emi-sombrero-de-paja/600/800', 1 from p;

with p as (
  insert into productos (codigo, nombre, descripcion, categoria_id, precio, stock, stock_minimo, estado)
  select 'E-PJ-001', 'Pijama de Satín', 'Pijama de satín suave y elegante.', (select id from categorias where nombre='Pijamas'), 99000, 17, 5, 1
  where not exists (select 1 from productos where codigo='E-PJ-001')
  returning id)
insert into imagenes_producto (producto_id, imagen, principal) select id, 'https://picsum.photos/seed/emi-pijama-de-satín/600/800', 1 from p;
