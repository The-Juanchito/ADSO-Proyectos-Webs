<?php

session_start();

require_once "conexion.php";


/* =====================================================
   VERIFICAR PEDIDO
===================================================== */

if (!isset($_SESSION['pedido_id'])) {

    header("Location: ../index.php");

    exit;
}


$pedido_id = $_SESSION['pedido_id'];


/* =====================================================
   OBTENER INFORMACIÓN DEL PEDIDO
===================================================== */

$sql_pedido = "SELECT

                    pedidos.id,
                    pedidos.usuario_id,
                    pedidos.direccion_id,
                    pedidos.total,
                    pedidos.estado,
                    pedidos.fecha_pedido,

                    direcciones.nombre_completo,
                    direcciones.telefono,
                    direcciones.direccion,
                    direcciones.ciudad,
                    direcciones.departamento,
                    direcciones.referencia,

                    usuarios.correo

                FROM pedidos

                INNER JOIN direcciones
                    ON pedidos.direccion_id = direcciones.id

                INNER JOIN usuarios
                    ON pedidos.usuario_id = usuarios.id

                WHERE pedidos.id = ?";


$stmt = mysqli_prepare(
    $conexion,
    $sql_pedido
);


if (!$stmt) {

    die(
        "Error preparando pedido: "
        . mysqli_error($conexion)
    );
}


mysqli_stmt_bind_param(
    $stmt,
    "i",
    $pedido_id
);


mysqli_stmt_execute($stmt);


$resultado_pedido =
    mysqli_stmt_get_result($stmt);


/* =====================================================
   VERIFICAR PEDIDO
===================================================== */

if ($resultado_pedido->num_rows == 0) {

    echo "No se encontró el pedido.";

    exit;
}


$pedido =
    $resultado_pedido->fetch_assoc();


/* =====================================================
   OBTENER PRODUCTOS DEL PEDIDO
===================================================== */

$sql_detalle = "SELECT

                    detalle_pedido.cantidad,
                    detalle_pedido.precio,

                    productos.nombre,
                    productos.imagen,

                    detalle_pedido.cantidad *
                    detalle_pedido.precio AS subtotal

                FROM detalle_pedido

                INNER JOIN productos
                    ON detalle_pedido.producto_id = productos.id

                WHERE detalle_pedido.pedido_id = ?";


$stmt = mysqli_prepare(
    $conexion,
    $sql_detalle
);


if (!$stmt) {

    die(
        "Error preparando detalle: "
        . mysqli_error($conexion)
    );
}


mysqli_stmt_bind_param(
    $stmt,
    "i",
    $pedido_id
);


mysqli_stmt_execute($stmt);


$resultado_detalle =
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
        Factura #<?php echo $pedido['id']; ?> - MaxiStore
    </title>


    <!-- =================================================
         CSS
    ================================================= -->

    <link
        rel="stylesheet"
        href="../css/style.css"
    >

    <link
        rel="stylesheet"
        href="../css/factura.css"
    >


    <!-- =================================================
         BOOTSTRAP ICONS
    ================================================= -->

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
     FACTURA
===================================================== -->

<main class="factura">


    <div class="factura-documento">


        <!-- =============================================
             ENCABEZADO
        ============================================== -->

        <div class="factura-header">


            <!-- LOGO -->

            <div class="factura-logo">

                <img
                    src="../imagenes/Logo.jpeg"
                    alt="MaxiStore"
                >

            </div>


            <!-- TITULO -->

            <div class="factura-titulo">

                <h1>

                    <i class="bi bi-receipt"></i>

                    FACTURA

                </h1>


                <p>

                    MaxiStore

                </p>

            </div>

        </div>



        <!-- =============================================
             INFORMACIÓN DEL PEDIDO
        ============================================== -->

        <div class="info-pedido">


            <div class="info-pedido-box">

                <span>

                    Número de pedido

                </span>

                <strong>

                    #<?php echo $pedido['id']; ?>

                </strong>

            </div>


            <div class="info-pedido-box">

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


            <div class="info-pedido-box">

                <span>

                    Estado

                </span>

                <strong>

                    <?php

                    echo htmlspecialchars(
                        ucfirst(
                            $pedido['estado']
                        )
                    );

                    ?>

                </strong>

            </div>


        </div>



        <!-- =============================================
             DATOS CLIENTE
        ============================================== -->

        <div class="datos-factura">


            <!-- CLIENTE -->

            <div class="datos-bloque">


                <h2>

                    <i class="bi bi-person"></i>

                    Datos del cliente

                </h2>


                <p>

                    <strong>
                        Nombre:
                    </strong>

                    <?php

                    echo htmlspecialchars(
                        $pedido['nombre_completo']
                    );

                    ?>

                </p>


                <p>

                    <strong>
                        Teléfono:
                    </strong>

                    <?php

                    echo htmlspecialchars(
                        $pedido['telefono']
                    );

                    ?>

                </p>


                <p>

                    <strong>
                        Correo:
                    </strong>

                    <?php

                    echo htmlspecialchars(
                        $pedido['correo']
                    );

                    ?>

                </p>


            </div>



            <!-- ENTREGA -->

            <div class="datos-bloque">


                <h2>

                    <i class="bi bi-geo-alt"></i>

                    Datos de entrega

                </h2>


                <p>

                    <strong>
                        Dirección:
                    </strong>

                    <?php

                    echo htmlspecialchars(
                        $pedido['direccion']
                    );

                    ?>

                </p>


                <p>

                    <strong>
                        Ciudad:
                    </strong>

                    <?php

                    echo htmlspecialchars(
                        $pedido['ciudad']
                    );

                    ?>

                </p>


                <p>

                    <strong>
                        Departamento:
                    </strong>

                    <?php

                    echo htmlspecialchars(
                        $pedido['departamento']
                    );

                    ?>

                </p>


                <?php

                if (
                    !empty(
                        $pedido['referencia']
                    )
                ):

                ?>

                    <p>

                        <strong>
                            Referencia:
                        </strong>

                        <?php

                        echo htmlspecialchars(
                            $pedido['referencia']
                        );

                        ?>

                    </p>

                <?php endif; ?>


            </div>


        </div>



        <!-- =============================================
             PRODUCTOS
        ============================================== -->

        <h2>

            <i class="bi bi-box-seam"></i>

            Productos

        </h2>


        <table class="tabla-factura">


            <thead>

                <tr>

                    <th>
                        Producto
                    </th>

                    <th>
                        Precio
                    </th>

                    <th class="texto-centro">
                        Cantidad
                    </th>

                    <th class="texto-derecha">
                        Subtotal
                    </th>

                </tr>

            </thead>


            <tbody>


                <?php

                while (
                    $producto =
                    $resultado_detalle->fetch_assoc()
                ):

                ?>


                    <tr>


                        <!-- PRODUCTO -->

                        <td>


                            <div
                                style="
                                    display:flex;
                                    align-items:center;
                                    gap:12px;
                                "
                            >


                                <?php

                                if (
                                    !empty(
                                        $producto['imagen']
                                    )
                                ):

                                ?>

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
                                        style="
                                            width:60px;
                                            height:60px;
                                            object-fit:contain;
                                        "
                                    >

                                <?php endif; ?>


                                <span>

                                    <?php

                                    echo htmlspecialchars(
                                        $producto['nombre']
                                    );

                                    ?>

                                </span>


                            </div>


                        </td>



                        <!-- PRECIO -->

                        <td>

                            $

                            <?php

                            echo number_format(
                                $producto['precio'],
                                0,
                                ',',
                                '.'
                            );

                            ?>

                        </td>



                        <!-- CANTIDAD -->

                        <td class="texto-centro">

                            <?php

                            echo $producto['cantidad'];

                            ?>

                        </td>



                        <!-- SUBTOTAL -->

                        <td class="texto-derecha">

                            <strong>

                                $

                                <?php

                                echo number_format(
                                    $producto['subtotal'],
                                    0,
                                    ',',
                                    '.'
                                );

                                ?>

                            </strong>

                        </td>


                    </tr>


                <?php endwhile; ?>


            </tbody>


        </table>



        <!-- =============================================
             TOTAL
        ============================================== -->

        <div class="factura-total">


            <div class="total-box">


                <div class="total-final">

                    <span>

                        TOTAL

                    </span>


                    <strong>

                        $

                        <?php

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



        <!-- =============================================
             ESTADO DEL PAGO
        ============================================== -->

        <div class="estado-pago">


            <span>

                <i class="bi bi-credit-card"></i>

                Método de pago:

            </span>


            <strong>

                PayPal

            </strong>


            <br>


            <span>

                Moneda:

            </span>


            <strong>

                COP

            </strong>


        </div>



        <!-- =============================================
             MENSAJE
        ============================================== -->

        <div class="mensaje-factura">


            <h3>

                <i class="bi bi-check-circle"></i>

                Gracias por comprar en MaxiStore

            </h3>


            <p>

                Tu pedido ha sido registrado correctamente.

            </p>


            <p>

                Conserva esta factura como comprobante
                de tu compra.

            </p>


        </div>



        <!-- =============================================
             BOTONES
        ============================================== -->

        <div class="factura-acciones">


            <button
                type="button"
                onclick="window.print()"
                class="btn-imprimir"
            >

                <i class="bi bi-printer"></i>

                Imprimir factura

            </button>


            <a
                href="../index.php"
                class="btn-tienda"
            >

                <i class="bi bi-shop"></i>

                Volver a la tienda

            </a>


        </div>


    </div>


</main>



<!-- =====================================================
     FOOTER
===================================================== -->

<footer>


    <h2>

        MaxiStore

    </h2>


    <p>

        Todo lo que necesitas en un solo lugar.

    </p>


    <p>

        © 2026 MaxiStore

    </p>


</footer>


</body>

</html>