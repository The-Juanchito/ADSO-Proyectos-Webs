<?php

session_start();

require_once "../php/conexion.php";


/* =====================================================
   VERIFICAR SESIÓN
===================================================== */

if (!isset($_SESSION['usuario_id'])) {

    header("Location: iniciar_sesion.php");

    exit;
}


$usuario_id = intval($_SESSION['usuario_id']);


/* =====================================================
   OBTENER PEDIDOS
===================================================== */

$sql = "
    SELECT
        pedidos.id,
        pedidos.fecha_pedido,
        pedidos.total,
        pedidos.estado,

        pagos.metodo_pago,
        pagos.estado AS estado_pago,
        pagos.id_transaccion

    FROM pedidos

    LEFT JOIN pagos
        ON pedidos.id = pagos.pedido_id

    WHERE pedidos.usuario_id = ?

    ORDER BY pedidos.fecha_pedido DESC
";


$stmt = mysqli_prepare(
    $conexion,
    $sql
);


if (!$stmt) {

    die(
        "Error preparando consulta: " .
        mysqli_error($conexion)
    );
}


mysqli_stmt_bind_param(
    $stmt,
    "i",
    $usuario_id
);


mysqli_stmt_execute($stmt);


$resultado =
    mysqli_stmt_get_result($stmt);

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
        Mis pedidos - MaxiStore
    </title>


    <!-- CSS GENERAL -->

    <link
        rel="stylesheet"
        href="../css/style.css"
    >


    <!-- CSS PEDIDOS -->

    <link
        rel="stylesheet"
        href="../css/pedidos.css"
    >


    <!-- ICONOS -->

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


    <!-- LOGO -->

    <div class="logo">

        <a href="../index.php">

            <img
                src="../imagenes/Logo.jpeg"
                alt="MaxiStore"
            >

        </a>

    </div>


    <!-- ACCIONES -->

    <nav class="acciones">


        <a href="../index.php">

            <i class="bi bi-house"></i>

            <span>
                Inicio
            </span>

        </a>


        <a href="perfil.php">

            <i class="bi bi-person-circle"></i>

            <span>
                Mi perfil
            </span>

        </a>


        <a
            href="../php/carrito.php"
            class="carrito-link"
        >

            <i class="bi bi-cart3"></i>

            <span>
                Carrito
            </span>

        </a>


    </nav>

</header>



<!-- =====================================================
     CONTENIDO
===================================================== -->

<main class="pedidos-contenedor">


    <!-- VOLVER -->

    <a
        href="perfil.php"
        class="volver"
    >

        <i class="bi bi-arrow-left"></i>

        Volver a mi perfil

    </a>



    <!-- TITULO -->

    <div class="pedidos-titulo">

        <span>
            MI CUENTA
        </span>

        <h1>

            <i class="bi bi-box-seam"></i>

            Mis pedidos

        </h1>

        <p>
            Consulta el historial de tus compras.
        </p>

    </div>



<?php if (
    $resultado &&
    mysqli_num_rows($resultado) > 0
): ?>


    <!-- =================================================
         LISTA DE PEDIDOS
    ================================================== -->

    <div class="pedidos-lista">


        <?php while (
            $pedido =
            mysqli_fetch_assoc($resultado)
        ): ?>


            <?php

            $estado =
                strtolower(
                    trim(
                        $pedido['estado'] ?? 'pendiente'
                    )
                );


            $estado_pago =
                strtolower(
                    trim(
                        $pedido['estado_pago'] ?? 'pendiente'
                    )
                );


            /* ================================
               CLASE ESTADO PEDIDO
            ================================= */

            $clase_estado = 'estado-pendiente';


            if ($estado === 'pagado') {

                $clase_estado = 'estado-pagado';

            } elseif (
                $estado === 'enviado'
            ) {

                $clase_estado = 'estado-enviado';

            } elseif (
                $estado === 'entregado'
            ) {

                $clase_estado = 'estado-entregado';

            } elseif (
                $estado === 'cancelado'
            ) {

                $clase_estado = 'estado-cancelado';

            }


            /* ================================
               CLASE ESTADO PAGO
            ================================= */

            $clase_pago = 'pago-pendiente';


            if ($estado_pago === 'pagado') {

                $clase_pago = 'pago-confirmado';

            } elseif (
                $estado_pago === 'completado'
            ) {

                $clase_pago = 'pago-confirmado';

            } elseif (
                $estado_pago === 'cancelado'
            ) {

                $clase_pago = 'pago-cancelado';

            }

            ?>


            <!-- =================================================
                 TARJETA PEDIDO
            ================================================== -->

            <article class="pedido-card">


                <!-- CABECERA -->

                <div class="pedido-header">


                    <div>

                        <span class="pedido-label">
                            PEDIDO
                        </span>


                        <h2>

                            #<?php

                            echo intval(
                                $pedido['id']
                            );

                            ?>

                        </h2>

                    </div>


                    <div
                        class="estado-pedido
                        <?php echo $clase_estado; ?>"
                    >

                        <?php

                        echo htmlspecialchars(
                            ucfirst($estado)
                        );

                        ?>

                    </div>


                </div>



                <!-- INFORMACIÓN -->

                <div class="pedido-informacion">


                    <!-- FECHA -->

                    <div class="dato-pedido">

                        <i class="bi bi-calendar3"></i>

                        <div>

                            <span>
                                Fecha
                            </span>

                            <strong>

                                <?php

                                echo date(
                                    'd/m/Y H:i',
                                    strtotime(
                                        $pedido['fecha_pedido']
                                    )
                                );

                                ?>

                            </strong>

                        </div>

                    </div>



                    <!-- MÉTODO -->

                    <div class="dato-pedido">

                        <i class="bi bi-credit-card"></i>

                        <div>

                            <span>
                                Método de pago
                            </span>

                            <strong>

                                <?php

                                echo htmlspecialchars(
                                    ucfirst(
                                        $pedido['metodo_pago']
                                        ?? 'PayPal'
                                    )
                                );

                                ?>

                            </strong>

                        </div>

                    </div>



                    <!-- ESTADO PAGO -->

                    <div class="dato-pedido">

                        <i class="bi bi-shield-check"></i>

                        <div>

                            <span>
                                Pago
                            </span>

                            <strong
                                class="<?php
                                    echo $clase_pago;
                                ?>"
                            >

                                <?php

                                echo htmlspecialchars(
                                    ucfirst(
                                        $estado_pago
                                    )
                                );

                                ?>

                            </strong>

                        </div>

                    </div>



                    <!-- TOTAL -->

                    <div class="dato-pedido dato-total">

                        <i class="bi bi-cash-stack"></i>

                        <div>

                            <span>
                                Total
                            </span>

                            <strong>

                                $<?php

                                echo number_format(
                                    $pedido['total'],
                                    0,
                                    ',',
                                    '.'
                                );

                                ?>

                            </strong>

                        </div>

                    </div>


                </div>



                <!-- TRANSACCIÓN -->

                <?php if (
                    !empty(
                        $pedido['id_transaccion']
                    )
                ): ?>


                    <div class="transaccion">

                        <i class="bi bi-check-circle"></i>

                        Transacción PayPal:

                        <strong>

                            <?php

                            echo htmlspecialchars(
                                $pedido['id_transaccion']
                            );

                            ?>

                        </strong>

                    </div>


                <?php endif; ?>



                <!-- ACCIONES -->

                <div class="pedido-acciones">


                    <a
                        href="detalle_pedido.php?id=<?php
                            echo intval(
                                $pedido['id']
                            );
                        ?>"
                        class="btn-ver-pedido"
                    >

                        <i class="bi bi-eye"></i>

                        Ver detalles

                    </a>


                    <a
                        href="../index.php"
                        class="btn-seguir-comprando"
                    >

                        <i class="bi bi-shop"></i>

                        Seguir comprando

                    </a>


                </div>


            </article>


        <?php endwhile; ?>


    </div>


<?php else: ?>


    <!-- =================================================
         SIN PEDIDOS
    ================================================== -->

    <div class="sin-pedidos">


        <div class="sin-pedidos-icono">

            <i class="bi bi-bag-x"></i>

        </div>


        <h2>

            Aún no tienes pedidos

        </h2>


        <p>

            Cuando realices una compra,
            tus pedidos aparecerán aquí.

        </p>


        <a
            href="../index.php"
            class="btn-ver-productos"
        >

            <i class="bi bi-shop"></i>

            Ver productos

        </a>


    </div>


<?php endif; ?>


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

                Todo lo que necesitas
                en un solo lugar.

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


            <a href="../index.php#productos">

                <i class="bi bi-grid"></i>

                Productos

            </a>


            <a href="../php/carrito.php">

                <i class="bi bi-cart3"></i>

                Carrito

            </a>


        </div>



        <!-- COLUMNA 3 -->

        <div class="footer-columna">


            <h3>
                Mi cuenta
            </h3>


            <a href="perfil.php">

                <i class="bi bi-person"></i>

                Mi perfil

            </a>


            <a href="mis_pedidos.php">

                <i class="bi bi-box-seam"></i>

                Mis pedidos

            </a>


            <a href="../php/cerrar_sesion.php">

                <i class="bi bi-box-arrow-right"></i>

                Cerrar sesión

            </a>


        </div>


    </div>



    <!-- PARTE INFERIOR -->

    <div class="footer-bottom">


        <p>

            © 2026 MaxiStore.
            Todos los derechos reservados.

        </p>


    </div>


</footer>


</body>

</html>