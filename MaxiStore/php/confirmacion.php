<?php

session_start();

require_once "conexion.php";


/* =====================================================
   VERIFICAR PEDIDO
===================================================== */

$pedido_id = $_SESSION['pedido_id'] ?? 0;

$usuario_id = $_SESSION['usuario_id'] ?? 1;


if (!$pedido_id) {

    header("Location: carrito.php");

    exit;

}


/* =====================================================
   OBTENER PEDIDO
===================================================== */

$sql_pedido = "SELECT
                    p.id,
                    p.total,
                    p.estado,
                    d.nombre_completo,
                    d.telefono,
                    d.direccion,
                    d.ciudad,
                    d.departamento,
                    d.referencia

               FROM pedidos p

               INNER JOIN direcciones d
               ON p.direccion_id = d.id

               WHERE p.id = ?
               AND p.usuario_id = ?";


$stmt = mysqli_prepare(
    $conexion,
    $sql_pedido
);


if (!$stmt) {

    die(
        "Error preparando pedido: " .
        mysqli_error($conexion)
    );

}


mysqli_stmt_bind_param(
    $stmt,
    "ii",
    $pedido_id,
    $usuario_id
);


mysqli_stmt_execute($stmt);


$resultado_pedido =
    mysqli_stmt_get_result($stmt);


if ($resultado_pedido->num_rows === 0) {

    die("No se encontró el pedido.");

}


$pedido =
    $resultado_pedido->fetch_assoc();


/* =====================================================
   OBTENER PRODUCTOS
===================================================== */

$sql_productos = "SELECT
                       dp.cantidad,
                       dp.precio,

                       p.nombre,
                       p.imagen

                  FROM detalle_pedido dp

                  INNER JOIN productos p
                  ON dp.producto_id = p.id

                  WHERE dp.pedido_id = ?";


$stmt_productos = mysqli_prepare(
    $conexion,
    $sql_productos
);


if (!$stmt_productos) {

    die(
        "Error preparando productos: " .
        mysqli_error($conexion)
    );

}


mysqli_stmt_bind_param(
    $stmt_productos,
    "i",
    $pedido_id
);


mysqli_stmt_execute(
    $stmt_productos
);


$resultado_productos =
    mysqli_stmt_get_result(
        $stmt_productos
    );


?>


<!DOCTYPE html>

<html lang="es">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>
        Confirmación de pedido - MaxiStore
    </title>


    <!-- CSS PRINCIPAL -->

    <link
        rel="stylesheet"
        href="../css/style.css"
    >


    <!-- CSS CONFIRMACIÓN -->

    <link
        rel="stylesheet"
        href="../css/confirmacion.css"
    >


    <!-- BOOTSTRAP ICONS -->

    <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css"
    >

</head>


<body>


<!-- =====================================================
     HEADER
===================================================== -->

<header class="header">

    <div class="logo">

        <a href="../index.php">

            <img
                src="../imagenes/Logo.jpeg"
                alt="MaxiStore"
            >

        </a>

    </div>


    <div class="acciones">

        <a href="../index.php">

            <i class="bi bi-house"></i>

            Inicio

        </a>

        <a href="carrito.php">

            <i class="bi bi-cart3"></i>

            Carrito

        </a>

    </div>

</header>


<!-- =====================================================
     CONTENIDO
===================================================== -->

<main class="confirmacion-container">


    <!-- =================================================
         CABECERA
    ================================================== -->

    <section class="confirmacion-header">


        <div class="confirmacion-icono">

            <i class="bi bi-check-lg"></i>

        </div>


        <h1>

            ¡Pedido creado correctamente!

        </h1>


        <p>

            Tu pedido ha sido registrado en MaxiStore.

        </p>


        <div class="numero-pedido">

            Pedido #

            <?php echo $pedido['id']; ?>

        </div>


    </section>



    <!-- =================================================
         GRID
    ================================================== -->

    <div class="confirmacion-grid">


        <!-- =============================================
             COLUMNA IZQUIERDA
        ============================================== -->

        <div>


            <!-- =========================================
                 PRODUCTOS
            ========================================== -->

            <section class="confirmacion-card">


                <h2>

                    <i class="bi bi-bag-check"></i>

                    Productos

                </h2>


                <?php while (
                    $producto =
                    $resultado_productos->fetch_assoc()
                ): ?>


                    <div class="producto-confirmacion">


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


                        <div class="producto-info">


                            <h3>

                                <?php
                                    echo htmlspecialchars(
                                        $producto['nombre']
                                    );
                                ?>

                            </h3>


                            <p>

                                Cantidad:

                                <strong>

                                    <?php
                                        echo $producto['cantidad'];
                                    ?>

                                </strong>

                            </p>


                            <p>

                                Precio unitario:

                                $<?php
                                    echo number_format(
                                        $producto['precio'],
                                        0,
                                        ',',
                                        '.'
                                    );
                                ?>

                            </p>


                        </div>


                        <div class="producto-precio">

                            $<?php

                            $subtotal =
                                $producto['precio'] *
                                $producto['cantidad'];

                            echo number_format(
                                $subtotal,
                                0,
                                ',',
                                '.'
                            );

                            ?>

                        </div>


                    </div>


                <?php endwhile; ?>


                <!-- TOTAL -->

                <div class="total-confirmacion">


                    <span>

                        Total

                    </span>


                    <span class="total-valor">

                        $<?php
                            echo number_format(
                                $pedido['total'],
                                0,
                                ',',
                                '.'
                            );
                        ?>

                        COP

                    </span>


                </div>


            </section>


            <!-- =========================================
                 DATOS DE ENVÍO
            ========================================== -->

            <section class="confirmacion-card">


                <h2>

                    <i class="bi bi-truck"></i>

                    Datos de envío

                </h2>


                <div class="dato-envio">

                    <i class="bi bi-person"></i>

                    <div>

                        <strong>

                            Nombre

                        </strong>

                        <span>

                            <?php
                                echo htmlspecialchars(
                                    $pedido['nombre_completo']
                                );
                            ?>

                        </span>

                    </div>

                </div>


                <div class="dato-envio">

                    <i class="bi bi-telephone"></i>

                    <div>

                        <strong>

                            Teléfono

                        </strong>

                        <span>

                            <?php
                                echo htmlspecialchars(
                                    $pedido['telefono']
                                );
                            ?>

                        </span>

                    </div>

                </div>


                <div class="dato-envio">

                    <i class="bi bi-house-door"></i>

                    <div>

                        <strong>

                            Dirección

                        </strong>

                        <span>

                            <?php
                                echo htmlspecialchars(
                                    $pedido['direccion']
                                );
                            ?>

                        </span>

                    </div>

                </div>


                <div class="dato-envio">

                    <i class="bi bi-geo-alt"></i>

                    <div>

                        <strong>

                            Ciudad

                        </strong>

                        <span>

                            <?php
                                echo htmlspecialchars(
                                    $pedido['ciudad']
                                );
                            ?>

                        </span>

                    </div>

                </div>


                <div class="dato-envio">

                    <i class="bi bi-map"></i>

                    <div>

                        <strong>

                            Departamento

                        </strong>

                        <span>

                            <?php
                                echo htmlspecialchars(
                                    $pedido['departamento']
                                );
                            ?>

                        </span>

                    </div>

                </div>


                <?php if (
                    !empty($pedido['referencia'])
                ): ?>

                    <div class="dato-envio">

                        <i class="bi bi-chat-left-text"></i>

                        <div>

                            <strong>

                                Indicaciones

                            </strong>

                            <span>

                                <?php
                                    echo htmlspecialchars(
                                        $pedido['referencia']
                                    );
                                ?>

                            </span>

                        </div>

                    </div>

                <?php endif; ?>


            </section>


        </div>



        <!-- =============================================
             COLUMNA DERECHA
        ============================================== -->

        <aside>


            <section class="confirmacion-card pago-card">


                <h2>

                    <i class="bi bi-paypal"></i>

                    Completa tu pago

                </h2>


                <p>

                    Tu pedido está creado y se encuentra
                    pendiente de pago.

                </p>


                <p>

                    Serás dirigido a PayPal Sandbox para
                    realizar el pago de forma segura.

                </p>


                <div class="estado-pedido">

                    <i class="bi bi-clock"></i>

                    <span>

                        Estado:
                        <strong>

                            <?php
                                echo htmlspecialchars(
                                    $pedido['estado']
                                );
                            ?>

                        </strong>

                    </span>

                </div>


                <div class="botones-confirmacion">


                    <a
                        href="paypal/pagar.php"
                        class="btn-paypal"
                    >

                        <i class="bi bi-paypal"></i>

                        Continuar con PayPal

                    </a>


                    <a
                        href="paypal/cancelado.php"
                        class="btn-cancelar"
                    >

                        <i class="bi bi-arrow-left"></i>

                        Cancelar y volver

                    </a>


                </div>


            </section>


        </aside>


    </div>


</main>



<!-- =====================================================
     FOOTER
===================================================== -->
<footer class="footer">

    <div class="footer-contenido">

        <!-- COLUMNA 1 -->

        <div class="footer-columna">

            <img
                src="../imagenes/Logo.jpeg"
                alt="MaxiStore"
                class="footer-logo"
            >

            <p>
                Todo lo que necesitas en un solo lugar.
            </p>

        </div>


        <!-- COLUMNA 2 -->

        <div class="footer-columna">

            <h3>
                MaxiStore
            </h3>

            <a href="../index.php">
                <i class="bi bi-house"></i>
                Inicio
            </a>

            <a href="carrito.php">
                <i class="bi bi-cart3"></i>
                Carrito
            </a>

            <a             href="../usuario/perfil.php">
                <i class="bi bi-person"></i>
                Mi perfil
            </a>

        </div>


        <!-- COLUMNA 3 -->

        <div class="footer-columna">

            <h3>
                Atención
            </h3>

            <a href="https://wa.me/573116797182?text=Hola%20MaxiStore,%20necesito%20ayuda%20con%20mi%20compra."
               target="_blank">

                <i class="bi bi-whatsapp"></i>
                WhatsApp

            </a>

            <a href="mailto:contacto@maxistore.com">

                <i class="bi bi-envelope"></i>
                Correo

            </a>

        </div>

    </div>


    <!-- PARTE INFERIOR -->

    <div class="footer-bottom">

        <p>
            © 2026 MaxiStore. Todos los derechos reservados.
        </p>

    </div>

</footer>


</body>

</html>