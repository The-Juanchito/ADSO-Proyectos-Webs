
<?php

$client_id = "BAA_cSNgTEIR5h7nL2END9xzLRxbhlcZ9S4hiBz9Hl6W3GgG395tLB4un08W4TJSpiEenzxlaDrrvNcaY4";

$client_secret = "EBXH9TTCqfL7YO6JK7WJ6_3LDwyDzlQX55bz0vse3isuAW1J-xWZJspLgISr2VjvAeH4TNk82rysTbvK";

$paypal_url = "https://api-m.sandbox.paypal.com";


function obtenerAccessToken()
{
    global $client_id;
    global $client_secret;
    global $paypal_url;


    $ch = curl_init(
        $paypal_url . "/v1/oauth2/token"
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
        CURLOPT_USERPWD,
        $client_id . ":" . $client_secret
    );


    curl_setopt(
        $ch,
        CURLOPT_HTTPHEADER,
        [
            "Accept: application/json",
            "Accept-Language: en_US",
            "Content-Type: application/x-www-form-urlencoded"
        ]
    );


    curl_setopt(
        $ch,
        CURLOPT_POSTFIELDS,
        "grant_type=client_credentials"
    );


    $respuesta = curl_exec($ch);


    if ($respuesta === false) {

        $error = curl_error($ch);

        curl_close($ch);

        die(
            "Error de conexión con PayPal: " .
            htmlspecialchars($error)
        );
    }


    $codigo = curl_getinfo(
        $ch,
        CURLINFO_HTTP_CODE
    );


    curl_close($ch);


    $datos = json_decode(
        $respuesta,
        true
    );


    if (
        $codigo !== 200 ||
        !isset($datos['access_token'])
    ) {

        echo "<h2>Error al conectar con PayPal</h2>";

        echo "<p>Código HTTP: " .
             htmlspecialchars($codigo) .
             "</p>";

        echo "<pre>";

        print_r($datos);

        echo "</pre>";

        exit;
    }


    return $datos['access_token'];
}

?>