
<?php

session_start();


/* =====================================================
   SI YA ESTÁ LOGUEADO
===================================================== */

if (isset($_SESSION['usuario_id'])) {

    /* ================================================
       REDIRECCIÓN SEGÚN ROL
    ================================================ */

    if (
        isset($_SESSION['usuario_rol']) &&
        $_SESSION['usuario_rol'] === 'admin'
    ) {

        header("Location: ../admin/index1.php");
        exit;

    }

    header("Location: perfil.php");
    exit;
}


/* =====================================================
   PROCESAR LOGIN
===================================================== */

$error = "";


if ($_SERVER['REQUEST_METHOD'] === 'POST') {


    /* =================================================
       CONEXIÓN
    ================================================= */

    require_once "../php/conexion.php";


    /* =================================================
       RECIBIR DATOS
    ================================================= */

    $correo = trim(
        $_POST['correo'] ?? ''
    );

    $contrasena =
        $_POST['contrasena'] ?? '';


    /* =================================================
       VALIDAR CAMPOS
    ================================================= */

    if (
        empty($correo) ||
        empty($contrasena)
    ) {

        $error =
            "Por favor completa todos los campos.";

    } else {


        /* =================================================
           BUSCAR USUARIO
        ================================================= */

        $sql = "
            SELECT
                id,
                nombre,
                apellido,
                correo,
                telefono,
                password AS contrasena,
                rol,
                estado
            FROM usuarios
            WHERE correo = ?
            LIMIT 1
        ";


        $stmt = mysqli_prepare(
            $conexion,
            $sql
        );


        if (!$stmt) {

            $error =
                "No se pudo preparar la consulta.";

        } else {


            mysqli_stmt_bind_param(
                $stmt,
                "s",
                $correo
            );


            mysqli_stmt_execute($stmt);


            $resultado =
                mysqli_stmt_get_result($stmt);


            /* =================================================
               VERIFICAR USUARIO
            ================================================= */

            if (
                $resultado &&
                mysqli_num_rows($resultado) === 1
            ) {


                $usuario =
                    mysqli_fetch_assoc($resultado);


                /* =================================================
                   VERIFICAR ESTADO
                ================================================= */

                if (
                    $usuario['estado'] !== 'activo'
                ) {

                    $error =
                        "Tu cuenta se encuentra desactivada.";

                }


                /* =================================================
                   VERIFICAR CONTRASEÑA
                ================================================= */

                elseif (
                    password_verify(
                        $contrasena,
                        $usuario['contrasena']
                    )
                ) {


                    /* =================================================
                       REGENERAR SESIÓN
                    ================================================= */

                    session_regenerate_id(true);


                    /* =================================================
                       GUARDAR DATOS DE SESIÓN
                    ================================================= */

                    $_SESSION['usuario_id'] =
                        $usuario['id'];

                    $_SESSION['usuario_nombre'] =
                        $usuario['nombre'];

                    $_SESSION['usuario_apellido'] =
                        $usuario['apellido'];

                    $_SESSION['usuario_correo'] =
                        $usuario['correo'];

                    $_SESSION['usuario_telefono'] =
                        $usuario['telefono'];

                    $_SESSION['usuario_rol'] =
                        $usuario['rol'];


                    /* =================================================
                       REDIRECCIÓN SEGÚN ROL
                    ================================================= */

                    if (
                        $usuario['rol'] === 'admin'
                    ) {

                        header(
                            "Location: ../admin/index1.php"
                        );

                        exit;
                    }


                    /* =================================================
                       CLIENTE
                    ================================================= */

                    header(
                        "Location: perfil.php"
                    );

                    exit;


                } else {

                    $error =
                        "Correo o contraseña incorrectos.";

                }


            } else {

                $error =
                    "Correo o contraseña incorrectos.";

            }


            mysqli_stmt_close($stmt);

        }

    }

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

    <meta
        name="description"
        content="Inicia sesión en MaxiStore."
    >

    <title>
        Iniciar sesión - MaxiStore
    </title>


    <!-- =================================================
         CSS USUARIO
    ================================================== -->

    <link
        rel="stylesheet"
        href="../css/usuario.css"
    >


    <!-- =================================================
         CSS GENERAL
    ================================================== -->

    <link
        rel="stylesheet"
        href="../css/style.css"
    >


    <!-- =================================================
         CSS COOKIES
    ================================================== -->

    <link
        rel="stylesheet"
        href="../css/cookies.css"
    >


    <!-- =================================================
         BOOTSTRAP ICONS
    ================================================== -->

    <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css"
    >

</head>


<body>


<!-- =====================================================
     LOGIN
===================================================== -->

<div class="usuario-contenedor">


    <div class="usuario-card">


        <!-- =================================================
             LOGO
        ================================================== -->

        <div class="usuario-logo">

            <a href="../index.php">

                <img
                    src="../imagenes/Logo.jpeg"
                    alt="MaxiStore"
                >

            </a>

        </div>


        <!-- =================================================
             TITULO
        ================================================== -->

        <h1>
            Iniciar sesión
        </h1>


        <p class="usuario-subtitulo">

            Ingresa a tu cuenta para continuar comprando.

        </p>


        <!-- =================================================
             ERROR
        ================================================== -->

        <?php if (!empty($error)): ?>

            <div class="mensaje-error">

                <i class="bi bi-exclamation-circle"></i>

                <?php

                echo htmlspecialchars(
                    $error
                );

                ?>

            </div>

        <?php endif; ?>


        <!-- =================================================
             FORMULARIO
        ================================================== -->

        <form
            action="iniciar_sesion.php"
            method="POST"
        >


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
                        value="<?php

                        echo htmlspecialchars(
                            $_POST['correo'] ?? ''
                        );

                        ?>"
                        required
                    >

                </div>

            </div>


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
                        placeholder="Escribe tu contraseña"
                        autocomplete="current-password"
                        required
                    >

                </div>

            </div>


            <!-- =================================================
                 OPCIONES
            ================================================== -->

            <div class="opciones-login">

                <label class="recordar">

                    <input
                        type="checkbox"
                        name="recordar"
                    >

                    <span>
                        Recordarme
                    </span>

                </label>


                <a href="#">

                    ¿Olvidaste tu contraseña?

                </a>

            </div>


            <!-- =================================================
                 BOTÓN
            ================================================== -->

            <button
                type="submit"
                class="btn-principal"
            >

                <i class="bi bi-box-arrow-in-right"></i>

                Iniciar sesión

            </button>

        </form>


        <!-- =================================================
             SEPARADOR
        ================================================== -->

        <div class="separador">

            <span>
                O continúa con
            </span>

        </div>


        <!-- =================================================
             REDES
        ================================================== -->

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


        <!-- =================================================
             REGISTRO
        ================================================== -->

        <p class="enlace-login">

            ¿No tienes una cuenta?

            <a href="registro.php">
                Crear una cuenta
            </a>

        </p>


        <!-- =================================================
             VOLVER
        ================================================== -->

        <a
            href="../index.php"
            class="volver"
        >

            <i class="bi bi-arrow-left"></i>

            Volver a MaxiStore

        </a>


    </div>

</div>


<!-- =====================================================
     COOKIES
===================================================== -->

<?php

if (file_exists("../cookies.php")) {

    include "../cookies.php";

}

?>


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


            <a href="../index.php#productos">

                <i class="bi bi-grid"></i>

                Productos

            </a>


            <a href="../php/carrito.php">

                <i class="bi bi-cart3"></i>

                Carrito

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


    <div class="footer-bottom">

        <p>

            © 2026 MaxiStore.
            Todos los derechos reservados.

        </p>

    </div>

</footer>


<!-- =====================================================
     JAVASCRIPT
===================================================== -->

<script src="../js/script.js"></script>

</body>

</html>
