<?php
session_start();

if(!isset($_SESSION['usuario']))
{
    header("Location: ../login.php");
    exit();
}

if(!isset($_SESSION['rol']) ||
   $_SESSION['rol'] !== "administrador")
{
    header("Location: ../cliente.php");
    exit();
}

include("conexion.php");

$sql = "SELECT * FROM producto";

$resultado = mysqli_query(
    $conexion,$sql
);

?>

<!DOCTYPE html>

<html lang="es">

<head>

<meta charset="UTF-8">

<meta
name="viewport"
content="width=device-width, initial-scale=1.0"
>

<title>
Dashboard - TecnoMarket S.A.S.
</title>


<link
rel="stylesheet"
href="../css/menu.css"
>

<link
rel="stylesheet"
href="../css/dashboard.css"
>

</head>


<body>


<?php include("menu.php"); ?>


<div class="contenedor">


    <h2>
        Dashboard de Productos
    </h2>


    <div class="tabla-responsive">


        <table>


            <thead>

                <tr>

                    <th>
                        Código
                    </th>

                    <th>
                        Nombre
                    </th>

                    <th>
                        Descripción
                    </th>

                    <th>
                        Cantidad
                    </th>

                    <th>
                        Valor
                    </th>

                    <th>
                        Imagen
                    </th>

                    <th>
                        Acciones
                    </th>

                </tr>

            </thead>


            <tbody>


            <?php

            while(
                $fila = mysqli_fetch_assoc($resultado)
            ){

            ?>

                <tr>


                    <td>
                        <?php
                        echo htmlspecialchars(
                            $fila['codigo']
                        );
                        ?>
                    </td>


                    <td>
                        <?php
                        echo htmlspecialchars(
                            $fila['nombre']
                        );
                        ?>
                    </td>


                    <td>
                        <?php
                        echo htmlspecialchars(
                            $fila['descripcion']
                        );
                        ?>
                    </td>


                    <td>
                        <?php
                        echo htmlspecialchars(
                            $fila['cantidad']
                        );
                        ?>
                    </td>


                    <td>

                        $

                        <?php
                        echo number_format(
                            $fila['valor'],
                            0,
                            ',',
                            '.'
                        );
                        ?>

                    </td>


                    <td>

                        <?php

                        if(
                            !empty($fila['imagen'])
                        ){

                        ?>

                            <img
                            src="<?php
                            echo htmlspecialchars(
                                $fila['imagen']
                            );
                            ?>"
                            alt="Producto"
                            >

                        <?php

                        }else{

                            echo "Sin imagen";

                        }

                        ?>

                    </td>


                    <td>


                        <div class="acciones">

                            <a
                            href="actualizar.php?codigo=<?php
                            echo urlencode(
                                $fila['codigo']
                            );
                            ?>"
                            class="btnEditar"
                            >

                                Actualizar

                            </a>

                            <a
                            href="eliminar.php?codigo=<?php
                            echo urlencode(
                                $fila['codigo']
                            );
                            ?>"
                            class="btnEliminar"

                            onclick="
                            return confirm(
                            '¿Está seguro de eliminar este producto?'
                            );
                            "
                            >

                                Eliminar

                            </a>


                        </div>


                    </td>


                </tr>


            <?php

            }

            ?>


            </tbody>


        </table>


    </div>


    <br>


    <a
    href="../index.php"
    class="btnVolver"
    >

        ← Volver al formulario

    </a>


</div>


</body>

</html>