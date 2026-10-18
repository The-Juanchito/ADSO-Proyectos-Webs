<?php

session_start();

require_once "../conexion.php";
require_once "configuracion.php";


/* =====================================================
   VERIFICAR DATOS DE PAYPAL
===================================================== */

$order_id = $_GET['token'] ?? '';

$pedido_id = $_SESSION['pedido_id'] ?? 0;
$usuario_id = $_SESSION['usuario_id'] ?? 1;


if (empty($order_id) || empty($pedido_id)) {

    die("No se recibió correctamente la información del pago.");

}


/* =====================================================
   OBTENER ACCESS TOKEN
===================================================== */

$access_token = obtenerAccessToken();


/* =====================================================
   CAPTURAR ORDEN PAYPAL
===================================================== */

$ch = curl_init();


curl_setopt(
    $ch,
    CURLOPT_URL,
    $paypal_url .
    "/v2/checkout/orders/" .
    urlencode($order_id) .
    "/capture"
);


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
        $access_token

    ]
);


$respuesta = curl_exec($ch);


if ($respuesta === false) {

    die(
        "Error capturando el pago: " .
        curl_error($ch)
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

$datos = json_decode(
    $respuesta,
    true
);


/* =====================================================
   VERIFICAR RESPUESTA PAYPAL
===================================================== */

if (
    $codigo < 200 ||
    $codigo >= 300
) {

    echo "<h2>Error al capturar el pago</h2>";

    echo "<pre>";
    print_r($datos);
    echo "</pre>";

    exit;
}


/* =====================================================
   VERIFICAR ESTADO
===================================================== */

$estado_paypal =
    $datos['status'] ?? '';


if ($estado_paypal !== 'COMPLETED') {

    echo "<h2>El pago no fue completado.</h2>";

    echo "<p>";
    echo "Estado recibido de PayPal: ";
    echo htmlspecialchars($estado_paypal);
    echo "</p>";

    exit;
}


/* =====================================================
   OBTENER ID DE CAPTURA
===================================================== */

$paypal_capture_id = '';


if (
    isset(
        $datos['purchase_units'][0]
        ['payments']['captures'][0]['id']
    )
) {

    $paypal_capture_id =
        $datos['purchase_units'][0]
        ['payments']['captures'][0]['id'];

}


/* =====================================================
   INICIAR TRANSACCIÓN MYSQL
===================================================== */

mysqli_begin_transaction($conexion);


try {


    /* =================================================
       ACTUALIZAR TABLA PAGOS
    ================================================= */

    $sql_pago = "UPDATE pagos

                 SET
                    estado = 'aprobado',
                    transaccion_id = ?

                 WHERE pedido_id = ?

                 AND metodo_pago = 'paypal'";


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
        "si",
        $paypal_capture_id,
        $pedido_id
    );


    if (!mysqli_stmt_execute($stmt)) {

        throw new Exception(
            "Error actualizando el pago: " .
            mysqli_stmt_error($stmt)
        );

    }


    /* =================================================
       ACTUALIZAR PEDIDO
    ================================================= */

    $sql_pedido = "UPDATE pedidos

                   SET estado = 'pagado'

                   WHERE id = ?

                   AND usuario_id = ?";


    $stmt = mysqli_prepare(
        $conexion,
        $sql_pedido
    );


    if (!$stmt) {

        throw new Exception(
            "Error preparando actualización del pedido: " .
            mysqli_error($conexion)
        );

    }


    mysqli_stmt_bind_param(
        $stmt,
        "ii",
        $pedido_id,
        $usuario_id
    );


    if (!mysqli_stmt_execute($stmt)) {

        throw new Exception(
            "Error actualizando el pedido: " .
            mysqli_stmt_error($stmt)
        );

    }


    /* =================================================
       CONFIRMAR TRANSACCIÓN
    ================================================= */

    mysqli_commit($conexion);


    /* =================================================
       GUARDAR DATOS PAYPAL EN SESIÓN
    ================================================= */

    $_SESSION['paypal_capture_id'] =
        $paypal_capture_id;

    $_SESSION['paypal_order_id'] =
        $order_id;


    $_SESSION['pago_exitoso'] =
        true;


    /* =================================================
       IR A FACTURA
    ================================================= */

    header(
        "Location: ../factura.php"
    );

    exit;


} catch (Exception $e) {


    /* =================================================
       DESHACER CAMBIOS
    ================================================= */

    mysqli_rollback($conexion);


    echo "<div style='
        max-width:700px;
        margin:50px auto;
        padding:30px;
        font-family:Arial;
        background:#ffffff;
        border:1px solid #ddd;
        border-radius:10px;
    '>";

    echo "<h2 style='color:#c62828;'>
            Error procesando el pago
          </h2>";

    echo "<p>";
    echo htmlspecialchars(
        $e->getMessage()
    );
    echo "</p>";

    echo "<a
            href='../confirmacion.php'
            style='
                display:inline-block;
                padding:12px 20px;
                background:#0074F3;
                color:#ffffff;
                text-decoration:none;
                border-radius:6px;
            '
          >
            Volver al pedido
          </a>";

    echo "</div>";

    exit;

}

?>