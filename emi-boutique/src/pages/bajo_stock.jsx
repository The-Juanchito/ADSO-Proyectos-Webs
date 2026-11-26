import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { api } from '../services/api'

export default function BajoStock() {
  const { user } = useStore()
  const [productos, setProductos] = useState(null)
  const [error, setError] = useState('')

  // Cargar la lista de productos con stock bajo
  useEffect(() => {
    api
      .stockBajo()
      .then((r) => setProductos(r.productos))
      .catch((e) => setError(e.message || 'No se pudo cargar la lista'))
  }, [])

  // Proteger la ruta: solo administradores y empleados
  if (!user || (user.rol !== 'administrador' && user.rol !== 'empleado')) {
    return (
      <div className="admin-page">
        <div className="guard">
          <h2>Acceso restringido</h2>
          <p>Esta sección es para el personal de la tienda.</p>
          <Link to="/login" className="btn-primary" style={{ textDecoration: 'none' }}>Ir a iniciar sesión</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <header className="page-hero">
        <span className="crumb">Administración</span>
        <h1>Productos con bajo stock</h1>
        <p>
          Productos cuyo inventario está igual o por debajo de su stock mínimo.
        </p>
      </header>

      <div className="pedidos-card">
        <div className="table-head">
          <h2><i className="bi bi-exclamation-triangle" /> Bajo stock</h2>
          <span>{productos ? `${productos.length} producto(s)` : 'Cargando…'}</span>
        </div>
        {error ? (
          <div className="empty">{error}</div>
        ) : !productos ? (
          <div className="empty">Cargando productos…</div>
        ) : productos.length === 0 ? (
          <div className="empty">Todo en orden: no hay productos con stock bajo.</div>
        ) : (
          <div className="scroll">
            <table className="pedidos">
              <thead>
                <tr>
                  <th>Foto</th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Stock</th>
                  <th>Mínimo</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => (
                  <tr key={p.id}>
                    <td><img src={p.img} alt={p.nombre} /></td>
                    <td>
                      <strong>{p.nombre}</strong>
                      <br /><span className="sub">{p.codigo}</span>
                    </td>
                    <td>{p.categoria}</td>
                    <td><span className={`estado ${p.stock <= 0 ? 'cancelado' : 'pendiente'}`}>{p.stock}</span></td>
                    <td>{p.stock_minimo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="table-head" style={{ borderTop: '1px solid #f1e6ea' }}>
          <Link to="/admin" className="btn-cancel-edit"><i className="bi bi-arrow-left" /> Volver al dashboard</Link>
        </div>
      </div>
    </div>
  )
}