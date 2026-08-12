<?php
session_start();

unset($_SESSION['codigo']);
unset($_SESSION['nombre']);
unset($_SESSION['descripcion']);
unset($_SESSION['cantidad']);
unset($_SESSION['valor']);
unset($_SESSION['imagen']);
unset($_SESSION['editar']);

$_SESSION['mensaje'] = "";
$_SESSION["tipo"] = "";

header("Location: ../index.php");
exit();