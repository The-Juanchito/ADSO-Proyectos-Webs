
<?php

session_start();

require_once "conexion.php";


/* =====================================================
   VERIFICAR SESIÓN
===================================================== */

if (!isset($_SESSION['usuario_id'])) {

    header(
        "Location: ../usuario/iniciar_sesion.php"
    );

    exit;
}


/* =====================================================
   DATOS DEL USUARIO
===================================================== */

$usuario_id =
    intval($_SESSION['usuario_id']);

$usuario_nombre =
    $_SESSION['usuario_nombre']
    ?? $_SESSION['nombre']
    ?? '';


/* =====================================================
   CANTIDAD TOTAL DEL CARRITO
   Se utiliza para el contador del menú.
===================================================== */

$total_carrito = 0;


$sql_contador = "

    SELECT COALESCE(
        SUM(cantidad),
        0
    ) AS total

    FROM carrito

    WHERE usuario_id = ?

";


$stmt_contador =
    mysqli_prepare(
        $conexion,
        $sql_contador
    );


if ($stmt_contador) {

    mysqli_stmt_bind_param(
        $stmt_contador,
        "i",
        $usuario_id
    );

    mysqli_stmt_execute(
        $stmt_contador
    );

    $resultado_contador =
        mysqli_stmt_get_result(
            $stmt_contador
        );


    if ($resultado_contador) {

        $datos_contador =
            mysqli_fetch_assoc(
                $resultado_contador
            );


        $total_carrito =
            intval(
                $datos_contador['total']
                ?? 0
            );

    }


    mysqli_stmt_close(
        $stmt_contador
    );

}


/* =====================================================
   OBTENER PRODUCTOS DEL CARRITO
===================================================== */

$sql = "

    SELECT

        carrito.id,

        carrito.producto_id,

        productos.nombre,

        productos.precio,

        productos.imagen,

        productos.stock,

        carrito.cantidad,

        productos.precio * carrito.cantidad
        AS subtotal

    FROM carrito

    INNER JOIN productos

        ON carrito.producto_id =
           productos.id

    WHERE carrito.usuario_id = ?

    ORDER BY carrito.id DESC

";


$stmt =
    mysqli_prepare(
        $conexion,
        $sql
    );


if (!$stmt) {

    die(
        "Error preparando carrito: " .
        mysqli_error($conexion)
    );

}


mysqli_stmt_bind_param(
    $stmt,
    "i",
    $usuario_id
);


mysqli_stmt_execute(
    $stmt
);


$resultado =
    mysqli_stmt_get_result(
        $stmt
    );


/* =====================================================
   TOTAL
===================================================== */

$total = 0;

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
        content="Carrito de compras de MaxiStore."
    >

    <title>
        Carrito - MaxiStore
    </title>


    <!-- =================================================
         CSS PRINCIPAL
    ================================================== -->

    <link
        rel="stylesheet"
        href="../css/style.css"
    >


    <!-- =================================================
         CSS DEL CARRITO
    ================================================== -->

    <link
        rel="stylesheet"
        href="../css/carrito.css"
    >


    <!-- =================================================
         CSS COOKIES
    ================================================== -->

    <link
        rel="stylesheet"
        href="../css/cookies.css"
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

include "../menu.php";

?>


<!-- =====================================================
     MENSAJE
===================================================== -->

<div id="mensaje"></div>


<!-- =====================================================
     CONTENIDO PRINCIPAL
===================================================== -->

<main>

<section class="carrito">


    <!-- =================================================
         TÍTULO
    ================================================== -->

    <div class="carrito-titulo">

        <span>
            MAXISTORE
        </span>

        <h1>

            <i class="bi bi-cart3"></i>

            Tu carrito

        </h1>

        <p>
            Revisa tus productos antes de continuar.
        </p>

    </div>


<?php

/* =====================================================
   MOSTRAR PRODUCTOS
===================================================== */

if (
    $resultado &&
    mysqli_num_rows($resultado) > 0
) {


    while (
        $producto =
        mysqli_fetch_assoc($resultado)
    ) {


        $total +=
            floatval(
                $producto['subtotal']
            );


        /*
           Stock disponible después
           de la cantidad que ya está
           en el carrito.
        */

        $disponible =
            intval($producto['stock']) -
            intval($producto['cantidad']);


        if ($disponible < 0) {

            $disponible = 0;

        }


        $agotado =
            ($disponible <= 0);

?>


<!-- =====================================================
     PRODUCTO
===================================================== -->

<div
    class="producto-carrito"
    id="producto-<?php

        echo intval(
            $producto['id']
        );

    ?>"
>


    <!-- =================================================
         IMAGEN
    ================================================== -->

    <div class="imagen-carrito">

        <?php if (
            !empty(
                $producto['imagen']
            )
        ): ?>

            <img
                src="../imagenes/<?php

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

            <div class="imagen-carrito-vacia">

                <i class="bi bi-image"></i>

            </div>

        <?php endif; ?>

    </div>


    <!-- =================================================
         INFORMACIÓN
    ================================================== -->

    <div class="info-carrito">


        <h2>

            <?php

            echo htmlspecialchars(
                $producto['nombre']
            );

            ?>

        </h2>


        <!-- PRECIO -->

        <p class="precio-producto">

            Precio:

            <strong>

                $<?php

                echo number_format(
                    $producto['precio'],
                    0,
                    ',',
                    '.'
                );

                ?>

            </strong>

        </p>


        <!-- =================================================
             STOCK
        ================================================== -->

        <p class="stock">

            <i class="bi bi-box-seam"></i>

            Disponible:


            <strong
                id="stock-<?php

                    echo intval(
                        $producto['id']
                    );

                ?>"

                class="<?php

                    echo $agotado
                        ? 'stock-agotado'
                        : '';

                ?>"
            >

                <?php

                if ($agotado) {

                    echo "AGOTADO";

                } else {

                    echo intval(
                        $disponible
                    );

                }

                ?>

            </strong>


            <?php if (!$agotado): ?>

                unidades

            <?php endif; ?>

        </p>


        <!-- =================================================
             CANTIDAD
        ================================================== -->

        <div class="cantidad">


            <span class="cantidad-titulo">

                Cantidad:

            </span>


            <!-- RESTAR -->

            <button
                type="button"
                class="btn-cantidad"
                onclick="cambiarCantidad(
                    <?php

                    echo intval(
                        $producto['id']
                    );

                    ?>,
                    'disminuir'
                )"
                title="Disminuir cantidad"
            >

                <i class="bi bi-dash"></i>

            </button>


            <!-- NÚMERO -->

            <span
                class="numero"
                id="cantidad-<?php

                    echo intval(
                        $producto['id']
                    );

                ?>"
            >

                <?php

                echo intval(
                    $producto['cantidad']
                );

                ?>

            </span>


            <!-- SUMAR -->

            <button
                type="button"
                class="btn-cantidad"
                id="btn-mas-<?php

                    echo intval(
                        $producto['id']
                    );

                ?>"
                onclick="cambiarCantidad(
                    <?php

                    echo intval(
                        $producto['id']
                    );

                    ?>,
                    'aumentar'
                )"
                <?php

                echo $agotado
                    ? 'disabled'
                    : '';

                ?>
                title="Aumentar cantidad"
            >

                <i class="bi bi-plus"></i>

            </button>


        </div>


        <!-- =================================================
             SUBTOTAL
        ================================================== -->

        <p class="subtotal">

            Subtotal:

            <strong
                id="subtotal-<?php

                    echo intval(
                        $producto['id']
                    );

                ?>"
            >

                $<?php

                echo number_format(
                    $producto['subtotal'],
                    0,
                    ',',
                    '.'
                );

                ?>

            </strong>

        </p>


        <!-- =================================================
             ELIMINAR
        ================================================== -->

        <button
            type="button"
            class="btn-eliminar"
            onclick="eliminarProducto(
                <?php

                echo intval(
                    $producto['id']
                );

                ?>
            )"
        >

            <i class="bi bi-trash3"></i>

            Eliminar

        </button>


    </div>

</div>


<?php

    }


} else {

?>


<!-- =====================================================
     CARRITO VACÍO
===================================================== -->

<div class="carrito-vacio">


    <div class="carrito-vacio-icono">

        <i class="bi bi-cart-x"></i>

    </div>


    <h2>

        Tu carrito está vacío

    </h2>


    <p>

        Agrega productos para comenzar tu compra.

    </p>


    <a
        href="../index.php"
        class="btn-ver-productos"
    >

        <i class="bi bi-shop"></i>

        Ver productos

    </a>


</div>


<?php

}

?>


<!-- =====================================================
     RESUMEN
===================================================== -->

<?php

if ($total > 0) {

?>


<div class="resumen-carrito">


    <div class="resumen-titulo">

        <i class="bi bi-receipt"></i>

        <h2>
            Resumen de compra
        </h2>

    </div>


    <div class="total">

        <span>
            Total:
        </span>


        <strong id="total-carrito">

            $<?php

            echo number_format(
                $total,
                0,
                ',',
                '.'
            );

            ?>

        </strong>

    </div>


    <div class="botones-compra">


        <!-- SEGUIR COMPRANDO -->

        <a
            href="../index.php"
            class="btn-comprar btn-seguir"
        >

            <i class="bi bi-arrow-left"></i>

            Seguir comprando

        </a>


        <!-- CHECKOUT -->

        <a
            href="checkout.php"
            class="btn-comprar"
        >

            <i class="bi bi-credit-card"></i>

            Continuar con la compra

        </a>


    </div>


</div>


<?php

}

?>


</section>

</main>


<!-- =====================================================
     FOOTER
===================================================== -->

<footer class="footer">


    <div class="footer-contenido">


        <!-- =================================================
             COLUMNA 1
        ================================================== -->

        <div class="footer-columna">


            <img
                src="../imagenes/Logo.jpeg"
                alt="MaxiStore"
                class="footer-logo"
            >


            <p>
                Todo lo que necesitas
                en un solo lugar.
            </p>


        </div>


        <!-- =================================================
             COLUMNA 2
        ================================================== -->

        <div class="footer-columna">


            <h3>
                MaxiStore
            </h3>


            <a href="../index.php">

                <i class="bi bi-house"></i>

                Inicio

            </a>


            <a href="../index.php#categorias">

                <i class="bi bi-grid"></i>

                Categorías

            </a>


            <a href="../index.php#productos">

                <i class="bi bi-box-seam"></i>

                Productos

            </a>


            <a href="carrito.php">

                <i class="bi bi-cart3"></i>

                Carrito

            </a>


        </div>


        <!-- =================================================
             COLUMNA 3
        ================================================== -->

        <div class="footer-columna">


            <h3>
                Mi cuenta
            </h3>


            <a href="../usuario/perfil.php">

                <i class="bi bi-person"></i>

                Mi perfil

            </a>


            <a href="../usuario/mis_pedidos.php">

                <i class="bi bi-box-seam"></i>

                Mis pedidos

            </a>


            <a href="../php/cerrar_sesion.php">

                <i class="bi bi-box-arrow-right"></i>

                Cerrar sesión

            </a>


        </div>


    </div>


    <!-- =================================================
         FOOTER BOTTOM
    ================================================== -->

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

if (file_exists("../cookies.php")) {

    include "../cookies.php";

}

?>


<!-- =====================================================
     JAVASCRIPT GENERAL
===================================================== -->

<script src="../js/script.js"></script>


</body>

</html>
