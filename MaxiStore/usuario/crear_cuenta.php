<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Crear cuenta | MaxiStore</title>

    <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="../css/menu.css">

    <style>
        .registro-contenedor {
            max-width: 520px;
            margin: 45px auto;
            padding: 30px;
            background: #fff;
            border-radius: 14px;
            box-shadow: 0 4px 18px rgba(0, 0, 0, .10);
        }

        .registro-contenedor h1 {
            text-align: center;
            color: #042C6F;
            margin-bottom: 10px;
        }

        .registro-descripcion {
            text-align: center;
            color: #666;
            margin-bottom: 25px;
        }

        .registro-grupo {
            margin-bottom: 17px;
        }

        .registro-grupo label {
            display: block;
            margin-bottom: 7px;
            font-weight: 600;
            color: #222;
        }

        .registro-grupo input {
            width: 100%;
            padding: 12px;
            border: 1px solid #ccc;
            border-radius: 7px;
            font-size: 15px;
            box-sizing: border-box;
        }

        .registro-grupo input:focus {
            outline: none;
            border-color: #0074F3;
            box-shadow: 0 0 0 2px rgba(0, 116, 243, .12);
        }

        .registro-boton {
            width: 100%;
            padding: 13px;
            border: none;
            border-radius: 7px;
            background: #0074F3;
            color: #fff;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
        }

        .registro-boton:hover {
            background: #042C6F;
        }

        .registro-login {
            text-align: center;
            margin-top: 20px;
        }

        .registro-login a {
            color: #0074F3;
            text-decoration: none;
            font-weight: bold;
        }

        @media (max-width: 600px) {
            .registro-contenedor {
                margin: 25px 15px;
                padding: 22px;
            }
        }
    </style>
</head>

<body>

    <?php include_once "../menu.php"; ?>

    <main class="registro-contenedor">

        <h1>Crear mi cuenta</h1>

        <p class="registro-descripcion">
            Regístrate en MaxiStore y comienza a comprar.
        </p>

        <form action="guardar_usuario.php" method="POST">

            <div class="registro-grupo">
                <label for="nombre">Nombre</label>
                <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    required
                    maxlength="100"
                    autocomplete="given-name"
                    placeholder="Ingresa tu nombre">
            </div>

            <div class="registro-grupo">
                <label for="apellido">Apellido</label>
                <input
                    type="text"
                    id="apellido"
                    name="apellido"
                    required
                    maxlength="100"
                    autocomplete="family-name"
                    placeholder="Ingresa tu apellido">
            </div>

            <div class="registro-grupo">
                <label for="correo">Correo electrónico</label>
                <input
                    type="email"
                    id="correo"
                    name="correo"
                    required
                    maxlength="150"
                    autocomplete="email"
                    placeholder="ejemplo@correo.com">
            </div>

            <div class="registro-grupo">
                <label for="telefono">Teléfono</label>
                <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    required
                    maxlength="20"
                    autocomplete="tel"
                    placeholder="Ingresa tu teléfono">
            </div>

            <p class="registro-descripcion">
                Las cuentas nuevas se crean como clientes. Solo un administrador
                puede asignar el rol de administrador desde el panel.
            </p>

            <div class="registro-grupo">
                <label for="contrasena">Contraseña</label>
                <input
                    type="password"
                    id="contrasena"
                    name="contrasena"
                    required
                    minlength="8"
                    autocomplete="new-password"
                    placeholder="Mínimo 8 caracteres">
            </div>

            <div class="registro-grupo">
                <label for="confirmar_contrasena">
                    Confirmar contraseña
                </label>
                <input
                    type="password"
                    id="confirmar_contrasena"
                    name="confirmar_contrasena"
                    required
                    minlength="8"
                    autocomplete="new-password"
                    placeholder="Repite tu contraseña">
            </div>

            <button type="submit" class="registro-boton">
                Crear cuenta
            </button>

        </form>

        <p class="registro-login">
            ¿Ya tienes una cuenta?
            <a href="iniciar_sesion.php">Inicia sesión</a>
        </p>

    </main>

</body>
</html>