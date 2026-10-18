<?php

session_start();

$pedido_id = $_SESSION['pedido_id'] ?? 0;

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
        Pago cancelado - MaxiStore
    </title>


    <link
        rel="stylesheet"
        href="../../css/style.css"
    >


    <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css"
    >


    <style>

        .cancelado {

            max-width: 650px;

            margin: 80px auto;

            padding: 40px;

            text-align: center;

            background: #ffffff;

            border: 1px solid #dfe5ec;

            border-radius: 12px;

        }


        .icono {

            font-size: 65px;

            color: #555;

            margin-bottom: 20px;

        }


        h1 {

            color: #042C6F;

        }


        p {

            color: #555;

            font-size: 17px;

        }


        .pedido {

            margin: 20px 0;

            font-weight: bold;

            color: #042C6F;

        }


        .btn {

            display: inline-block;

            padding: 13px 22px;

            background: #0074F3;

            color: #ffffff;

            text-decoration: none;

            border-radius: 6px;

            font-weight: bold;

        }


        .btn:hover {

            background: #042C6F;

        }

    </style>

</head>


<body>


<main class="cancelado">


    <div class="icono">

        <i class="bi bi-x-circle"></i>

    </div>


    <h1>

        Pago cancelado

    </h1>


    <p>

        El pago con PayPal no fue completado.

    </p>


    <?php if ($pedido_id): ?>

        <div class="pedido">

            Pedido #<?php echo $pedido_id; ?>

        </div>

    <?php endif; ?>


    <p>

        Tu pedido permanece pendiente.

    </p>


    <a
        href="../confirmacion.php"
        class="btn"
    >

        <i class="bi bi-arrow-left"></i>

        Volver al pedido

    </a>


</main>


</body>

</html>