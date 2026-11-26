export default function Nosotros() {
  return (
    <>
      {/* Encabezado de la página */}
      <header className="page-hero">
        <span className="crumb">Nosotros</span>
        <h1>Nuestra Historia</h1>
        <p>Un poco sobre la pasión que hay detrás de EMI Boutique.</p>
      </header>

      {/* Texto de la marca + cifras */}
      <div className="about-grid">
        <div className="about-copy">
          <h2>Moda femenina con alma</h2>
          <p>
            EMI Boutique nació de la idea de que la ropa no solo viste: expresa
            quién eres. Seleccionamos cada prenda con cariño para ofrecerte
            calidad, estilo y confianza en cada ocasión.
          </p>
          <p>
            Nuestro equipo visita proveedores en busca de piezas únicas que
            combinen tendencia y comodidad, porque sabemos que la verdadera
            elegancia se siente tanto como se ve.
          </p>
          <ul>
            <li>Prendas seleccionadas a mano</li>
            <li>Atención personalizada a cada clienta</li>
            <li>Envíos puntuales en todo el país</li>
            <li>Preocupados por la calidad y el detalle</li>
          </ul>
        </div>

        <div className="stats">
          <div className="stat">
            <h3>4+</h3>
            <span>Años de experiencia</span>
          </div>
          <div className="stat">
            <h3>1.000+</h3>
            <span>Clientas felices</span>
          </div>
          <div className="stat">
            <h3>100+</h3>
            <span>Prendas vendidas al mes</span>
          </div>
        </div>
      </div>
    </>
  )
}