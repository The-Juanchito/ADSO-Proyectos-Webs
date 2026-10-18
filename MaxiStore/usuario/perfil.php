<?php

session_start();

require_once __DIR__ . "/../php/conexion.php";

function obtenerConteoUsuario(mysqli $conexion, string $sql, int $usuarioId): int
{
    $stmt = mysqli_prepare($conexion, $sql);

    if (!$stmt) {
        error_log("Error preparando conteo de perfil: " . mysqli_error($conexion));
        http_response_code(500);
        exit("No fue posible cargar la información del perfil.");
    }

    if (
        !mysqli_stmt_bind_param($stmt, "i", $usuarioId) ||
        !mysqli_stmt_execute($stmt)
    ) {
        error_log("Error ejecutando conteo de perfil: " . mysqli_stmt_error($stmt));
        mysqli_stmt_close($stmt);
        http_response_code(500);
        exit("No fue posible cargar la información del perfil.");
    }

    $resultado = mysqli_stmt_get_result($stmt);

    if (!$resultado) {
        error_log("Error leyendo conteo de perfil: " . mysqli_stmt_error($stmt));
        mysqli_stmt_close($stmt);
        http_response_code(500);
        exit("No fue posible cargar la información del perfil.");
    }

    $fila = mysqli_fetch_assoc($resultado);
    mysqli_stmt_close($stmt);

    return (int)($fila['total'] ?? 0);
}


/* =====================================================
   VERIFICAR SESIÓN
===================================================== */

if (!isset($_SESSION['usuario_id'])) {

    header("Location: iniciar_sesion.php");

    exit;
}


$usuario_id =
    intval($_SESSION['usuario_id']);


/* =====================================================
   OBTENER USUARIO
===================================================== */

$sql = "
    SELECT
        id,
        nombre,
        apellido,
        correo,
        telefono,
        rol,
        fecha_registro
    FROM usuarios
    WHERE id = ?
    LIMIT 1
";


$stmt =
    mysqli_prepare(
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


$usuario =
    mysqli_fetch_assoc($resultado);


mysqli_stmt_close($stmt);


if (!$usuario) {

    session_destroy();

    header("Location: iniciar_sesion.php");

    exit;
}


/* =====================================================
   ACTUALIZAR NOMBRE DE SESIÓN
===================================================== */

$_SESSION['nombre'] =
    $usuario['nombre'];

$_SESSION['apellido'] =
    $usuario['apellido'];

$_SESSION['correo'] =
    $usuario['correo'];

$_SESSION['telefono'] =
    $usuario['telefono'];

$_SESSION['rol'] =
    $usuario['rol'];


/* =====================================================
   CONTAR PEDIDOS
===================================================== */

$sql_pedidos = "
    SELECT COUNT(*) AS total
    FROM pedidos
    WHERE usuario_id = ?
";

$total_pedidos = obtenerConteoUsuario(
    $conexion,
    $sql_pedidos,
    $usuario_id
);


/* =====================================================
   CONTAR PRODUCTOS DEL CARRITO
===================================================== */

$sql_carrito = "
    SELECT COALESCE(SUM(detalle.cantidad), 0) AS total
    FROM carritos AS carrito
    LEFT JOIN carrito_detalles AS detalle
        ON detalle.carrito_id = carrito.id
    WHERE carrito.usuario_id = ?
";

$total_carrito = obtenerConteoUsuario(
    $conexion,
    $sql_carrito,
    $usuario_id
);

$escapar = static function ($valor): string {
    return htmlspecialchars(
        (string)($valor ?? ''),
        ENT_QUOTES | ENT_SUBSTITUTE,
        'UTF-8'
    );
};

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
        Mi perfil - MaxiStore
    </title>


    <link
        rel="stylesheet"
        href="../css/style.css"
    >

    <link
        rel="stylesheet"
        href="../css/perfil.css"
    >

    <link
        rel="stylesheet"
        href="../css/cookies.css"
    >


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


        <!-- INICIO -->

        <a href="../index.php">

            <i class="bi bi-house"></i>

            <span>
                Inicio
            </span>

        </a>


        <!-- CARRITO -->

        <a href="../php/carrito.php">

            <i class="bi bi-cart3"></i>

            <span>
                Carrito
            </span>


            <?php if ($total_carrito > 0): ?>

                <span class="contador-carrito">

                    <?php
                    echo $total_carrito;
                    ?>

                </span>

            <?php endif; ?>

        </a>


        <!-- PERFIL -->

        <a
            href="perfil.php"
            class="activo"
        >

            <i class="bi bi-person-circle"></i>

            <span>
                Mi perfil
            </span>

        </a>


        <!-- CERRAR SESIÓN -->

        <a href="../php/cerrar_sesion.php">

            <i class="bi bi-box-arrow-right"></i>

            <span>
                Cerrar sesión
            </span>

        </a>


    </nav>

</header>



<!-- =====================================================
     CONTENIDO
===================================================== -->

<main class="perfil-contenedor">


    <!-- BIENVENIDA -->

    <section class="perfil-bienvenida">

        <div>

            <span class="saludo">

                <i class="bi bi-person-check"></i>

                Mi cuenta

            </span>


            <h1>

                ¡Hola,

                <?php

                echo $escapar($usuario['nombre']);

                ?>!

            </h1>


            <p>

                Administra tu información y consulta
                tus compras desde aquí.

            </p>

        </div>


        <div class="perfil-avatar">

            <i class="bi bi-person"></i>

        </div>

    </section>



    <!-- ESTADÍSTICAS -->

    <section class="perfil-estadisticas">


        <div class="estadistica">

            <i class="bi bi-bag-check"></i>

            <div>

                <strong>

                    <?php
                    echo $total_pedidos;
                    ?>

                </strong>

                <span>
                    Pedidos
                </span>

            </div>

        </div>


        <div class="estadistica">

            <i class="bi bi-cart3"></i>

            <div>

                <strong>

                    <?php
                    echo $total_carrito;
                    ?>

                </strong>

                <span>
                    Productos en carrito
                </span>

            </div>

        </div>


        <div class="estadistica">

            <i class="bi bi-person"></i>

            <div>

                <strong>

                    <?php

                    echo ucfirst(
                        $escapar($usuario['rol'])
                    );

                    ?>

                </strong>

                <span>
                    Tipo de cuenta
                </span>

            </div>

        </div>


    </section>



    <!-- TARJETAS -->

    <section class="perfil-grid">


        <!-- INFORMACIÓN -->

        <div class="perfil-card">

            <div class="card-icon">

                <i class="bi bi-person-vcard"></i>

            </div>


            <h2>
                Mi información
            </h2>


            <div class="dato">

                <span>
                    Nombre completo
                </span>

                <strong>

                    <?php

                    echo $escapar($usuario['nombre']);

                    ?>

                    <?php

                    echo " ";

                    echo $escapar($usuario['apellido']);

                    ?>

                </strong>

            </div>


            <div class="dato">

                <span>
                    Correo electrónico
                </span>

                <strong>

                    <?php

                    echo $escapar($usuario['correo']);

                    ?>

                </strong>

            </div>


            <div class="dato">

                <span>
                    Teléfono
                </span>

                <strong>

                    <?php

                    echo $escapar($usuario['telefono']);

                    ?>

                </strong>

            </div>


        </div>



        <!-- PEDIDOS -->

        <div class="perfil-card">

            <div class="card-icon">

                <i class="bi bi-box-seam"></i>

            </div>


            <h2>
                Mis pedidos
            </h2>


            <p class="card-texto">

                Consulta tus pedidos, estados de pago
                y detalles de tus compras.

            </p>


            <a
                href="mis_pedidos.php"
                class="btn-card"
            >

                <i class="bi bi-eye"></i>

                Ver mis pedidos

            </a>

        </div>



    </section>



    <!-- CERRAR SESIÓN -->

    <div class="cerrar-cuenta">

        <a
            href="../php/cerrar_sesion.php"
            class="btn-cerrar"
        >

            <i class="bi bi-box-arrow-right"></i>

            Cerrar sesión

        </a>

    </div>


</main>



<!-- COOKIES -->

<?php

if (file_exists(__DIR__ . "/../cookies.php")) {

    include __DIR__ . "/../cookies.php";

}

?>



<!-- FOOTER -->

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


            <a href="../php/carrito.php">

                <i class="bi bi-cart3"></i>

                Carrito

            </a>


            <a href="perfil.php">

                <i class="bi bi-person"></i>

                Mi perfil

            </a>

        </div>


        <!-- COLUMNA 3 -->

        <div class="footer-columna">

            <h3>
                Atención
            </h3>


            <a
                href="https://wa.me/573116797182?text=Hola%20MaxiStore,%20necesito%20ayuda%20con%20mi%20compra."
                target="_blank"
            >

                <i class="bi bi-whatsapp"></i>

                WhatsApp

            </a>


            <a href="mailto:contacto@maxistore.com">

                <i class="bi bi-envelope"></i>

                Correo

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

<script src="../js/script.js"></script>
</body>

</html>