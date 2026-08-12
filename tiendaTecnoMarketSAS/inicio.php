<?php
session_start();
?>

<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TecnoMarket S.A.S.</title>

<link rel="stylesheet" href="css/style.css">
<link rel="stylesheet" href="css/menu.css">

</head>
<body>

<?php include("./php/menu.php"); ?>

<div class="contenedor">

<h1>Bienvenido a TecnoMarket S.A.S.</h1>

<h2>Sistema de Inventario</h2>
<p>Administra el inventario de la empresa
de manera rápida y segura.</p>

<div class="botones-inicio">

<?php if(isset($_SESSION['usuario'])){ ?>

<a href="index.php">
<button class="btnInicio">Ingresar al Sistema</button></a>

<?php }else{ ?>

<a href="login.php">
<button class="btnInicio">Iniciar sesión</button></a>

<a href="registro.php">
<button class="btnInicio">Registrarse</button></a>

<?php } ?>

</div>
</div>
</body>
</html>
