<?php

session_start();

if(!isset($_SESSION['usuario']))
{
    header("Location: ../login.php");
    exit();
}

include("conexion.php");

if(isset($_GET['codigo']) && $_GET['codigo']!="")
{
    $codigo = $_GET['codigo'];

    $sql = "DELETE FROM producto WHERE codigo='$codigo'";

    if(mysqli_query($conexion,$sql))
    {
        $_SESSION['mensaje']="Producto eliminado correctamente";
        $_SESSION['tipo']="success";
    }
    else
    {
        $_SESSION['mensaje']="Error al eliminar";
        $_SESSION['tipo']="error";
    }
}

header("Location: dashboard.php");
exit();

?>