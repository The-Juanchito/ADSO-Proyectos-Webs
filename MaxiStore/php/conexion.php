<?php

mysqli_report(MYSQLI_REPORT_OFF);

$servidor = "127.0.0.1";
$usuario = "root";
$password = "";
$base_datos = "maxistore";
$puerto = 3307;

$conexion = new mysqli(
    $servidor,
    $usuario,
    $password,
    $base_datos,
    $puerto
);

if ($conexion->connect_error) {
    die("Error de conexión: " . $conexion->connect_error);
}

$conexion->set_charset("utf8mb4");

?>