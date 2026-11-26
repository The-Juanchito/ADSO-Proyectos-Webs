import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="grid">
        <div>
          <h4>EMI Boutique</h4>
          <p>
            Moda femenina pensada para cada momento. Selección cuidadosa de
            vestidos, blusas y accesorios con estilo y calidad.
          </p>
          <div className="social-row footer-social">
            <a href="https://wa.me/3015939779" target="_blank" rel="noreferrer" className="social-btn" style={{ '--color': '#25d366' }} title="WhatsApp" aria-label="WhatsApp">
              <i className="bi bi-whatsapp" />
            </a>
            <a href="https://instagram.com/emi.boutique_22" target="_blank" rel="noreferrer" className="social-btn" style={{ '--color': '#e1306c' }} title="Instagram" aria-label="Instagram">
              <i className="bi bi-instagram" />
            </a>
          </div>
        </div>
        <div>
          <h4>Navegación</h4>
          <Link to="/">Inicio</Link>
          <Link to="/catalogo">Catálogo</Link>
          <Link to="/nosotros">Nosotros</Link>
          <Link to="/contacto">Contacto</Link>
        </div>
        <div>
          <h4>Tienda</h4>
          <Link to="/carrito">Mi carrito</Link>
          
          <Link to="/perfil">Mi cuenta</Link>
          <Link to="/admin">Dashboard</Link>
        </div>
      </div>   
      <div className="copy">
        © {new Date().getFullYear()} EMI Boutique — Moda femenina. Todos los derechos reservados.
      </div>
    </footer>
  )
}