<?php
session_start();

if(isset($_SESSION['usuario']))
{
    header("Location: index.php");
    exit();
}

$mensaje = "";
$tipo = "";

if(isset($_SESSION['mensaje']))
{
    $mensaje = $_SESSION['mensaje'];
    $tipo = $_SESSION['tipo'];

    unset($_SESSION['mensaje']);
    unset($_SESSION['tipo']);
}
?>

<!DOCTYPE html>
<html lang="es">

<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>Registrarse - TecnoMarket S.A.S.</title>

<link rel="stylesheet" href="css/menu.css">
<link rel="stylesheet" href="css/style.css">

</head>

<body>

<?php include("./php/menu.php"); ?>

<div class="contenedor">

<h2>Registrarse</h2>
<h3>TecnoMarket S.A.S.</h3>

<?php

if($mensaje!="")
{
    echo "<div class='mensaje
    $tipo'>
    $mensaje</div>";
}

?>

<form method="POST" action="php/registrar_usuario.php">

    <label>Nombre completo</label>
    <input type="text" name="nombre" required>

    <label>Usuario</label>
    <input type="text" name="usuario" required>

    <label>Contraseña</label>
    <input type="password" name="clave" required>

    <label>Tipo de usuario</label>
    <select name="rol" required>
        <option value=""> Seleccione un rol</option>
        <option value="administrador">Administrador</option>
        <option value="cliente">Cliente</option>
    </select>

    <div class="botones">
        <input type="submit" value="Registrarme">
        <input type="button" value="Volver"
        onclick="window.location.href='inicio.php'">
    </div>

</form>

<p class="enlace-form">¿Ya tienes cuenta?
<a href="login.php">Iniciar sesión</a></p>

</div>

</body>

</html>
