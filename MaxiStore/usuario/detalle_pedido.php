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
   RECIBIR ID DEL PEDIDO
===================================================== */

$pedido_id = intval($_GET['id'] ?? 0);


if ($pedido_id <= 0) {

    header("Location: mis_pedidos.php");

    exit;
}



/* =====================================================
   OBTENER INFORMACIÓN DEL PEDIDO
===================================================== */

$sql_pedido = "

    SELECT

        pedidos.id,
        pedidos.usuario_id,
        pedidos.direccion_id,
        pedidos.fecha_pedido,
        pedidos.total,
        pedidos.estado,

        pagos.metodo_pago,
        pagos.estado AS estado_pago,
        pagos.id_transaccion,
        pagos.monto,
        pagos.moneda,
        pagos.fecha_pago,

        direcciones.nombre_completo,
        direcciones.telefono,
        direcciones.direccion,
        direcciones.ciudad,
        direcciones.departamento,
        direcciones.referencia

    FROM pedidos

    LEFT JOIN pagos
        ON pedidos.id = pagos.pedido_id

    LEFT JOIN direcciones
        ON pedidos.direccion_id = direcciones.id

    WHERE pedidos.id = ?
    AND pedidos.usuario_id = ?

    LIMIT 1

";


$stmt_pedido = mysqli_prepare(
    $conexion,
    $sql_pedido
);


if (!$stmt_pedido) {

    die(
        "Error preparando pedido: " .
        mysqli_error($conexion)
    );

}


mysqli_stmt_bind_param(
    $stmt_pedido,
    "ii",
    $pedido_id,
    $usuario_id
);


mysqli_stmt_execute(
    $stmt_pedido
);


$resultado_pedido =
    mysqli_stmt_get_result(
        $stmt_pedido
);



/* =====================================================
   VERIFICAR PEDIDO
===================================================== */

if (
    !$resultado_pedido ||
    mysqli_num_rows($resultado_pedido) !== 1
) {

    header("Location: mis_pedidos.php");

    exit;
}


$pedido =
    mysqli_fetch_assoc(
        $resultado_pedido
    );



/* =====================================================
   OBTENER PRODUCTOS DEL PEDIDO
===================================================== */

$sql_detalles = "

    SELECT

        detalle_pedido.id,
        detalle_pedido.producto_id,
        detalle_pedido.cantidad,
        detalle_pedido.precio,

        productos.nombre,
        productos.imagen,

        (
            detalle_pedido.precio *
            detalle_pedido.cantidad
        ) AS subtotal

    FROM detalle_pedido

    INNER JOIN productos
        ON detalle_pedido.producto_id =
           productos.id

    WHERE detalle_pedido.pedido_id = ?

    ORDER BY detalle_pedido.id ASC

";


$stmt_detalles = mysqli_prepare(
    $conexion,
    $sql_detalles
);


if (!$stmt_detalles) {

    die(
        "Error preparando detalles: " .
        mysqli_error($conexion)
    );

}


mysqli_stmt_bind_param(
    $stmt_detalles,
    "i",
    $pedido_id
);


mysqli_stmt_execute(
    $stmt_detalles
);


$resultado_detalles =
    mysqli_stmt_get_result(
        $stmt_detalles
);



/* =====================================================
   ESTADO DEL PEDIDO
===================================================== */

$estado =
    strtolower(
        trim(
            $pedido['estado'] ?? 'pendiente'
        )
    );


$clase_estado =
    'estado-pendiente';


if ($estado === 'pagado') {

    $clase_estado =
        'estado-pagado';

} elseif ($estado === 'enviado') {

    $clase_estado =
        'estado-enviado';

} elseif ($estado === 'entregado') {

    $clase_estado =
        'estado-entregado';

} elseif ($estado === 'cancelado') {

    $clase_estado =
        'estado-cancelado';

}



/* =====================================================
   ESTADO DEL PAGO
===================================================== */

$estado_pago =
    strtolower(
        trim(
            $pedido['estado_pago'] ?? 'pendiente'
        )
    );


$clase_pago =
    'pago-pendiente';


if (
    $estado_pago === 'pagado' ||
    $estado_pago === 'completado'
) {

    $clase_pago =
        'pago-confirmado';

} elseif (
    $estado_pago === 'cancelado'
) {

    $clase_pago =
        'pago-cancelado';

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
    content="Detalle de pedido de MaxiStore."
>

<title>
    Pedido #<?php echo $pedido_id; ?> - MaxiStore
</title>


<!-- CSS GENERAL -->

<link
    rel="stylesheet"
    href="../css/style.css"
>


<!-- CSS DETALLE PEDIDO -->

<link
    rel="stylesheet"
    href="../css/detalle_pedido.css"
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


    <a href="../php/carrito.php">

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

<main class="detalle-contenedor">

<!-- VOLVER -->

<a
    href="mis_pedidos.php"
    class="volver"
>

    <i class="bi bi-arrow-left"></i>

    Volver a mis pedidos

</a>



<!-- =================================================
     ENCABEZADO DEL PEDIDO
================================================== -->

<section class="detalle-header">


    <div>

        <span class="detalle-label">
            DETALLE DEL PEDIDO
        </span>


        <h1>

            Pedido #<?php

            echo $pedido_id;

            ?>

        </h1>


        <p>

            <i class="bi bi-calendar3"></i>

            Realizado el

            <?php

            echo date(
                'd/m/Y \a \l\a\s H:i',
                strtotime(
                    $pedido['fecha_pedido']
                )
            );

            ?>

        </p>

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


</section>



<!-- =================================================
     INFORMACIÓN GENERAL
================================================== -->

<section class="informacion-grid">


    <!-- PAGO -->

    <div class="informacion-card">


        <div class="informacion-icono">

            <i class="bi bi-credit-card"></i>

        </div>


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

    <div class="informacion-card">


        <div class="informacion-icono">

            <i class="bi bi-shield-check"></i>

        </div>


        <div>

            <span>
                Estado del pago
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

    <div class="informacion-card">


        <div class="informacion-icono">

            <i class="bi bi-cash-stack"></i>

        </div>


        <div>

            <span>
                Total
            </span>


            <strong class="total-azul">

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



</section>



<!-- =================================================
     PRODUCTOS
================================================== -->

<section class="detalle-seccion">


    <div class="seccion-encabezado">

        <h2>

            <i class="bi bi-box-seam"></i>

            Productos del pedido

        </h2>

    </div>



    <?php if (
        $resultado_detalles &&
        mysqli_num_rows(
            $resultado_detalles
        ) > 0
    ): ?>


        <div class="productos-detalle">


            <?php while (
                $producto =
                mysqli_fetch_assoc(
                    $resultado_detalles
                )
            ): ?>


                <article class="producto-detalle">


                    <!-- IMAGEN -->

                    <div class="producto-detalle-imagen">


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

                            <i class="bi bi-image"></i>

                        <?php endif; ?>


                    </div>



                    <!-- INFORMACIÓN -->

                    <div class="producto-detalle-info">


                        <h3>

                            <?php

                            echo htmlspecialchars(
                                $producto['nombre']
                            );

                            ?>

                        </h3>


                        <p>

                            Precio unitario:

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


                        <p>

                            Cantidad:

                            <strong>

                                <?php

                                echo intval(
                                    $producto['cantidad']
                                );

                                ?>

                            </strong>

                        </p>


                    </div>



                    <!-- SUBTOTAL -->

                    <div class="producto-detalle-subtotal">


                        <span>
                            Subtotal
                        </span>


                        <strong>

                            $<?php

                            echo number_format(
                                $producto['subtotal'],
                                0,
                                ',',
                                '.'
                            );

                            ?>

                        </strong>


                    </div>


                </article>


            <?php endwhile; ?>


        </div>


    <?php else: ?>


        <div class="sin-detalles">

            <i class="bi bi-box-seam"></i>

            <p>
                No se encontraron productos para este pedido.
            </p>

        </div>


    <?php endif; ?>


    <!-- TOTAL -->

    <div class="detalle-total">


        <span>
            Total del pedido
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


</section>



<!-- =================================================
     INFORMACIÓN DE ENVÍO
================================================== -->

<section class="detalle-seccion">


    <div class="seccion-encabezado">

        <h2>

            <i class="bi bi-truck"></i>

            Información de envío

        </h2>

    </div>



    <div class="envio-grid">


        <div class="envio-dato">

            <i class="bi bi-person"></i>

            <div>

                <span>
                    Nombre
                </span>

                <strong>

                    <?php

                    echo htmlspecialchars(
                        $pedido['nombre_completo']
                        ?? ''
                    );

                    ?>

                </strong>

            </div>

        </div>



        <div class="envio-dato">

            <i class="bi bi-telephone"></i>

            <div>

                <span>
                    Teléfono
                </span>

                <strong>

                    <?php

                    echo htmlspecialchars(
                        $pedido['telefono']
                        ?? ''
                    );

                    ?>

                </strong>

            </div>

        </div>



        <div class="envio-dato">

            <i class="bi bi-geo-alt"></i>

            <div>

                <span>
                    Dirección
                </span>

                <strong>

                    <?php

                    echo htmlspecialchars(
                        $pedido['direccion']
                        ?? ''
                    );

                    ?>

                </strong>

            </div>

        </div>



        <div class="envio-dato">

            <i class="bi bi-building"></i>

            <div>

                <span>
                    Ciudad
                </span>

                <strong>

                    <?php

                    echo htmlspecialchars(
                        $pedido['ciudad']
                        ?? ''
                    );

                    ?>

                </strong>

            </div>

        </div>



        <div class="envio-dato">

            <i class="bi bi-map"></i>

            <div>

                <span>
                    Departamento
                </span>

                <strong>

                    <?php

                    echo htmlspecialchars(
                        $pedido['departamento']
                        ?? ''
                    );

                    ?>

                </strong>

            </div>

        </div>



        <?php if (
            !empty(
                $pedido['referencia']
            )
        ): ?>


            <div class="envio-dato envio-referencia">

                <i class="bi bi-chat-left-text"></i>

                <div>

                    <span>
                        Referencia
                    </span>

                    <strong>

                        <?php

                        echo htmlspecialchars(
                            $pedido['referencia']
                        );

                        ?>

                    </strong>

                </div>

            </div>


        <?php endif; ?>


    </div>


</section>



<!-- =================================================
     INFORMACIÓN PAYPAL
================================================== -->

<?php if (
    !empty(
        $pedido['id_transaccion']
    )
): ?>


    <section class="transaccion-card">


        <div>

            <i class="bi bi-check-circle"></i>

            <div>

                <span>
                    Transacción PayPal
                </span>


                <strong>

                    <?php

                    echo htmlspecialchars(
                        $pedido['id_transaccion']
                    );

                    ?>

                </strong>

            </div>

        </div>


        <?php if (
            !empty(
                $pedido['fecha_pago']
            )
        ): ?>

            <small>

                Fecha del pago:

                <?php

                echo date(
                    'd/m/Y H:i',
                    strtotime(
                        $pedido['fecha_pago']
                    )
                );

                ?>

            </small>

        <?php endif; ?>


    </section>


<?php endif; ?>



<!-- =================================================
     BOTONES
================================================== -->

<div class="detalle-botones">


    <a
        href="mis_pedidos.php"
        class="btn-detalle btn-secundario"
    >

        <i class="bi bi-arrow-left"></i>

        Mis pedidos

    </a>


    <a
        href="../index.php"
        class="btn-detalle btn-principal"
    >

        <i class="bi bi-shop"></i>

        Seguir comprando

    </a>


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



<div class="footer-bottom">

    <p>

        © 2026 MaxiStore.
        Todos los derechos reservados.

    </p>

</div>

</footer>

</body>

</html>
