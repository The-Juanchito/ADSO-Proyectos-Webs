<?php
    include "conexion.php";

    $usuario = $_POST['usuario'];
    $contrasena = $_POST['contrasena'];
    $rol = $_POST['rol'];

    $contrasena_hasheada = password_hash($contrasena, PASSWORD_DEFAULT);

    $insertar = "INSERT INTO usuario (usuario, contrasena, rol) 
                 VALUES ('$usuario', '$contrasena_hasheada', '$rol')";

    if (mysqli_query($conexion, $insertar)) {
        echo "<script>alert('Usuario registrado con éxito.'); window.location.href='login.php';</script>";
    } else {
        echo "<script>alert('Error: ese usuario ya existe o hubo un problema.'); window.location.href='registro.php';</script>";
    }
?>