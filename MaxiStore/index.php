
<?php

session_start();

require_once "php/conexion.php";


/* =====================================================
   CONFIGURACIÓN
===================================================== */

$usuario_logueado = isset($_SESSION['usuario_id']);

$usuario_id = intval(
    $_SESSION['usuario_id'] ?? 0
);

$usuario_nombre =
    $_SESSION['usuario_nombre'] ?? '';

$categoria_id =
    intval($_GET['categoria'] ?? 0);

$busqueda =
    trim($_GET['buscar'] ?? '');


/* =====================================================
   CANTIDAD DEL CARRITO
===================================================== */

$total_carrito = 0;

if (
    $usuario_logueado &&
    $usuario_id > 0
) {

    $sql_carrito = "
        SELECT COALESCE(SUM(cantidad), 0) AS total
        FROM carrito
        WHERE usuario_id = ?
    ";

    $stmt_carrito =
        mysqli_prepare(
            $conexion,
            $sql_carrito
        );

    if ($stmt_carrito) {

        mysqli_stmt_bind_param(
            $stmt_carrito,
            "i",
            $usuario_id
        );

        mysqli_stmt_execute(
            $stmt_carrito
        );

        $resultado_carrito =
            mysqli_stmt_get_result(
                $stmt_carrito
            );

        if ($resultado_carrito) {

            $datos_carrito =
                mysqli_fetch_assoc(
                    $resultado_carrito
                );

            $total_carrito =
                intval(
                    $datos_carrito['total'] ?? 0
                );
        }

        mysqli_stmt_close(
            $stmt_carrito
        );
    }
}


/* =====================================================
   OBTENER PRODUCTOS
===================================================== */

$resultado_productos = false;

$sql_productos = "
    SELECT
        productos.id,
        productos.nombre,
        productos.descripcion,
        productos.precio,
        productos.stock,
        productos.imagen,
        categorias.nombre AS categoria

    FROM productos

    INNER JOIN categorias
        ON productos.categoria_id = categorias.id

    WHERE productos.estado = 1
";


/* =====================================================
   FILTRO DE BÚSQUEDA
===================================================== */

if (!empty($busqueda)) {

    $sql_productos .= "
        AND (
            productos.nombre LIKE ?
            OR productos.descripcion LIKE ?
            OR categorias.nombre LIKE ?
        )
    ";
}


/* =====================================================
   FILTRO DE CATEGORÍA
===================================================== */

if ($categoria_id > 0) {

    $sql_productos .= "
        AND productos.categoria_id = ?
    ";
}


/* =====================================================
   ORDEN
===================================================== */

$sql_productos .= "
    ORDER BY productos.id DESC
";


/* =====================================================
   PREPARAR PRODUCTOS
===================================================== */

$stmt_productos =
    mysqli_prepare(
        $conexion,
        $sql_productos
    );

if ($stmt_productos) {

    if (
        !empty($busqueda) &&
        $categoria_id > 0
    ) {

        $termino =
            "%" . $busqueda . "%";

        mysqli_stmt_bind_param(
            $stmt_productos,
            "sssi",
            $termino,
            $termino,
            $termino,
            $categoria_id
        );

    } elseif (!empty($busqueda)) {

        $termino =
            "%" . $busqueda . "%";

        mysqli_stmt_bind_param(
            $stmt_productos,
            "sss",
            $termino,
            $termino,
            $termino
        );

    } elseif ($categoria_id > 0) {

        mysqli_stmt_bind_param(
            $stmt_productos,
            "i",
            $categoria_id
        );
    }


    mysqli_stmt_execute(
        $stmt_productos
    );

    $resultado_productos =
        mysqli_stmt_get_result(
            $stmt_productos
        );
}


/* =====================================================
   OBTENER CATEGORÍAS
===================================================== */

$sql_categorias = "
    SELECT
        id,
        nombre,
        descripcion,
        imagen

    FROM categorias

    WHERE estado = 1

    ORDER BY nombre ASC
";

$resultado_categorias =
    mysqli_query(
        $conexion,
        $sql_categorias
    );


/* =====================================================
   NOMBRE DE CATEGORÍA
===================================================== */

$nombre_categoria = '';

if ($categoria_id > 0) {

    $sql_nombre_categoria = "
        SELECT nombre
        FROM categorias
        WHERE id = ?
        LIMIT 1
    ";

    $stmt_nombre_categoria =
        mysqli_prepare(
            $conexion,
            $sql_nombre_categoria
        );

    if ($stmt_nombre_categoria) {

        mysqli_stmt_bind_param(
            $stmt_nombre_categoria,
            "i",
            $categoria_id
        );

        mysqli_stmt_execute(
            $stmt_nombre_categoria
        );

        $resultado_nombre_categoria =
            mysqli_stmt_get_result(
                $stmt_nombre_categoria
            );

        if ($resultado_nombre_categoria) {

            $categoria_actual =
                mysqli_fetch_assoc(
                    $resultado_nombre_categoria
                );

            $nombre_categoria =
                $categoria_actual['nombre']
                ?? '';
        }

        mysqli_stmt_close(
            $stmt_nombre_categoria
        );
    }
}

?>

<!DOCTYPE html>

<html lang="es">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <meta
        name="description"
        content="MaxiStore - Tecnología, moda, hogar, belleza, deportes y mucho más."
    >

    <title>
        MaxiStore | Todo en un solo lugar
    </title>


    <!-- =================================================
         CSS PRINCIPAL
    ================================================== -->

    <link
        rel="stylesheet"
        href="css/style.css"
    >


    <!-- =================================================
         CSS EXCLUSIVO DEL MENÚ
    ================================================== -->

    <link
        rel="stylesheet"
        href="css/menu.css"
    >


    <!-- =================================================
         CSS COOKIES
    ================================================== -->

    <link
        rel="stylesheet"
        href="css/cookies.css"
    >


    <!-- =================================================
         BOOTSTRAP ICONS
    ================================================== -->

    <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css"
    >

</head>


<body>


<!-- =====================================================
     MENÚ GLOBAL
===================================================== -->

<?php

include "menu.php";

?>


<!-- =====================================================
     BARRA DE BIENVENIDA
===================================================== -->

<?php if ($usuario_logueado): ?>

    <div class="barra-bienvenida">

        <div>

            <i class="bi bi-person-check"></i>

            Hola,

            <strong>

                <?php

                echo htmlspecialchars(
                    $usuario_nombre
                );

                ?>

            </strong>

            ¡Bienvenido nuevamente a MaxiStore!

        </div>


        <a href="usuario/perfil.php">

            Mi perfil

            <i class="bi bi-arrow-right"></i>

        </a>

    </div>

<?php endif; ?>


<!-- =====================================================
     BANNER PRINCIPAL
===================================================== -->

<section class="banner-principal">

    <div class="banner-contenido">

        <span class="banner-etiqueta">

            <i class="bi bi-stars"></i>

            Bienvenido a MaxiStore

        </span>


        <h1>

            TODO EN UN

            <span>
                SOLO LUGAR
            </span>

        </h1>


        <p>

            Tecnología • Moda • Hogar • Belleza
            • Deportes y mucho más

        </p>


        <a
            href="#productos"
            class="btn-banner"
        >

            Ver productos

            <i class="bi bi-arrow-right"></i>

        </a>

    </div>

</section>


<!-- =====================================================
     CATEGORÍAS
===================================================== -->

<section
    class="categorias-seccion"
    id="categorias"
>

    <div class="seccion-titulo">

        <span>
            EXPLORA
        </span>

        <h2>
            Categorías
        </h2>

        <p>
            Encuentra todo lo que necesitas.
        </p>

    </div>


    <div class="categorias-grid">

        <?php

        if (
            $resultado_categorias &&
            mysqli_num_rows(
                $resultado_categorias
            ) > 0
        ):

            while (
                $categoria =
                mysqli_fetch_assoc(
                    $resultado_categorias
                )
            ):

        ?>

            <a
                href="index.php?categoria=<?php

                    echo intval(
                        $categoria['id']
                    );

                ?>"
                class="categoria-card"
            >

                <?php if (
                    !empty(
                        $categoria['imagen']
                    )
                ): ?>

                    <img
                        src="imagenes/<?php

                            echo htmlspecialchars(
                                $categoria['imagen']
                            );

                        ?>"
                        alt="<?php

                            echo htmlspecialchars(
                                $categoria['nombre']
                            );

                        ?>"
                    >

                <?php else: ?>

                    <div class="categoria-icono">

                        <i class="bi bi-grid"></i>

                    </div>

                <?php endif; ?>


                <div class="categoria-info">

                    <h3>

                        <?php

                        echo htmlspecialchars(
                            $categoria['nombre']
                        );

                        ?>

                    </h3>


                    <?php if (
                        !empty(
                            $categoria['descripcion']
                        )
                    ): ?>

                        <p>

                            <?php

                            echo htmlspecialchars(
                                $categoria['descripcion']
                            );

                            ?>

                        </p>

                    <?php endif; ?>

                </div>


                <i
                    class="bi bi-arrow-right categoria-flecha"
                ></i>

            </a>

        <?php

            endwhile;

        else:

        ?>

            <div class="sin-categorias">

                <i class="bi bi-grid"></i>

                <p>
                    No hay categorías disponibles.
                </p>

            </div>

        <?php endif; ?>

    </div>

</section>


<!-- =====================================================
     BANNER OFERTA
===================================================== -->

<section class="banner-oferta">

    <div>

        <span>

            <i class="bi bi-lightning-fill"></i>

            OFERTA ESPECIAL

        </span>


        <h2>
            MEGA OFERTAS
        </h2>


        <p>

            Encuentra productos increíbles
            a precios especiales.

        </p>

    </div>


    <a
        href="#productos"
        class="btn-oferta"
    >

        Comprar ahora

        <i class="bi bi-arrow-right"></i>

    </a>

</section>


<!-- =====================================================
     PRODUCTOS
===================================================== -->

<section
    class="productos-seccion"
    id="productos"
>

    <div class="seccion-titulo">

        <?php if (!empty($busqueda)): ?>

            <span>
                RESULTADOS
            </span>

            <h2>

                Buscando:

                "<?php

                echo htmlspecialchars(
                    $busqueda
                );

                ?>"

            </h2>

        <?php elseif ($categoria_id > 0): ?>

            <span>
                CATEGORÍA
            </span>

            <h2>

                <?php

                echo htmlspecialchars(
                    $nombre_categoria
                );

                ?>

            </h2>

            <p>
                Productos de esta categoría.
            </p>

        <?php else: ?>

            <span>
                DESCUBRE
            </span>

            <h2>
                Nuestros productos
            </h2>

            <p>
                Productos seleccionados para ti.
            </p>

        <?php endif; ?>

    </div>


    <div class="productos-grid">

        <?php

        if (
            $resultado_productos &&
            mysqli_num_rows(
                $resultado_productos
            ) > 0
        ):

            while (
                $producto =
                mysqli_fetch_assoc(
                    $resultado_productos
                )
            ):

        ?>

            <article class="producto-card">


                <!-- IMAGEN -->

                <div class="producto-imagen">

                    <?php if (
                        !empty(
                            $producto['imagen']
                        )
                    ): ?>

                        <img
                            src="imagenes/<?php

                                echo htmlspecialchars(
                                    $producto['imagen']
                                );

                            ?>"
                            alt="<?php

                                echo htmlspecialchars(
                                    $producto['nombre']
                                );

                            ?>"
                        >

                    <?php else: ?>

                        <div class="imagen-sin-producto">

                            <i class="bi bi-image"></i>

                        </div>

                    <?php endif; ?>


                    <span class="producto-categoria">

                        <?php

                        echo htmlspecialchars(
                            $producto['categoria']
                        );

                        ?>

                    </span>

                </div>


                <!-- INFORMACIÓN -->

                <div class="producto-info">

                    <h3>

                        <?php

                        echo htmlspecialchars(
                            $producto['nombre']
                        );

                        ?>

                    </h3>


                    <p class="producto-descripcion">

                        <?php

                        echo htmlspecialchars(
                            $producto['descripcion']
                        );

                        ?>

                    </p>


                    <div class="producto-precio">

                        $

                        <?php

                        echo number_format(
                            $producto['precio'],
                            0,
                            ',',
                            '.'
                        );

                        ?>

                    </div>


                    <?php if (
                        $producto['stock'] > 0
                    ): ?>

                        <p class="stock-disponible">

                            <i class="bi bi-check-circle"></i>

                            Disponible

                            (<?php

                            echo intval(
                                $producto['stock']
                            );

                            ?>)

                        </p>


                        <form
                            action="php/agregar_carrito.php"
                            method="POST"
                        >

                            <input
                                type="hidden"
                                name="producto_id"
                                value="<?php

                                    echo intval(
                                        $producto['id']
                                    );

                                ?>"
                            >


                            <input
                                type="hidden"
                                name="cantidad"
                                value="1"
                            >


                            <button
                                type="submit"
                                class="btn-agregar"
                            >

                                <i class="bi bi-cart-plus"></i>

                                Agregar al carrito

                            </button>

                        </form>


                    <?php else: ?>

                        <p class="stock-agotado">

                            <i class="bi bi-x-circle"></i>

                            Agotado

                        </p>


                        <button
                            type="button"
                            class="btn-agotado"
                            disabled
                        >

                            <i class="bi bi-x-circle"></i>

                            Producto agotado

                        </button>

                    <?php endif; ?>

                </div>

            </article>


        <?php

            endwhile;

        else:

        ?>

            <div class="sin-productos">

                <i class="bi bi-search"></i>


                <h3>
                    No encontramos productos
                </h3>


                <p>
                    Intenta buscar con otro término.
                </p>


                <a href="index.php">
                    Ver todos los productos
                </a>

            </div>

        <?php endif; ?>

    </div>

</section>


<!-- =====================================================
     VENTAJAS
===================================================== -->

<section class="ventajas">

    <div class="ventaja">

        <i class="bi bi-truck"></i>

        <div>

            <h3>
                Envíos
            </h3>

            <p>
                Recibe tus productos.
            </p>

        </div>

    </div>


    <div class="ventaja">

        <i class="bi bi-shield-check"></i>

        <div>

            <h3>
                Compra segura
            </h3>

            <p>
                Protegemos tus datos.
            </p>

        </div>

    </div>


    <div class="ventaja">

        <i class="bi bi-credit-card"></i>

        <div>

            <h3>
                Pago seguro
            </h3>

            <p>
                Paga mediante PayPal.
            </p>

        </div>

    </div>


    <div class="ventaja">

        <i class="bi bi-headset"></i>

        <div>

            <h3>
                Atención
            </h3>

            <p>
                Estamos para ayudarte.
            </p>

        </div>

    </div>

</section>


<!-- =====================================================
     FOOTER
===================================================== -->

<footer class="footer">

    <div class="footer-contenido">


        <!-- COLUMNA 1 -->

        <div class="footer-columna">

            <img
                src="imagenes/Logo.jpeg"
                alt="MaxiStore"
                class="footer-logo"
            >


            <p>

                Todo lo que necesitas
                en un solo lugar.

            </p>

        </div>


        <!-- COLUMNA 2 -->

        <div class="footer-columna">

            <h3>
                MaxiStore
            </h3>


            <a href="index.php">

                <i class="bi bi-house"></i>

                Inicio

            </a>


            <a href="index.php#productos">

                <i class="bi bi-grid"></i>

                Productos

            </a>


            <a
                href="<?php

                    echo $usuario_logueado

                        ? 'php/carrito.php'

                        : 'usuario/iniciar_sesion.php';

                ?>"
            >

                <i class="bi bi-cart3"></i>

                Carrito

            </a>

        </div>


        <!-- COLUMNA 3 -->

        <div class="footer-columna">

            <h3>
                Mi cuenta
            </h3>


            <?php if ($usuario_logueado): ?>

                <a href="usuario/perfil.php">

                    <i class="bi bi-person"></i>

                    Mi perfil

                </a>


                <a href="usuario/mis_pedidos.php">

                    <i class="bi bi-box-seam"></i>

                    Mis pedidos

                </a>


                <a href="php/cerrar_sesion.php">

                    <i class="bi bi-box-arrow-right"></i>

                    Cerrar sesión

                </a>


            <?php else: ?>

                <a href="usuario/iniciar_sesion.php">

                    <i class="bi bi-box-arrow-in-right"></i>

                    Iniciar sesión

                </a>


                <a href="usuario/registro.php">

                    <i class="bi bi-person-plus"></i>

                    Crear cuenta

                </a>

            <?php endif; ?>

        </div>

    </div>


    <div class="footer-bottom">

        <p>

            © 2026 MaxiStore.
            Todos los derechos reservados.

        </p>

    </div>

</footer>


<!-- =====================================================
     COOKIES
===================================================== -->

<?php

if (file_exists("cookies.php")) {

    include "cookies.php";

}

?>


<!-- =====================================================
     JAVASCRIPT GLOBAL
===================================================== -->

<script src="js/script.js"></script>


</body>

</html>
