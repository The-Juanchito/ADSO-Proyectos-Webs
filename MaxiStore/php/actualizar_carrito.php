<?php

session_start();

require_once "conexion.php";

header("Content-Type: application/json; charset=UTF-8");


/* =====================================================
   USUARIO
===================================================== */

$usuario_id = $_SESSION['usuario_id'] ?? 1;


/* =====================================================
   DATOS RECIBIDOS
===================================================== */

$carrito_id = intval($_POST['carrito_id'] ?? 0);
$accion = $_POST['accion'] ?? "";


/* =====================================================
   VALIDAR DATOS
===================================================== */

if ($carrito_id <= 0) {

    echo json_encode([
        "exito" => false,
        "mensaje" => "Carrito no válido"
    ]);

    exit;
}


if (
    $accion !== "aumentar" &&
    $accion !== "disminuir"
) {

    echo json_encode([
        "exito" => false,
        "mensaje" => "Acción no válida"
    ]);

    exit;
}


/* =====================================================
   BUSCAR PRODUCTO DEL CARRITO
===================================================== */

$sql = "SELECT
            carrito.id,
            carrito.producto_id,
            carrito.cantidad,
            productos.nombre,
            productos.precio,
            productos.stock

        FROM carrito

        INNER JOIN productos
        ON carrito.producto_id = productos.id

        WHERE carrito.id = ?
        AND carrito.usuario_id = ?";


$stmt = mysqli_prepare($conexion, $sql);


if (!$stmt) {

    echo json_encode([
        "exito" => false,
        "mensaje" => "Error al preparar la consulta"
    ]);

    exit;
}


mysqli_stmt_bind_param(
    $stmt,
    "ii",
    $carrito_id,
    $usuario_id
);


mysqli_stmt_execute($stmt);


$resultado = mysqli_stmt_get_result($stmt);


/* =====================================================
   VERIFICAR PRODUCTO
===================================================== */

if ($resultado->num_rows === 0) {

    echo json_encode([
        "exito" => false,
        "mensaje" => "Producto no encontrado en el carrito"
    ]);

    exit;
}


$producto = $resultado->fetch_assoc();


$cantidad_actual = intval(
    $producto['cantidad']
);

$producto_id = intval(
    $producto['producto_id']
);

$precio = floatval(
    $producto['precio']
);

$stock_total = intval(
    $producto['stock']
);


/* =====================================================
   CALCULAR NUEVA CANTIDAD
===================================================== */

$nueva_cantidad = $cantidad_actual;


/* =====================================================
   AUMENTAR
===================================================== */

if ($accion === "aumentar") {

    /*
       Si ya se escogieron todas las unidades,
       no permitimos aumentar más.
    */

    if ($cantidad_actual >= $stock_total) {

        echo json_encode([

            "exito" => false,

            "agotado" => true,

            "mensaje" =>
                "¡Producto agotado! Ya escogiste todas las unidades disponibles.",

            "cantidad" =>
                $cantidad_actual,

            "stock" =>
                0

        ]);

        exit;
    }


    $nueva_cantidad =
        $cantidad_actual + 1;
}


/* =====================================================
   DISMINUIR
===================================================== */

if ($accion === "disminuir") {

    $nueva_cantidad =
        $cantidad_actual - 1;
}


/* =====================================================
   SI LLEGA A CERO
===================================================== */

if ($nueva_cantidad <= 0) {

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


    if (mysqli_stmt_affected_rows($stmt) <= 0) {

        echo json_encode([
            "exito" => false,
            "mensaje" => "No se pudo eliminar el producto"
        ]);

        exit;
    }


    /* =================================================
       CALCULAR TOTAL
    ================================================= */

    $sql_total = "SELECT
                    SUM(
                        carrito.cantidad *
                        productos.precio
                    ) AS total

                  FROM carrito

                  INNER JOIN productos
                  ON carrito.producto_id = productos.id

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


    $resultado_total =
        mysqli_stmt_get_result($stmt);


    $fila_total =
        $resultado_total->fetch_assoc();


    $total =
        floatval(
            $fila_total['total'] ?? 0
        );


    echo json_encode([

        "exito" => true,

        "eliminado" => true,

        "total" => $total

    ]);

    exit;
}


/* =====================================================
   ACTUALIZAR CARRITO
===================================================== */

$sql = "UPDATE carrito

        SET cantidad = ?

        WHERE id = ?

        AND usuario_id = ?";


$stmt = mysqli_prepare(
    $conexion,
    $sql
);


mysqli_stmt_bind_param(
    $stmt,
    "iii",
    $nueva_cantidad,
    $carrito_id,
    $usuario_id
);


mysqli_stmt_execute($stmt);


/* =====================================================
   CALCULAR STOCK DISPONIBLE
===================================================== */

$stock_disponible =
    $stock_total - $nueva_cantidad;


/*
   Nunca permitir valores negativos.
*/

if ($stock_disponible < 0) {

    $stock_disponible = 0;
}


/* =====================================================
   SABER SI ESTÁ AGOTADO
===================================================== */

$agotado =
    ($stock_disponible <= 0);


/* =====================================================
   SUBTOTAL
===================================================== */

$subtotal =
    $precio * $nueva_cantidad;


/* =====================================================
   CALCULAR TOTAL DEL CARRITO
===================================================== */

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


$resultado_total =
    mysqli_stmt_get_result($stmt);


$fila_total =
    $resultado_total->fetch_assoc();


$total =
    floatval(
        $fila_total['total'] ?? 0
    );


/* =====================================================
   MENSAJE
===================================================== */

if ($agotado) {

    $mensaje =
        "¡Producto agotado! Has escogido todas las unidades disponibles.";

} else {

    $mensaje =
        "Cantidad actualizada";
}


/* =====================================================
   RESPUESTA JSON
===================================================== */

echo json_encode([

    "exito" => true,

    "mensaje" => $mensaje,

    "producto_id" =>
        $producto_id,

    "cantidad" =>
        $nueva_cantidad,

    /*
       Stock = unidades que quedan
    */

    "stock" =>
        $stock_disponible,

    "stock_total" =>
        $stock_total,

    "subtotal" =>
        $subtotal,

    "total" =>
        $total,

    /*
       true cuando ya no queda
       ninguna unidad disponible
    */

    "agotado" =>
        $agotado

]);

exit;

?>