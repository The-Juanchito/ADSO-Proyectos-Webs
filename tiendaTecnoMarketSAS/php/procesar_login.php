<?php
    session_start();
    include "conexion.php";

    $usuario = $_POST['usuario'];
    $contrasena = $_POST['contrasena'];
    $rol = $_POST['rol'];

    $consulta = "SELECT * FROM usuario WHERE usuario = '$usuario'";
    $resultado = mysqli_query($conexion, $consulta);

    if (mysqli_num_rows($resultado) > 0) {
        $fila = mysqli_fetch_assoc($resultado);

        if (password_verify($contrasena, $fila['contrasena'])) {

            if ($fila['rol'] == $rol) {

                $_SESSION['usuario'] = $fila['usuario'];
                $_SESSION['rol'] = $fila['rol'];

                header("Location: index.php");
                exit;

            } else {
                echo "<script>alert('El rol seleccionado no coincide con tu cuenta.'); window.location.href='login.php';</script>";
            }

        } else {
            echo "<script>alert('Contraseña incorrecta.'); window.location.href='login.php';</script>";
        }

    } else {
        echo "<script>alert('Ese usuario no existe.'); window.location.href='login.php';</script>";
    }
?>