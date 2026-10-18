<?php

session_start();

require_once "../conexion.php";
require_once "configuracion.php";


/* VERIFICAR PEDIDO
 */

if (
    !isset($_SESSION['pedido_id']) ||
    !isset($_SESSION['pedido_total']) ||
    !isset($_SESSION['paypal_order_id'])
) {

    header("Location: ../checkout.php");

    exit;
}


$pedido_id = intval($_SESSION['pedido_id']);

$total = floatval($_SESSION['pedido_total']);

$paypal_order_id =
    $_SESSION['paypal_order_id'];


/* =====================================================
   VERIFICAR TOKEN DE PAYPAL
===================================================== */

if (!isset($_GET['token'])) {

    die("No se recibió el token de PayPal.");

}


$token = $_GET['token'];


/*
   PayPal devuelve el ID de la orden
   normalmente en el parámetro token.

   Verificamos que corresponda con
   nuestra orden guardada en sesión.
*/

if ($token !== $paypal_order_id) {

    die("La orden de PayPal no coincide con el pedido.");

}


/* =====================================================
   OBTENER ACCESS TOKEN
===================================================== */

$access_token = obtenerAccessToken();


/* =====================================================
   CAPTURAR PAGO EN PAYPAL
===================================================== */

$url = $paypal_url .
       "/v2/checkout/orders/" .
       urlencode($paypal_order_id) .
       "/capture";


$ch = curl_init($url);


curl_setopt(
    $ch,
    CURLOPT_RETURNTRANSFER,
    true
);


curl_setopt(
    $ch,
    CURLOPT_POST,
    true
);


curl_setopt(
    $ch,
    CURLOPT_POSTFIELDS,
    ""
);


curl_setopt(
    $ch,
    CURLOPT_HTTPHEADER,
    [

        "Content-Type: application/json",

        "Authorization: Bearer " .
        $access_token,

        "Accept: application/json"

    ]
);


/* =====================================================
   EJECUTAR CAPTURA
===================================================== */

$respuesta = curl_exec($ch);


if ($respuesta === false) {

    $error = curl_error($ch);

    curl_close($ch);

    die(
        "Error conectando con PayPal: " .
        htmlspecialchars($error)
    );

}


$codigo = curl_getinfo(
    $ch,
    CURLINFO_HTTP_CODE
);


curl_close($ch);


/* =====================================================
   DECODIFICAR RESPUESTA
===================================================== */

$datos_paypal = json_decode(
    $respuesta,
    true
);


/* =====================================================
   VERIFICAR RESPUESTA
===================================================== */

if (
    $codigo < 200 ||
    $codigo >= 300
) {

    echo "<!DOCTYPE html>";

    echo "<html lang='es'>";

    echo "<head>";

    echo "<meta charset='UTF-8'>";

    echo "<meta name='viewport' content='width=device-width, initial-scale=1.0'>";

    echo "<title>Error PayPal - MaxiStore</title>";

    echo "<style>

        body {
            font-family: Arial, sans-serif;
            background: #f5f7fa;
            padding: 40px;
        }

        .error {
            max-width: 700px;
            margin: 50px auto;
            background: white;
            padding: 35px;
            border-radius: 12px;
            border: 1px solid #dfe5ec;
            box-shadow: 0 5px 20px rgba(0,0,0,.08);
        }

        h1 {
            color: #c62828;
        }

        pre {
            background: #f1f3f5;
            padding: 20px;
            border-radius: 8px;
            overflow: auto;
        }

        a {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 20px;
            background: #0074F3;
            color: white;
            text-decoration: none;
            border-radius: 7px;
            font-weight: bold;
        }

    </style>";

    echo "</head>";

    echo "<body>";

    echo "<div class='error'>";

    echo "<h1>Error al capturar el pago</h1>";

    echo "<p>";

    echo "Código HTTP: ";

    echo "<strong>";

    echo htmlspecialchars($codigo);

    echo "</strong>";

    echo "</p>";

    echo "<pre>";

    print_r($datos_paypal);

    echo "</pre>";

    echo "<a href='../checkout.php'>";

    echo "Volver al checkout";

    echo "</a>";

    echo "</div>";

    echo "</body>";

    echo "</html>";

    exit;
}


/* =====================================================
   VERIFICAR ESTADO DEL PAGO
===================================================== */

$estado_paypal =
    $datos_paypal['status'] ?? '';


if ($estado_paypal !== 'COMPLETED') {

    die(
        "PayPal no confirmó el pago. Estado recibido: " .
        htmlspecialchars($estado_paypal)
    );

}


/* =====================================================
   INICIAR TRANSACCIÓN MYSQL
===================================================== */

mysqli_begin_transaction($conexion);


try {


    /* =================================================
       VERIFICAR ESTADO ACTUAL DEL PEDIDO
    ================================================= */

    $sql_pedido = "
        SELECT
            id,
            total,
            estado
        FROM pedidos
        WHERE id = ?
        AND usuario_id = ?
        LIMIT 1
    ";


    $stmt = mysqli_prepare(
        $conexion,
        $sql_pedido
    );


    if (!$stmt) {

        throw new Exception(
            "Error preparando pedido: " .
            mysqli_error($conexion)
        );

    }


    mysqli_stmt_bind_param(
        $stmt,
        "ii",
        $pedido_id,
        $_SESSION['usuario_id']
    );


    mysqli_stmt_execute($stmt);


    $resultado_pedido =
        mysqli_stmt_get_result($stmt);


    $pedido =
        mysqli_fetch_assoc($resultado_pedido);


    if (!$pedido) {

        throw new Exception(
            "No se encontró el pedido."
        );

    }


    /* =================================================
       EVITAR PROCESAR DOS VECES
    ================================================= */

    if ($pedido['estado'] === 'pagado') {

        mysqli_commit($conexion);

        goto mostrar_exito;

    }


    /* =================================================
       OBTENER DETALLES DEL PEDIDO
    ================================================= */

    $sql_detalles = "
        SELECT
            detalle_pedido.producto_id,
            detalle_pedido.cantidad,
            productos.nombre,
            productos.stock

        FROM detalle_pedido

        INNER JOIN productos
        ON detalle_pedido.producto_id =
           productos.id

        WHERE detalle_pedido.pedido_id = ?

        FOR UPDATE
    ";


    $stmt = mysqli_prepare(
        $conexion,
        $sql_detalles
    );


    if (!$stmt) {

        throw new Exception(
            "Error preparando detalles: " .
            mysqli_error($conexion)
        );

    }


    mysqli_stmt_bind_param(
        $stmt,
        "i",
        $pedido_id
    );


    mysqli_stmt_execute($stmt);


    $resultado_detalles =
        mysqli_stmt_get_result($stmt);


    if ($resultado_detalles->num_rows === 0) {

        throw new Exception(
            "El pedido no tiene productos."
        );

    }


    /* =================================================
       VERIFICAR STOCK
    ================================================= */

    $detalles = [];


    while (
        $detalle =
        mysqli_fetch_assoc($resultado_detalles)
    ) {


        if (
            intval($detalle['cantidad']) >
            intval($detalle['stock'])
        ) {

            throw new Exception(

                "No hay suficiente stock de " .

                htmlspecialchars(
                    $detalle['nombre']
                )

            );

        }


        $detalles[] = $detalle;

    }


    /* =================================================
       DESCONTAR STOCK
    ================================================= */

    foreach ($detalles as $detalle) {


        $producto_id =
            intval($detalle['producto_id']);


        $cantidad =
            intval($detalle['cantidad']);


        $sql_stock = "
            UPDATE productos

            SET stock = stock - ?

            WHERE id = ?

            AND stock >= ?
        ";


        $stmt = mysqli_prepare(
            $conexion,
            $sql_stock
        );


        if (!$stmt) {

            throw new Exception(
                "Error preparando actualización de stock: " .
                mysqli_error($conexion)
            );

        }


        mysqli_stmt_bind_param(
            $stmt,
            "iii",
            $cantidad,
            $producto_id,
            $cantidad
        );


        if (!mysqli_stmt_execute($stmt)) {

            throw new Exception(
                "Error actualizando stock: " .
                mysqli_stmt_error($stmt)
            );

        }


        if (mysqli_stmt_affected_rows($stmt) !== 1) {

            throw new Exception(
                "No fue posible descontar el stock."
            );

        }

    }


    /* =================================================
       ACTUALIZAR PEDIDO
    ================================================= */

    $sql_actualizar_pedido = "
        UPDATE pedidos

        SET estado = 'pagado'

        WHERE id = ?
    ";


    $stmt = mysqli_prepare(
        $conexion,
        $sql_actualizar_pedido
    );


    if (!$stmt) {

        throw new Exception(
            "Error preparando actualización del pedido: " .
            mysqli_error($conexion)
        );

    }


    mysqli_stmt_bind_param(
        $stmt,
        "i",
        $pedido_id
    );


    if (!mysqli_stmt_execute($stmt)) {

        throw new Exception(
            "Error actualizando pedido: " .
            mysqli_stmt_error($stmt)
        );

    }


    /* =================================================
       ACTUALIZAR PAGO
    ================================================= */

    $sql_pago = "
        UPDATE pagos

        SET
            estado = 'completado',
            referencia = ?

        WHERE pedido_id = ?
    ";


    /*
       Algunas bases de datos pueden no tener
       la columna referencia.

       Si tu tabla pagos sí la tiene,
       guardamos aquí el ID de PayPal.
    */


    $stmt = mysqli_prepare(
        $conexion,
        $sql_pago
    );


    if (!$stmt) {

        /*
           Si la columna referencia no existe,
           utilizamos una actualización sencilla.
        */

        $sql_pago = "
            UPDATE pagos

            SET estado = 'completado'

            WHERE pedido_id = ?
        ";


        $stmt = mysqli_prepare(
            $conexion,
            $sql_pago
        );


        if (!$stmt) {

            throw new Exception(
                "Error preparando actualización del pago: " .
                mysqli_error($conexion)
            );

        }


        mysqli_stmt_bind_param(
            $stmt,
            "i",
            $pedido_id
        );

    } else {

        mysqli_stmt_bind_param(
            $stmt,
            "si",
            $paypal_order_id,
            $pedido_id
        );

    }


    if (!mysqli_stmt_execute($stmt)) {

        throw new Exception(
            "Error actualizando pago: " .
            mysqli_stmt_error($stmt)
        );

    }


    /* =================================================
       VACIAR CARRITO
    ================================================= */

    $sql_carrito = "
        DELETE FROM carrito

        WHERE usuario_id = ?
    ";


    $stmt = mysqli_prepare(
        $conexion,
        $sql_carrito
    );


    if (!$stmt) {

        throw new Exception(
            "Error preparando limpieza del carrito: " .
            mysqli_error($conexion)
        );

    }


    $usuario_id =
        intval($_SESSION['usuario_id']);


    mysqli_stmt_bind_param(
        $stmt,
        "i",
        $usuario_id
    );


    if (!mysqli_stmt_execute($stmt)) {

        throw new Exception(
            "Error vaciando carrito: " .
            mysqli_stmt_error($stmt)
        );

    }


    /* =================================================
       CONFIRMAR TRANSACCIÓN
    ================================================= */

    mysqli_commit($conexion);


    /* =================================================
       MARCAR ÉXITO
    ================================================= */

    mostrar_exito:


    /*
       Guardamos temporalmente los datos
       necesarios para mostrar la confirmación.
    */

    $nombre =
        $_SESSION['pedido_nombre'] ?? 'Cliente';


    $telefono =
        $_SESSION['pedido_telefono'] ?? '';


    $correo =
        $_SESSION['pedido_correo'] ?? '';


    /*
       Eliminamos información temporal
       del proceso de PayPal.
    */

    unset(
        $_SESSION['paypal_order_id']
    );

    unset(
        $_SESSION['pedido_id']
    );

    unset(
        $_SESSION['pedido_total']
    );

    unset(
        $_SESSION['pedido_nombre']
    );

    unset(
        $_SESSION['pedido_telefono']
    );

    unset(
        $_SESSION['pedido_correo']
    );

} catch (Exception $e) {


    /* =================================================
       DESHACER TRANSACCIÓN
    ================================================= */

    mysqli_rollback($conexion);


    echo "<!DOCTYPE html>";

    echo "<html lang='es'>";

    echo "<head>";

    echo "<meta charset='UTF-8'>";

    echo "<meta name='viewport' content='width=device-width, initial-scale=1.0'>";

    echo "<title>Error - MaxiStore</title>";

    echo "<style>

        body {
            font-family: Arial, sans-serif;
            background: #f5f7fa;
            padding: 30px;
        }

        .error {
            max-width: 700px;
            margin: 50px auto;
            padding: 35px;
            background: white;
            border-radius: 12px;
            border: 1px solid #dfe5ec;
        }

        h1 {
            color: #c62828;
        }

        a {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 20px;
            background: #0074F3;
            color: white;
            text-decoration: none;
            border-radius: 7px;
            font-weight: bold;
        }

    </style>";

    echo "</head>";

    echo "<body>";

    echo "<div class='error'>";

    echo "<h1>";

    echo "No se pudo completar el pedido";

    echo "</h1>";

    echo "<p>";

    echo htmlspecialchars(
        $e->getMessage()
    );

    echo "</p>";

    echo "<p>";

    echo "El pago debe verificarse antes de volver a intentarlo.";

    echo "</p>";

    echo "<a href='../carrito.php'>";

    echo "Volver al carrito";

    echo "</a>";

    echo "</div>";

    echo "</body>";

    echo "</html>";

    exit;

}

?>

<!DOCTYPE html>

<html lang="es">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0">

    <title>Pedido confirmado - MaxiStore</title>

    <link
        rel="stylesheet"
        href="../../css/style.css">

    <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css">

</head>


<body>


<header class="header">

    <div class="logo">

        <a href="../../index.php">

            <img
                src="../../imagenes/Logo.jpeg"
                alt="MaxiStore">

        </a>

    </div>


    <div class="acciones">

        <a href="../../index.php">

            <i class="bi bi-house"></i>

            Inicio

        </a>

        <a href="../carrito.php">

            <i class="bi bi-cart3"></i>

            Carrito

        </a>

    </div>

</header>


<main class="confirmacion">


    <!-- =================================================
         MENSAJE
    ================================================= -->

    <section class="confirmacion-mensaje">


        <div class="confirmacion-icono">

            <i class="bi bi-check-circle-fill"></i>

        </div>


        <h1>

            ¡Pedido realizado correctamente!

        </h1>


        <p>

            Gracias por comprar en MaxiStore.

        </p>


        <div class="numero-pedido">

            Pedido #<?php echo $pedido_id; ?>

        </div>


        <p class="mensaje-pago">

            <i class="bi bi-check-circle"></i>

            Pago confirmado por PayPal

        </p>


    </section>



    <!-- =================================================
         INFORMACION
    ================================================= -->

    <div class="confirmacion-contenedor">


        <!-- DETALLE -->

        <section class="detalle-confirmacion">


            <h2>

                <i class="bi bi-receipt"></i>

                Detalle del pedido

            </h2>


            <div class="producto-confirmacion">

                <div class="producto-confirmacion-info">

                    <h3>

                        Pedido MaxiStore #<?php echo $pedido_id; ?>

                    </h3>

                    <p>

                        El pedido ha sido registrado
                        correctamente.

                    </p>

                </div>


                <strong>

                    $<?php echo number_format(
                        $total,
                        0,
                        ',',
                        '.'
                    ); ?>

                </strong>

            </div>


            <div class="total-confirmacion">

                <span>

                    Total pagado

                </span>


                <strong>

                    $<?php echo number_format(
                        $total,
                        0,
                        ',',
                        '.'
                    ); ?>

                </strong>

            </div>


        </section>



        <!-- DATOS DE CLIENTE -->

        <section class="envio-confirmacion">


            <h2>

                <i class="bi bi-truck"></i>

                Datos de envío

            </h2>


            <div class="dato-envio">

                <strong>

                    <i class="bi bi-person"></i>

                    Nombre

                </strong>

                <span>

                    <?php echo htmlspecialchars($nombre); ?>

                </span>

            </div>


            <div class="dato-envio">

                <strong>

                    <i class="bi bi-telephone"></i>

                    Teléfono

                </strong>

                <span>

                    <?php echo htmlspecialchars($telefono); ?>

                </span>

            </div>


            <div class="dato-envio">

                <strong>

                    <i class="bi bi-envelope"></i>

                    Correo

                </strong>

                <span>

                    <?php echo htmlspecialchars($correo); ?>

                </span>

            </div>


            <div class="dato-envio">

                <strong>

                    <i class="bi bi-credit-card"></i>

                    Método de pago

                </strong>

                <span>

                    PayPal

                </span>

            </div>


        </section>


    </div>



    <!-- =================================================
         BOTON
    ================================================= -->

    <section class="pago-confirmacion">


        <div class="paypal-icono">

            <i class="bi bi-paypal"></i>

        </div>


        <h2>

            ¡Gracias por tu compra!

        </h2>


        <p>

            Hemos recibido tu pago correctamente.

            Tu pedido será preparado para el envío.

        </p>


        <a
            href="../../index.php"
            class="btn-paypal">

            <i class="bi bi-shop"></i>

            Seguir comprando

        </a>


    </section>


</main>


<footer class="footer">


    <div class="footer-bottom">

        <p>

            © 2026 MaxiStore —
            Todo lo que necesitas en un solo lugar.

        </p>

    </div>


</footer>


</body>

</html>