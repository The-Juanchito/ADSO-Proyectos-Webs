<?php

session_start();

require_once "conexion.php";


/* =====================================================
   VERIFICAR SESIÓN
===================================================== */

if (!isset($_SESSION['usuario_id'])) {

    header("Location: ../usuario/iniciar_sesion.php");

    exit;
}


$usuario_id = intval($_SESSION['usuario_id']);


/* =====================================================
   OBTENER CARRITO
===================================================== */

$sql = "
    SELECT
        carrito.id,
        carrito.producto_id,
        productos.nombre,
        productos.precio,
        productos.imagen,
        carrito.cantidad,
        (productos.precio * carrito.cantidad) AS subtotal

    FROM carrito

    INNER JOIN productos
        ON carrito.producto_id = productos.id

    WHERE carrito.usuario_id = ?

    ORDER BY carrito.id DESC
";


$stmt = mysqli_prepare(
    $conexion,
    $sql
);


if (!$stmt) {

    die(
        "Error preparando carrito: " .
        mysqli_error($conexion)
    );
}


mysqli_stmt_bind_param(
    $stmt,
    "i",
    $usuario_id
);


mysqli_stmt_execute($stmt);


$resultado = mysqli_stmt_get_result($stmt);


/* =====================================================
   VERIFICAR CARRITO
===================================================== */

if (
    !$resultado ||
    mysqli_num_rows($resultado) === 0
) {

    header("Location: carrito.php");

    exit;
}


/* =====================================================
   GUARDAR PRODUCTOS
===================================================== */

$productos = [];

$total = 0;


while (
    $producto =
    mysqli_fetch_assoc($resultado)
) {

    $productos[] = $producto;

    $total += floatval(
        $producto['subtotal']
    );
}


mysqli_stmt_close($stmt);

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
        content="Finaliza tu compra en MaxiStore."
    >

    <title>
        Finalizar compra - MaxiStore
    </title>


    <!-- CSS GENERAL -->

    <link
        rel="stylesheet"
        href="../css/style.css"
    >


    <!-- CSS CHECKOUT -->

    <link
        rel="stylesheet"
        href="../css/checkout.css"
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


        <!-- INICIO -->

        <a href="../index.php">

            <i class="bi bi-house"></i>

            <span>
                Inicio
            </span>

        </a>


        <!-- CARRITO -->

        <a href="carrito.php">

            <i class="bi bi-cart3"></i>

            <span>
                Carrito
            </span>

        </a>


        <!-- PERFIL -->

        <a href="../usuario/perfil.php">

            <i class="bi bi-person-circle"></i>

            <span>
                Mi perfil
            </span>

        </a>


    </nav>

</header>



<!-- =====================================================
     CHECKOUT
===================================================== -->

<main class="checkout">


    <!-- VOLVER -->

    <a
        href="carrito.php"
        class="volver-carrito"
    >

        <i class="bi bi-arrow-left"></i>

        Volver al carrito

    </a>



    <!-- TÍTULO -->

    <div class="checkout-titulo">

        <span>
            COMPRA SEGURA
        </span>

        <h1>

            <i class="bi bi-bag-check"></i>

            Finalizar compra

        </h1>

        <p>
            Completa tus datos para continuar con el pago.
        </p>

    </div>



    <!-- CONTENEDOR -->

    <div class="checkout-contenedor">


        <!-- =================================================
             FORMULARIO
        ================================================== -->

        <section class="formulario">


            <h2>

                <i class="bi bi-box-seam"></i>

                Datos de envío

            </h2>


            <p class="formulario-descripcion">

                Ingresa la información donde deseas recibir
                tu pedido.

            </p>



            <form
                action="procesar_pedido.php"
                method="POST"
            >


                <!-- NOMBRE -->

                <div class="campo">

                    <label for="nombre">

                        <i class="bi bi-person"></i>

                        Nombre completo

                    </label>

                    <input
                        type="text"
                        id="nombre"
                        name="nombre"
                        placeholder="Escribe tu nombre completo"
                        autocomplete="name"
                        value="<?php
                            echo htmlspecialchars(
                                $_SESSION['nombre'] ?? ''
                            );
                        ?>"
                        required
                    >

                </div>



                <!-- TELÉFONO -->

                <div class="campo">

                    <label for="telefono">

                        <i class="bi bi-telephone"></i>

                        Teléfono

                    </label>

                    <input
                        type="tel"
                        id="telefono"
                        name="telefono"
                        placeholder="Ej: 3001234567"
                        autocomplete="tel"
                        value="<?php
                            echo htmlspecialchars(
                                $_SESSION['telefono'] ?? ''
                            );
                        ?>"
                        required
                    >

                </div>



                <!-- CORREO -->

                <div class="campo">

                    <label for="correo">

                        <i class="bi bi-envelope"></i>

                        Correo electrónico

                    </label>

                    <input
                        type="email"
                        id="correo"
                        name="correo"
                        placeholder="tucorreo@gmail.com"
                        autocomplete="email"
                        value="<?php
                            echo htmlspecialchars(
                                $_SESSION['correo'] ?? ''
                            );
                        ?>"
                        required
                    >

                </div>



                <!-- DEPARTAMENTO -->

                <div class="campo">

                    <label for="departamento">

                        <i class="bi bi-map"></i>

                        Departamento

                    </label>

                    <select
                        id="departamento"
                        name="departamento"
                        required
                    >

                        <option value="">
                            Selecciona tu departamento
                        </option>

                        <option value="Santander">
                            Santander
                        </option>

                        <option value="Antioquia">
                            Antioquia
                        </option>

                        <option value="Bogotá">
                            Bogotá D.C.
                        </option>

                        <option value="Atlántico">
                            Atlántico
                        </option>

                        <option value="Valle del Cauca">
                            Valle del Cauca
                        </option>

                        <option value="Cundinamarca">
                            Cundinamarca
                        </option>

                        <option value="Bolívar">
                            Bolívar
                        </option>

                        <option value="Norte de Santander">
                            Norte de Santander
                        </option>

                        <option value="Córdoba">
                            Córdoba
                        </option>

                        <option value="Magdalena">
                            Magdalena
                        </option>

                        <option value="Cesar">
                            Cesar
                        </option>

                    </select>

                </div>



                <!-- CIUDAD -->

                <div class="campo">

                    <label for="ciudad">

                        <i class="bi bi-geo-alt"></i>

                        Ciudad

                    </label>

                    <input
                        type="text"
                        id="ciudad"
                        name="ciudad"
                        placeholder="Escribe tu ciudad"
                        autocomplete="address-level2"
                        required
                    >

                </div>



                <!-- DIRECCIÓN -->

                <div class="campo">

                    <label for="direccion">

                        <i class="bi bi-house-door"></i>

                        Dirección

                    </label>

                    <input
                        type="text"
                        id="direccion"
                        name="direccion"
                        placeholder="Ej: Calle 10 # 20-30"
                        autocomplete="street-address"
                        required
                    >

                </div>



                <!-- INDICACIONES -->

                <div class="campo">

                    <label for="indicaciones">

                        <i class="bi bi-chat-left-text"></i>

                        Indicaciones adicionales

                    </label>

                    <textarea
                        id="indicaciones"
                        name="indicaciones"
                        placeholder="Información adicional para entregar el pedido..."
                    ></textarea>

                </div>



                <!-- BOTÓN -->

                <button
                    type="submit"
                    class="btn-finalizar"
                >

                    <i class="bi bi-paypal"></i>

                    Continuar con PayPal

                    <i class="bi bi-arrow-right"></i>

                </button>


                <p class="pago-seguro">

                    <i class="bi bi-shield-check"></i>

                    Serás redirigido a PayPal para completar
                    el pago de forma segura.

                </p>


            </form>

        </section>



        <!-- =================================================
             RESUMEN
        ================================================== -->

        <aside class="resumen-checkout">


            <h2>

                <i class="bi bi-receipt"></i>

                Tu pedido

            </h2>



            <!-- PRODUCTOS -->

            <div class="productos-resumen">

                <?php foreach (
                    $productos
                    as $producto
                ): ?>


                    <div class="producto-resumen">


                        <!-- IMAGEN -->

                        <div class="producto-resumen-imagen">

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

                        <div class="producto-resumen-info">

                            <h3>

                                <?php

                                echo htmlspecialchars(
                                    $producto['nombre']
                                );

                                ?>

                            </h3>


                            <p>

                                Cantidad:

                                <?php

                                echo intval(
                                    $producto['cantidad']
                                );

                                ?>

                            </p>

                        </div>



                        <!-- PRECIO -->

                        <div class="producto-precio">

                            $<?php

                            echo number_format(
                                $producto['subtotal'],
                                0,
                                ',',
                                '.'
                            );

                            ?>

                        </div>


                    </div>


                <?php endforeach; ?>

            </div>



            <!-- TOTAL -->

            <div class="total-checkout">

                <span>
                    Total
                </span>

                <strong>

                    $<?php

                    echo number_format(
                        $total,
                        0,
                        ',',
                        '.'
                    );

                    ?>

                </strong>

            </div>



            <!-- SEGURIDAD -->

            <div class="seguridad-checkout">

                <i class="bi bi-shield-lock"></i>

                <div>

                    <strong>
                        Compra segura
                    </strong>

                    <p>
                        Tus datos están protegidos.
                    </p>

                </div>

            </div>


        </aside>


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

            <a href="carrito.php">

                <i class="bi bi-cart3"></i>

                Carrito

            </a>

            <a href="../usuario/perfil.php">

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
                rel="noopener noreferrer"
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



    <!-- FOOTER BOTTOM -->

    <div class="footer-bottom">

        <p>

            © 2026 MaxiStore.
            Todos los derechos reservados.

        </p>

    </div>


</footer>


</body>

</html>