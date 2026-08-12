<?php

session_start();

if(!isset($_SESSION['usuario']))
{
    header("Location: ../login.php");
    exit();
}

include("conexion.php");

$codigo = $_POST['codigo'];
$nombre = $_POST['nombre'];
$descripcion = $_POST['descripcion'];
$cantidad = $_POST['cantidad'];
$valor = $_POST['valor'];


if(isset($_FILES['imagen']) && $_FILES['imagen']['name']!="")
{
    $imagen = time()."_".$_FILES['imagen']['name'];
    $tmp = $_FILES['imagen']['tmp_name'];
    $ruta = "../img/" . $imagen;
    move_uploaded_file($tmp,$ruta);
}
else
{
    $ruta = "";
}


$consulta = "SELECT * FROM producto WHERE codigo='$codigo'";
$resultado = mysqli_query($conexion,$consulta);

if(mysqli_num_rows($resultado)>0)
{
    $_SESSION['mensaje']="El código ya existe";
    $_SESSION['tipo']="error";
}
else
{
    $sql="INSERT INTO producto
    (codigo,nombre,descripcion,cantidad,valor,imagen)

    VALUES

    ('$codigo',
    '$nombre',
    '$descripcion',
    '$cantidad',
    '$valor',
    '$ruta')";

    if(mysqli_query($conexion,$sql))
    {
        $_SESSION['mensaje']="Producto guardado correctamente";
        $_SESSION['tipo']="success";
    }
    else
    {
        $_SESSION['mensaje']="Error al guardar";
        $_SESSION['tipo']="error";
    }
}

unset($_SESSION['codigo']);
unset($_SESSION['nombre']);
unset($_SESSION['descripcion']);
unset($_SESSION['cantidad']);
unset($_SESSION['valor']);
unset($_SESSION['imagen']);

header("Location: ../index.php");
exit();

?>