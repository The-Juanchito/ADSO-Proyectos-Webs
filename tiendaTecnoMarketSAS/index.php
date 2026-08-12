<?php
session_start();

if(!isset($_SESSION['usuario']))
{
    header("Location: login.php");
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

<title>Sistema de Inventario TecnoMarket S.A.S.</title>

<link rel="stylesheet" href="css/menu.css">
<link rel="stylesheet" href="css/style.css">

</head>

<body>

<?php include("./php/menu.php"); ?>

<div class="contenedor">

<h2>Sistema de Inventario</h2>
<h3>TecnoMarket S.A.S.</h3>

<?php

if($mensaje!="")
{
    echo "<div class='mensaje 
    $tipo'>
    $mensaje</div>";
}

?>
<form
method="POST"
enctype="multipart/form-data"

<?php
if(isset($_SESSION['editar']))
{
    echo 'action="./php/actualizar.php"';
}
else
{
    echo 'action="./php/guardar.php"';
}
?>

>

<label>Código</label>

<input
type="number"
name="codigo"
value="<?php echo isset($_SESSION['codigo']) ? $_SESSION['codigo'] : ''; ?>"
required>

<label>Nombre</label>

<input
type="text"
name="nombre"
value="<?php echo isset($_SESSION['nombre']) ? $_SESSION['nombre'] : ''; ?>"
required>

<label>Descripción</label>

<input
type="text"
name="descripcion"
value="<?php echo isset($_SESSION['descripcion']) ? $_SESSION['descripcion'] : ''; ?>"
required>

<label>Valor</label>

<input
type="number"
step="0.01"
name="valor"
value="<?php echo isset($_SESSION['valor']) ? $_SESSION['valor'] : ''; ?>"
required>

<label>Cantidad</label>

<input
type="number"
name="cantidad"
value="<?php echo isset($_SESSION['cantidad']) ? $_SESSION['cantidad'] : ''; ?>"
required>

<label>Imagen del Producto</label>

<input
type="file"
name="imagen"
accept="image/*">

<div class="botones">

<?php

if(isset($_SESSION['editar']))
{

?>

<input
type="submit"
value="Actualizar">

<?php

}
else
{

?>

<input
type="submit"
value="Guardar">

<?php

}

?>

<input
type="button"
value="Nuevo"
onclick="window.location.href='./php/limpiar.php'">

</div>

</form>

</div>

</body>

</html>
