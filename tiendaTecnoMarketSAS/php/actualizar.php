<?php
session_start();

if(!isset($_SESSION['usuario']))
{
    header("Location: ../login.php");
    exit();
}

if(
    !isset($_SESSION['rol']) ||
    $_SESSION['rol'] !== "administrador"
)
{
    header("Location: ../cliente.php");
    exit();
}

include("conexion.php");

if(isset($_GET['codigo']))
{

    $codigo = $_GET['codigo'];


    $sql = "SELECT *
            FROM producto
            WHERE codigo = ?";


    $stmt = mysqli_prepare(
        $conexion,
        $sql
    );


    mysqli_stmt_bind_param(
        $stmt,
        "s",
        $codigo
    );


    mysqli_stmt_execute($stmt);


    $resultado =
        mysqli_stmt_get_result($stmt);

    if($fila = mysqli_fetch_assoc($resultado))
    {

        $_SESSION['codigo'] =
            $fila['codigo'];

        $_SESSION['nombre'] =
            $fila['nombre'];

        $_SESSION['descripcion'] =
            $fila['descripcion'];

        $_SESSION['cantidad'] =
            $fila['cantidad'];

        $_SESSION['valor'] =
            $fila['valor'];

        $_SESSION['imagen'] =
            $fila['imagen'];


        $_SESSION['editar'] = true;


        header(
            "Location: ../index.php"
        );

        exit();

    }

    $_SESSION['mensaje'] =
        "Producto no encontrado";

    $_SESSION['tipo'] =
        "error";


    header(
        "Location: ../php/dashboard.php"
    );

    exit();
}

if(isset($_POST['codigo']))
{

    $codigo =
        $_POST['codigo'];

    $nombre =
        $_POST['nombre'];

    $descripcion =
        $_POST['descripcion'];

    $cantidad =
        $_POST['cantidad'];

    $valor =
        $_POST['valor'];

    if(
        isset($_FILES['imagen']) &&
        $_FILES['imagen']['error'] === 0
    )
    {

        $nombreImagen =
            time() . "_" .
            basename(
                $_FILES['imagen']['name']
            );


        $tmp =
            $_FILES['imagen']['tmp_name'];


        $ruta =
            "../img/" . $nombreImagen;


        if(
            move_uploaded_file(
                $tmp,
                $ruta
            )
        )
        {

            $sql = "UPDATE producto SET
                    nombre = ?,
                    descripcion = ?,
                    cantidad = ?,
                    valor = ?,
                    imagen = ?
                    WHERE codigo = ?";


            $stmt = mysqli_prepare(
                $conexion,
                $sql
            );


            mysqli_stmt_bind_param(
                $stmt,
                "ssidss",
                $nombre,
                $descripcion,
                $cantidad,
                $valor,
                $ruta,
                $codigo
            );

        }

    }
    else
    {

        $sql = "UPDATE producto SET
                nombre = ?,
                descripcion = ?,
                cantidad = ?,
                valor = ?
                WHERE codigo = ?";


        $stmt = mysqli_prepare(
            $conexion,
            $sql
        );


        mysqli_stmt_bind_param(
            $stmt,
            "ssids",
            $nombre,
            $descripcion,
            $cantidad,
            $valor,
            $codigo
        );

    }

    if(mysqli_stmt_execute($stmt))
    {

        $_SESSION['mensaje'] =
            "Producto actualizado correctamente";

        $_SESSION['tipo'] =
            "success";

    }
    else
    {

        $_SESSION['mensaje'] =
            "Error al actualizar el producto";

        $_SESSION['tipo'] =
            "error";

    }

    unset($_SESSION['editar']);

    unset($_SESSION['codigo']);

    unset($_SESSION['nombre']);

    unset($_SESSION['descripcion']);

    unset($_SESSION['cantidad']);

    unset($_SESSION['valor']);

    unset($_SESSION['imagen']);


    header(
        "Location: ../index.php"
    );

    exit();

}

?>