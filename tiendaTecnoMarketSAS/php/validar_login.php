<?php

session_start();

include("conexion.php");


$usuario = $_POST['usuario'];
$clave = $_POST['clave'];


$sql = "SELECT *
        FROM roles
        WHERE usuario = ?";


$stmt = mysqli_prepare(
    $conexion,
    $sql
);


mysqli_stmt_bind_param(
    $stmt,
    "s",
    $usuario
);


mysqli_stmt_execute($stmt);


$resultado = mysqli_stmt_get_result($stmt);


if($fila = mysqli_fetch_assoc($resultado))
{

    if(password_verify(
        $clave,
        $fila['contraseña']
    ))
    {

        $_SESSION['usuario'] = $fila['usuario'];

        $_SESSION['nombre'] = $fila['nombre'];

        $_SESSION['rol'] = $fila['rol'];

        $_SESSION['id_usuario'] = $fila['id'];


        // ADMINISTRADOR
        if($fila['rol'] == "administrador")
        {
            header("Location: ../index.php");
            exit();
        }


        // CLIENTE
        if($fila['rol'] == "cliente")
        {
            header("Location: ../php/cliente.php");
            exit();
        }

    }

}


// Si llega aquí, los datos son incorrectos

$_SESSION['mensaje'] =
    "Usuario o contraseña incorrectos";

$_SESSION['tipo'] =
    "error";


header("Location: ../login.php");

exit();

?>