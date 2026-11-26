import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import ProductCard from '../components/ProductCard'
import ScrollReveal from '../components/ScrollReveal'
import HorizontalScroller from '../components/HorizontalScroller'
import logoimg from '../assets/logo.png'

export default function Inicio() {
  const { products, categorias } = useStore()
  // Primeros 8 = destacados, siguientes 8 = recién llegados
  const destacados = products.slice(0, 8)
  const recienLlegados = products.slice(8, 16)

  return (
    <>
      {/* Hero de bienvenida */}
      <section className="hero">
        <span className="hero-badge">EMI Boutique</span>
        <div className="hero-inner">
          <div className="hero-copy">
            <h1>
              Viste tu estilo con <span>EMI</span>
            </h1>
            <p>
              Descubre una colección pensada para la mujer moderna: vestidos,
              blusas, faldas y accesorios que realzan tu belleza natural.
            </p>
            <div className="hero-cta">
              <Link to="/catalogo" className="btn-primary">Ver catálogo</Link>
              <Link to="/contacto" className="btn-ghost">Contáctanos</Link>
            </div>
          </div>
          <div className="logo-img">
            <img src={logoimg} alt="Logo" />
          </div>
        </div>
      </section>

      <ScrollReveal as="section" className="products-section">
        <div className="section-head">
          <h2>Categorías</h2>
          <Link to="/catalogo">Ver todo →</Link>
        </div>
        {/* Fila de enlaces a cada categoría */}
        <HorizontalScroller className="categories-row">
          {categorias.map((c) => (
            <Link key={c} to={`/catalogo?cat=${encodeURIComponent(c)}`}>{c}</Link>
          ))}
        </HorizontalScroller>
      </ScrollReveal>

      {/* Bloque de tarjetas destacadas */}
      <ScrollReveal as="section" className="products-section">
        <div className="section-head">
          <h2>Destacados</h2>
          <Link to="/catalogo">Ver todo →</Link>
        </div>
        <HorizontalScroller className="scroll-row">
          {destacados.map((p) => <ProductCard key={p.id} product={p} />)}
        </HorizontalScroller>
      </ScrollReveal>

      {/* Bloque de recién llegados */}
      <ScrollReveal as="section" className="products-section">
        <div className="section-head">
          <h2>Recién llegados</h2>
          <Link to="/catalogo">Ver todo →</Link>
        </div>
        <HorizontalScroller className="scroll-row">
          {recienLlegados.map((p) => <ProductCard key={p.id} product={p} />)}
        </HorizontalScroller>
      </ScrollReveal>
    </>
  )
}