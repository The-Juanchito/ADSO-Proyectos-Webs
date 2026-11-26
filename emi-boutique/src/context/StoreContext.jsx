/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../services/api'
import { fallbackProducts, fallbackCategorias, precioFinal } from '../data/products'

const StoreContext = createContext(null)

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const write = (key, value) => localStorage.setItem(key, JSON.stringify(value))

const serializarCart = (cart) => cart.map((i) => ({ id: i.id, cantidad: i.qty }))
const cargarDelServidor = (carrito) => (carrito || []).map((l) => ({ id: l.producto.id, qty: l.cantidad }))

export function StoreProvider({ children }) {
  const [cart, setCart] = useState(() => read('emi_cart', []))
  const [user, setUser] = useState(() => read('emi_user', null))
  const [products, setProducts] = useState(fallbackProducts)
  const [categorias, setCategorias] = useState(fallbackCategorias)
  const [offline, setOffline] = useState(false)
  const carritoSincronizado = useRef(false)

  const refresh = async () => {
    try {
      const [p, c] = await Promise.all([api.productos(), api.categorias()])
      setProducts(p.productos)
      setCategorias(c.categorias.map((x) => x.nombre))
      setOffline(false)
    } catch {
      setProducts(fallbackProducts)
      setCategorias(fallbackCategorias)
      setOffline(true)
    }
  }

  useEffect(() => {
    let activo = true
    Promise.all([api.productos(), api.categorias()])
      .then(([p, c]) => {
        if (activo) {
          setProducts(p.productos)
          setCategorias(c.categorias.map((x) => x.nombre))
          setOffline(false)
        }
      })
      .catch(() => {
        if (activo) {
          setProducts(fallbackProducts)
          setCategorias(fallbackCategorias)
          setOffline(true)
        }
      })
    return () => {
      activo = false
    }
  }, [])

  useEffect(() => write('emi_cart', cart), [cart])
  useEffect(() => write('emi_user', user), [user])

  // Al recargar con sesión iniciada: tomar el carrito guardado en su cuenta
  useEffect(() => {
    let activo = true
    if (!user) {
      carritoSincronizado.current = true
      return undefined
    }
    api
      .carrito()
      .then((r) => {
        if (activo) {
          setCart(cargarDelServidor(r.carrito))
          carritoSincronizado.current = true
        }
      })
      .catch(() => {
        if (activo) carritoSincronizado.current = true
      })
    return () => {
      activo = false
    }
  }, [user])

  // Cada cambio del carrito se guarda en la cuenta conectada
  useEffect(() => {
    if (!user || !carritoSincronizado.current) return
    api.guardarCarrito(serializarCart(cart)).catch(() => {})
  }, [cart, user])

  const addToCart = (productId) =>
    setCart((prev) => {
      const found = prev.find((i) => i.id === productId)
      return found
        ? prev.map((i) => (i.id === productId ? { ...i, qty: i.qty + 1 } : i))
        : [...prev, { id: productId, qty: 1 }]
    })

  const updateQty = (productId, qty) =>
    setCart((prev) =>
      qty <= 0
        ? prev.filter((i) => i.id !== productId)
        : prev.map((i) => (i.id === productId ? { ...i, qty } : i))
    )

  const removeFromCart = (productId) =>
    setCart((prev) => prev.filter((i) => i.id !== productId))

  const clearCart = () => setCart([])

  const lines = useMemo(
    () =>
      cart
        .map((i) => ({ ...i, product: products.find((p) => p.id === i.id) }))
        .filter((i) => i.product),
    [cart, products]
  )

  const cartCount = lines.reduce((acc, i) => acc + i.qty, 0)
  const cartTotal = lines.reduce((acc, i) => acc + i.qty * precioFinal(i.product), 0)

  // ---- Autenticación contra la API ----
  const login = async (correo, password) => {
    const { usuario } = await api.login(correo, password)
    try {
      if (cart.length) await api.guardarCarrito(serializarCart(cart))
      const { carrito } = await api.carrito()
      setCart(cargarDelServidor(carrito))
    } catch {
      /* sin conexión: sigue con el carrito local */
    }
    sessionStorage.setItem('emi_anuncio_login', '1')
    setUser(usuario)
    return usuario
  }

  const registro = async (nombre, correo, password) => {
    const { usuario } = await api.registro(nombre, correo, password)
    try {
      if (cart.length) await api.guardarCarrito(serializarCart(cart))
    } catch {
      /* sin conexión */
    }
    carritoSincronizado.current = true
    sessionStorage.setItem('emi_anuncio_login', '1')
    setUser(usuario)
    return usuario
  }

  const logout = async () => {
    if (user) {
      try {
        await api.guardarCarrito(serializarCart(cart))
      } catch {
        /* el carrito ya quedó guardado con cada cambio */
      }
    }
    setUser(null)
    clearCart()
    try {
      await api.logout()
    } catch {
      /* el cierre de sesión local es suficiente */
    }
  }

  const loginGoogle = async (credential) => {
    const { usuario } = await api.loginGoogle(credential)
    try {
      if (cart.length) await api.guardarCarrito(serializarCart(cart))
      const { carrito } = await api.carrito()
      setCart(cargarDelServidor(carrito))
    } catch {
      /* sin conexión: sigue con el carrito local */
    }
    setUser(usuario)
    return usuario
  }

  const updateUser = (datos) => setUser((prev) => (prev ? { ...prev, ...datos } : prev))

  // ---- Administración ----
  const addProduct = async (datos) => {
    await api.crearProducto(datos)
    await refresh()
  }

  const deleteProduct = async (id) => {
    await api.borrarProducto(id)
    await refresh()
  }

  const updateProduct = async (id, datos) => {
    await api.actualizarProducto(id, datos)
    await refresh()
  }

  // ---- Pedido (checkout) ----
  const checkout = async (metodoPago = 'efectivo', direccionId = null) => {
    const items = lines.map((i) => ({
      id: i.product.id,
      cantidad: i.qty,
      talla: i.talla || '',
      color: i.color || '',
    }))
    const { pedido } = await api.pedido(items, metodoPago, direccionId)
    clearCart()
    return pedido
  }

  const value = {
    products,
    categorias,
    offline,
    refresh,
    cart,
    lines,
    cartCount,
    cartTotal,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
    user,
    login,
    registro,
    loginGoogle,
    logout,
    updateUser,
    addProduct,
    deleteProduct,
    updateProduct,
    checkout,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export const useStore = () => useContext(StoreContext)