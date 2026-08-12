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

<title>Iniciar Sesión - TecnoMarket S.A.S.</title>

<link rel="stylesheet" href="css/menu.css">
<link rel="stylesheet" href="css/style.css">

</head>

<body>

<?php include("./php/menu.php"); ?>

<div class="contenedor">

<h2>Iniciar Sesión</h2>
<h3>TecnoMarket S.A.S.</h3>

<?php

if($mensaje!="")
{
    echo "<div class='mensaje
    $tipo'>
    $mensaje</div>";
}

?>

<form method="POST" action="php/validar_login.php">

    <label>Usuario</label>
    <input type="text" name="usuario" required>

    <label>Contraseña</label>
    <input type="password" name="clave" required>

    <div class="botones">
        <input type="submit" value="Ingresar">
        <input type="button" value="Volver"
        onclick="window.location.href='inicio.php'">
    </div>

</form>

<p class="enlace-form">¿No tienes cuenta?
<a href="registro.php">Registrarse</a></p>

</div>

</body>

</html>
