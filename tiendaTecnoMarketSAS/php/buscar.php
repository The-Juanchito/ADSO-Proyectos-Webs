<?php
session_start();

if(!isset($_SESSION['usuario']))
{
    header("Location: ../login.php");
    exit();
}

include("conexion.php");

if(isset($_POST['codigo']) && $_POST['codigo']!="")
{
    $codigo = $_POST['codigo'];

    $sql = "SELECT * FROM producto WHERE codigo='$codigo'";
    $resultado = mysqli_query($conexion, $sql);

    if($fila = mysqli_fetch_assoc($resultado))
    {
        $_SESSION['codigo'] = $fila['codigo'];
        $_SESSION['nombre'] = $fila['nombre'];
        $_SESSION['descripcion'] = $fila['descripcion'];
        $_SESSION['cantidad'] = $fila['cantidad'];
        $_SESSION['valor'] = $fila['valor'];
        $_SESSION['imagen'] = $fila['imagen'];

        $_SESSION['mensaje'] = "Producto encontrado";
        $_SESSION['tipo'] = "success";
    }
    else
    {
        unset($_SESSION['codigo']);
        unset($_SESSION['nombre']);
        unset($_SESSION['descripcion']);
        unset($_SESSION['cantidad']);
        unset($_SESSION['valor']);
        unset($_SESSION['imagen']);

        $_SESSION['mensaje'] = "Producto no encontrado";
        $_SESSION['tipo'] = "error";
    }

    header("Location: ../index.php");
    exit();
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Buscar Producto - TecnoMarket S.A.S.</title>

<link rel="stylesheet" href="../css/menu.css">
<link rel="stylesheet" href="../css/style.css">

</head>
<body>

<?php include("menu.php"); ?>

<div class="contenedor">

<h2>Buscar Producto</h2>
<h3>Ingresa el código del producto a buscar</h3>

<form method="POST" action="buscar.php">

    <label>Código</label>
    <input type="number" name="codigo" required>

    <div class="botones">
        <input type="submit" value="Buscar">
        <input type="button" value="Volver"
        onclick="window.location.href='../index.php'">
    </div>

</form>

</div>

</body>
</html>
