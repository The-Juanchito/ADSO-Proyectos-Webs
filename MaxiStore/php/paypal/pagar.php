<?php

session_start();

require_once "configuracion.php";


/* =====================================================
   VERIFICAR PEDIDO
===================================================== */

if (
    !isset($_SESSION['pedido_id']) ||
    !isset($_SESSION['pedido_total'])
) {

    header("Location: ../checkout.php");

    exit;
}


$pedido_id = $_SESSION['pedido_id'];

$total = $_SESSION['pedido_total'];


/* =====================================================
   OBTENER ACCESS TOKEN
===================================================== */

$access_token = obtenerAccessToken();


/* =====================================================
   CONVERSIÓN COP → USD
===================================================== */

/*
   PayPal Sandbox trabaja con USD.

   Esta tasa es solamente para pruebas.
   Posteriormente podemos manejar una tasa
   actualizada o configurar otra estrategia.
*/

$tasa = 4000;

$total_usd = round($total / $tasa, 2);


/* =====================================================
   EVITAR VALOR MENOR A 0.01 USD
===================================================== */

if ($total_usd < 0.01) {

    $total_usd = 0.01;

}


/* =====================================================
   CREAR DATOS DE LA ORDEN
===================================================== */

$datos_orden = [

    "intent" => "CAPTURE",

    "purchase_units" => [

        [

            "reference_id" =>
                "MAXISTORE-" . $pedido_id,

            "description" =>
                "Compra MaxiStore - Pedido #" .
                $pedido_id,

            "amount" => [

                "currency_code" => "USD",

                "value" =>
                    number_format(
                        $total_usd,
                        2,
                        '.',
                        ''
                    )
            ]
        ]
    ],

    "application_context" => [

        "brand_name" => "MaxiStore",

        "landing_page" => "LOGIN",

        "user_action" => "PAY_NOW",

        "return_url" =>
            "http://localhost/los_phpsistas/MaxiStore/php/paypal/exito.php",

        "cancel_url" =>
            "http://localhost/los_phpsistas/MaxiStore/php/paypal/cancelado.php"
    ]
];


/* =====================================================
   CONVERTIR A JSON
===================================================== */

$json_orden = json_encode(
    $datos_orden,
    JSON_UNESCAPED_UNICODE
);


/* =====================================================
   CONECTAR CON PAYPAL
===================================================== */

$ch = curl_init();


curl_setopt(
    $ch,
    CURLOPT_URL,
    $paypal_url . "/v2/checkout/orders"
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
    $json_orden
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
   EJECUTAR
===================================================== */

$respuesta = curl_exec($ch);


/* =====================================================
   ERROR CURL
===================================================== */

if ($respuesta === false) {

    $error = curl_error($ch);

    curl_close($ch);

    die(
        "Error conectando con PayPal: " .
        htmlspecialchars($error)
    );

}


/* =====================================================
   CÓDIGO HTTP
===================================================== */

$codigo = curl_getinfo(
    $ch,
    CURLINFO_HTTP_CODE
);


curl_close($ch);


/* =====================================================
   DECODIFICAR RESPUESTA
===================================================== */

$orden = json_decode(
    $respuesta,
    true
);


/* =====================================================
   VERIFICAR RESPUESTA
===================================================== */

if (
    $codigo < 200 ||
    $codigo >= 300 ||
    !isset($orden['id'])
) {

    echo "<!DOCTYPE html>";

    echo "<html lang='es'>";

    echo "<head>";

    echo "<meta charset='UTF-8'>";

    echo "<title>Error PayPal</title>";

    echo "</head>";

    echo "<body style='
        font-family:Arial;
        background:#f5f7fa;
        padding:40px;
    '>";

    echo "<div style='
        max-width:700px;
        margin:auto;
        background:white;
        padding:30px;
        border-radius:12px;
        box-shadow:0 5px 20px rgba(0,0,0,.08);
    '>";

    echo "<h2 style='color:#c62828;'>
            Error al crear el pago
          </h2>";

    echo "<p>
            Código HTTP:
            <strong>" .
            htmlspecialchars($codigo) .
            "</strong>
          </p>";

    echo "<pre style='
        background:#f1f3f5;
        padding:20px;
        border-radius:8px;
        overflow:auto;
    '>";

    print_r($orden);

    echo "</pre>";

    echo "<a href='../checkout.php'
        style='
            display:inline-block;
            padding:12px 20px;
            background:#0074F3;
            color:white;
            text-decoration:none;
            border-radius:6px;
            font-weight:bold;
        '>
        Volver al checkout
    </a>";

    echo "</div>";

    echo "</body>";

    echo "</html>";

    exit;
}


/* =====================================================
   GUARDAR ID DE PAYPAL
===================================================== */

$_SESSION['paypal_order_id'] =
    $orden['id'];


/* =====================================================
   BUSCAR ENLACE DE APROBACIÓN
===================================================== */

$url_aprobacion = null;


if (
    isset($orden['links']) &&
    is_array($orden['links'])
) {

    foreach (
        $orden['links'] as $link
    ) {

        if (
            isset($link['rel']) &&
            $link['rel'] === 'approve'
        ) {

            $url_aprobacion =
                $link['href'];

            break;
        }
    }
}


/* =====================================================
   VERIFICAR URL
===================================================== */

if (!$url_aprobacion) {

    die(
        "No se encontró el enlace de aprobación de PayPal."
    );

}


/* =====================================================
   ENVIAR AL LOGIN DE PAYPAL
===================================================== */

header(
    "Location: " . $url_aprobacion
);

exit;

?>