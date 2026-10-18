<?php

session_start();

require_once "conexion.php";

header("Content-Type: application/json");


/* =========================
   USUARIO
========================= */

$usuario_id =
    $_SESSION['usuario_id'] ?? 1;


/* =========================
   CARRITO
========================= */

$carrito_id =
    intval($_POST['carrito_id'] ?? 0);


/* =========================
   VALIDAR
========================= */

if ($carrito_id <= 0) {

    echo json_encode([

        "exito" => false,

        "mensaje" => "Producto no válido"

    ]);

    exit;
}


/* =========================
   ELIMINAR
========================= */

$sql = "DELETE FROM carrito

        WHERE id = ?

        AND usuario_id = ?";


$stmt = mysqli_prepare(
    $conexion,
    $sql
);


mysqli_stmt_bind_param(
    $stmt,
    "ii",
    $carrito_id,
    $usuario_id
);


mysqli_stmt_execute($stmt);


/* =========================
   VERIFICAR
========================= */

if (mysqli_stmt_affected_rows($stmt) <= 0) {

    echo json_encode([

        "exito" => false,

        "mensaje" =>
            "No se pudo eliminar el producto"

    ]);

    exit;
}


/* =========================
   CALCULAR TOTAL
========================= */

$sql_total = "SELECT

                SUM(
                    carrito.cantidad *
                    productos.precio
                ) AS total

              FROM carrito

              INNER JOIN productos

              ON carrito.producto_id =
                 productos.id

              WHERE carrito.usuario_id = ?";


$stmt = mysqli_prepare(
    $conexion,
    $sql_total
);


mysqli_stmt_bind_param(
    $stmt,
    "i",
    $usuario_id
);


mysqli_stmt_execute($stmt);


$resultado =
    mysqli_stmt_get_result($stmt);


$fila =
    $resultado->fetch_assoc();


$total =
    floatval($fila['total'] ?? 0);


/* =========================
   RESPUESTA
========================= */

echo json_encode([

    "exito" => true,

    "total" => $total

]);


exit;

?>