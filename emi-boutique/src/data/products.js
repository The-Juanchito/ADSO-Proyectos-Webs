const img = (seed) => `https://picsum.photos/seed/${seed}/600/800`

// Datos de respaldo por si la API PHP no está disponible.
export const fallbackProducts = [
  { id: 1, nombre: 'Vestido Floral Primavera', categoria: 'Vestidos', precio: 149900, img: img('emi-vestido-1') },
  { id: 2, nombre: 'Vestido Elegante de Noche', categoria: 'Vestidos', precio: 219900, img: img('emi-vestido-2') },
  { id: 3, nombre: 'Vestido Casual de Verano', categoria: 'Vestidos', precio: 129900, img: img('emi-vestido-3') },
  { id: 4, nombre: 'Blusa de Seda Sencilla', categoria: 'Blusas', precio: 99000, img: img('emi-blusa-1') },
  { id: 5, nombre: 'Blusa de Encaje', categoria: 'Blusas', precio: 85000, img: img('emi-blusa-2') },
  { id: 6, nombre: 'Blusa Off Shoulder', categoria: 'Blusas', precio: 89000, img: img('emi-blusa-3') },
  { id: 7, nombre: 'Pantalón Palazzo', categoria: 'Pantalones', precio: 119900, img: img('emi-pantalon-1') },
  { id: 8, nombre: 'Jeans Tiro Alto', categoria: 'Pantalones', precio: 135000, img: img('emi-pantalon-2') },
  { id: 9, nombre: 'Falda Plisada', categoria: 'Faldas', precio: 98000, img: img('emi-falda-1') },
  { id: 10, nombre: 'Falda Midi Floral', categoria: 'Faldas', precio: 95000, img: img('emi-falda-2') },
  { id: 11, nombre: 'Chaqueta de Mezclilla', categoria: 'Chaquetas', precio: 159900, img: img('emi-chaqueta-1') },
  { id: 12, nombre: 'Blazer Oversize', categoria: 'Chaquetas', precio: 179900, img: img('emi-chaqueta-2') },
  { id: 13, nombre: 'Bolso Tote Elegante', categoria: 'Accesorios', precio: 74000, img: img('emi-accesorio-1') },
  { id: 14, nombre: 'Collar de Perlas', categoria: 'Accesorios', precio: 59000, img: img('emi-accesorio-2') },
  { id: 15, nombre: 'Sombrero de Paja', categoria: 'Accesorios', precio: 62000, img: img('emi-accesorio-3') },
  { id: 16, nombre: 'Pijama de Satín', categoria: 'Pijamas', precio: 99000, img: img('emi-pijama-1') },
]

export const fallbackCategorias = [
  ...new Set(fallbackProducts.map((p) => p.categoria)),
]

// Formato de moneda en pesos colombianos: $149.900
const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export const formatoCOP = (n) => cop.format(n)

// Precio final aplicando el descuento porcentual (0-100)
export const precioFinal = (p) => {
  const d = Number(p?.descuento) || 0
  return d > 0 ? Math.round(Number(p.precio) * (1 - d / 100)) : Number(p.precio)
}