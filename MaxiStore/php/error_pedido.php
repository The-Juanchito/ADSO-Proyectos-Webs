<?php

session_start();


$error =
    $_SESSION['error_pedido']
    ?? 'Ocurrió un error inesperado.';


unset(
    $_SESSION['error_pedido']
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
        Error - MaxiStore
    </title>


    <link
        rel="stylesheet"
        href="../css/style.css"
    >

    <link
        rel="stylesheet"
        href="../css/procesar_pedido.css"
    >


    <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css"
    >

</head>


<body>


<main class="error-pedido">


    <div class="error-icono">

        <i class="bi bi-exclamation-circle"></i>

    </div>


    <h1>

        No se pudo procesar el pedido

    </h1>


    <p>

        <?php

        echo htmlspecialchars(
            $error
        );

        ?>

    </p>


    <div class="error-botones">


        <a
            href="checkout.php"
            class="btn-error"
        >

            <i class="bi bi-arrow-left"></i>

            Volver al checkout

        </a>


        <a
            href="../index.php"
            class="btn-error btn-inicio"
        >

            <i class="bi bi-house"></i>

            Ir al inicio

        </a>


    </div>


</main>


</body>

</html>