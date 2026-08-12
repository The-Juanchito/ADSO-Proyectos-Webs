<?php

$servidor = "localhost";
$usuario = "root";
$password = "";
$bd = "tiendatecnomarket";

$conexion = mysqli_connect(
    $servidor,
    $usuario,
    $password,
    $bd
);

if (!$conexion) {
    die("Error de conexión: " . mysqli_connect_error());
}

?>