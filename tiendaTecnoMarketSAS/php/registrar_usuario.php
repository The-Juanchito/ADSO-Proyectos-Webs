<?php

session_start();
include("conexion.php");

$nombre = $_POST['nombre'];
$usuario = $_POST['usuario'];
$clave = $_POST['clave'];
$rol = $_POST['rol'];

if($rol != "administrador" && $rol != "cliente")
{
    $_SESSION['mensaje'] = "Seleccione un rol válido";
    $_SESSION['tipo'] = "error";

    header("Location: ../registro.php");
    exit();
}

$sql = "SELECT * FROM roles
        WHERE usuario = '$usuario'";

$resultado = mysqli_query($conexion, $sql);


if(mysqli_num_rows($resultado) > 0)
{
    $_SESSION['mensaje'] = "El usuario ya existe";
    $_SESSION['tipo'] = "error";

    header("Location: ../registro.php");
    exit();
}

$clave_segura = password_hash(
    $clave,
    PASSWORD_DEFAULT
);

$sql = "INSERT INTO roles
        (nombre, usuario, contraseña, rol)

        VALUES
        ('$nombre',
         '$usuario',
         '$clave_segura',
         '$rol')";

if(mysqli_query($conexion, $sql))
{
    $_SESSION['mensaje'] =
        "Registro exitoso. Ahora puedes iniciar sesión.";

    $_SESSION['tipo'] = "success";

    header("Location: ../login.php");
    exit();
}
else
{
    $_SESSION['mensaje'] =
        "Error al registrar el usuario: "
        . mysqli_error($conexion);

    $_SESSION['tipo'] = "error";

    header("Location: ../registro.php");
    exit();
}

?>