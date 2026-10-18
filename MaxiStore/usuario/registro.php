<?php

session_start();


/* =====================================================
   SI EL USUARIO YA ESTÁ LOGUEADO
===================================================== */

if (isset($_SESSION['usuario_id'])) {

    header("Location: perfil.php");

    exit;
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

    <title>Crear cuenta - MaxiStore</title>


    <!-- CSS USUARIO -->

    <link
        rel="stylesheet"
        href="../css/usuario.css"
    >


    <!-- CSS GENERAL -->

    <link
        rel="stylesheet"
        href="../css/style.css"
    >


    <!-- CSS COOKIES -->

    <link
        rel="stylesheet"
        href="../css/cookies.css"
    >


    <!-- ICONOS -->

    <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css"
    >

</head>


<body>


<!-- =====================================================
     REGISTRO
===================================================== -->

<div class="usuario-contenedor">


    <div class="usuario-card">


        <!-- LOGO -->

        <div class="usuario-logo">

            <a href="../index.php">

                <img
                    src="../imagenes/Logo.jpeg"
                    alt="MaxiStore"
                >

            </a>

        </div>


        <!-- TITULO -->

        <h1>
            Crear una cuenta
        </h1>


        <p class="usuario-subtitulo">

            Regístrate en MaxiStore y disfruta de tus compras.

        </p>



        <!-- =================================================
             FORMULARIO
        ================================================== -->

        <form
            action="guardar_usuario.php"
            method="POST"
        >


            <!-- NOMBRE -->

            <div class="campo">

                <label for="nombre">

                    <i class="bi bi-person"></i>

                    Nombre

                </label>


                <div class="campo-input">

                    <i class="bi bi-person"></i>

                    <input
                        type="text"
                        id="nombre"
                        name="nombre"
                        placeholder="Tu nombre"
                        autocomplete="given-name"
                        required
                    >

                </div>

            </div>



            <!-- APELLIDO -->

            <div class="campo">

                <label for="apellido">

                    <i class="bi bi-person"></i>

                    Apellido

                </label>


                <div class="campo-input">

                    <i class="bi bi-person"></i>

                    <input
                        type="text"
                        id="apellido"
                        name="apellido"
                        placeholder="Tu apellido"
                        autocomplete="family-name"
                        required
                    >

                </div>

            </div>



            <!-- CORREO -->

            <div class="campo">

                <label for="correo">

                    <i class="bi bi-envelope"></i>

                    Correo electrónico

                </label>


                <div class="campo-input">

                    <i class="bi bi-envelope"></i>

                    <input
                        type="email"
                        id="correo"
                        name="correo"
                        placeholder="correo@ejemplo.com"
                        autocomplete="email"
                        required
                    >

                </div>

            </div>



            <!-- TELEFONO -->

            <div class="campo">

                <label for="telefono">

                    <i class="bi bi-telephone"></i>

                    Teléfono

                </label>


                <div class="campo-input">

                    <i class="bi bi-telephone"></i>

                    <input
                        type="tel"
                        id="telefono"
                        name="telefono"
                        placeholder="3001234567"
                        autocomplete="tel"
                        required
                    >

                </div>

            </div>

            <p class="usuario-subtitulo">
                Las cuentas nuevas se crean como clientes. Solo un administrador
                puede asignar el rol de administrador desde el panel.
            </p>


            <!-- CONTRASEÑA -->

            <div class="campo">

                <label for="contrasena">

                    <i class="bi bi-lock"></i>

                    Contraseña

                </label>


                <div class="campo-input">

                    <i class="bi bi-lock"></i>

                    <input
                        type="password"
                        id="contrasena"
                        name="contrasena"
                        placeholder="Crea una contraseña"
                        minlength="8"
                        autocomplete="new-password"
                        required
                    >

                </div>

            </div>



            <!-- CONFIRMAR CONTRASEÑA -->

            <div class="campo">

                <label for="confirmar_contrasena">

                    <i class="bi bi-lock-fill"></i>

                    Confirmar contraseña

                </label>


                <div class="campo-input">

                    <i class="bi bi-lock-fill"></i>

                    <input
                        type="password"
                        id="confirmar_contrasena"
                        name="confirmar_contrasena"
                        placeholder="Repite tu contraseña"
                        minlength="8"
                        autocomplete="new-password"
                        required
                    >

                </div>

            </div>



            <!-- BOTÓN -->

            <button
                type="submit"
                class="btn-principal"
            >

                <i class="bi bi-person-plus"></i>

                Crear cuenta

            </button>


        </form>



        <!-- SEPARADOR -->

        <div class="separador">

            <span>
                O regístrate con
            </span>

        </div>



        <!-- REDES -->

        <div class="redes-login">


            <button
                type="button"
                class="btn-google"
                disabled
            >

                <i class="bi bi-google"></i>

                Google

            </button>


            <button
                type="button"
                class="btn-facebook"
                disabled
            >

                <i class="bi bi-facebook"></i>

                Facebook

            </button>


        </div>



        <!-- LOGIN -->

        <p class="enlace-login">

            ¿Ya tienes una cuenta?

            <a href="iniciar_sesion.php">

                Inicia sesión

            </a>

        </p>



        <!-- VOLVER -->

        <a
            href="../index.php"
            class="volver"
        >

            <i class="bi bi-arrow-left"></i>

            Volver a MaxiStore

        </a>


    </div>

</div>



<!-- COOKIES -->

<?php include "../cookies.php"; ?>



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


            <!-- CORREGIDO -->

            <a href="../php/carrito.php">

                <i class="bi bi-cart3"></i>

                Carrito

            </a>


            <a href="iniciar_sesion.php">

                <i class="bi bi-person"></i>

                Mi cuenta

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



    <!-- PARTE INFERIOR -->

    <div class="footer-bottom">


        <p>

            © 2026 MaxiStore. Todos los derechos reservados.

        </p>


    </div>


</footer>


</body>

</html>