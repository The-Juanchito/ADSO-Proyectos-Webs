<?php

session_start();

require_once "conexion.php";

header("Content-Type: application/json; charset=utf-8");


/* =========================
   USUARIO
========================= */

$usuario_id = intval($_SESSION['usuario_id'] ?? 1);


/* =========================
   PRODUCTO
========================= */

$producto_id = intval($_POST['producto_id'] ?? 0);


/* =========================
   VALIDAR PRODUCTO
========================= */

if ($producto_id <= 0) {

    echo json_encode([
        "exito" => false,
        "mensaje" => "Producto no válido"
    ]);

    exit;
}


/* =========================
   BUSCAR PRODUCTO
========================= */

$sql = "SELECT
            id,
            nombre,
            precio,
            stock,
            estado
        FROM productos
        WHERE id = ?";

$stmt = mysqli_prepare($conexion, $sql);

if (!$stmt) {

    echo json_encode([
        "exito" => false,
        "mensaje" => "Error al preparar la consulta: " . mysqli_error($conexion)
    ]);

    exit;
}

mysqli_stmt_bind_param(
    $stmt,
    "i",
    $producto_id
);

if (!mysqli_stmt_execute($stmt)) {

    echo json_encode([
        "exito" => false,
        "mensaje" => "Error al buscar el producto: " . mysqli_stmt_error($stmt)
    ]);

    exit;
}

$resultado = mysqli_stmt_get_result($stmt);


/* =========================
   VERIFICAR PRODUCTO
========================= */

if (!$resultado || $resultado->num_rows == 0) {

    echo json_encode([
        "exito" => false,
        "mensaje" => "El producto no existe"
    ]);

    exit;
}


$producto = $resultado->fetch_assoc();

$stock = intval($producto['stock']);


/* =========================
   VERIFICAR ESTADO
========================= */

if (intval($producto['estado']) != 1) {

    echo json_encode([
        "exito" => false,
        "mensaje" => "Este producto no está disponible"
    ]);

    exit;
}


/* =========================
   VERIFICAR STOCK
========================= */

if ($stock <= 0) {

    echo json_encode([
        "exito" => false,
        "mensaje" => "Producto agotado"
    ]);

    exit;
}


/* =========================
   BUSCAR CARRITO
========================= */

$sql = "SELECT
            id,
            cantidad
        FROM carrito
        WHERE usuario_id = ?
        AND producto_id = ?
        LIMIT 1";

$stmt = mysqli_prepare($conexion, $sql);

if (!$stmt) {

    echo json_encode([
        "exito" => false,
        "mensaje" => "Error al preparar carrito: " . mysqli_error($conexion)
    ]);

    exit;
}

mysqli_stmt_bind_param(
    $stmt,
    "ii",
    $usuario_id,
    $producto_id
);

if (!mysqli_stmt_execute($stmt)) {

    echo json_encode([
        "exito" => false,
        "mensaje" => "Error al consultar carrito: " . mysqli_stmt_error($stmt)
    ]);

    exit;
}

$resultado = mysqli_stmt_get_result($stmt);


/* =========================
   SI YA EXISTE
========================= */

if ($resultado && $resultado->num_rows > 0) {

    $carrito = $resultado->fetch_assoc();

    $carrito_id = intval($carrito['id']);

    $cantidad_actual = intval($carrito['cantidad']);


    /* =========================
       VERIFICAR LÍMITE
    ========================= */

    if ($cantidad_actual >= $stock) {

        echo json_encode([
            "exito" => false,
            "mensaje" => "Ya tienes todas las unidades disponibles en el carrito",
            "cantidad" => $cantidad_actual,
            "stock" => $stock,
            "disponible" => 0
        ]);

        exit;
    }


    /* =========================
       AUMENTAR
    ========================= */

    $nueva_cantidad = $cantidad_actual + 1;


    $sql = "UPDATE carrito
            SET cantidad = ?
            WHERE id = ?
            AND usuario_id = ?";

    $stmt = mysqli_prepare($conexion, $sql);

    if (!$stmt) {

        echo json_encode([
            "exito" => false,
            "mensaje" => "Error al actualizar carrito: " . mysqli_error($conexion)
        ]);

        exit;
    }

    mysqli_stmt_bind_param(
        $stmt,
        "iii",
        $nueva_cantidad,
        $carrito_id,
        $usuario_id
    );

    if (!mysqli_stmt_execute($stmt)) {

        echo json_encode([
            "exito" => false,
            "mensaje" => "Error al actualizar carrito: " . mysqli_stmt_error($stmt)
        ]);

        exit;
    }

}


/* =========================
   PRODUCTO NUEVO
========================= */

else {

    $nueva_cantidad = 1;


    $sql = "INSERT INTO carrito
            (
                usuario_id,
                producto_id,
                cantidad
            )
            VALUES
            (
                ?,
                ?,
                ?
            )";

    $stmt = mysqli_prepare($conexion, $sql);

    if (!$stmt) {

        echo json_encode([
            "exito" => false,
            "mensaje" => "Error al preparar inserción: " . mysqli_error($conexion)
        ]);

        exit;
    }

    mysqli_stmt_bind_param(
        $stmt,
        "iii",
        $usuario_id,
        $producto_id,
        $nueva_cantidad
    );

    if (!mysqli_stmt_execute($stmt)) {

        echo json_encode([
            "exito" => false,
            "mensaje" => "Error al agregar al carrito: " . mysqli_stmt_error($stmt)
        ]);

        exit;
    }

    $carrito_id = mysqli_insert_id($conexion);
}


/* =========================
   DISPONIBLE
========================= */

$disponible = $stock - $nueva_cantidad;


/* =========================
   TOTAL
========================= */

$sql_total = "SELECT
                COALESCE(
                    SUM(
                        carrito.cantidad *
                        productos.precio
                    ),
                    0
                ) AS total
              FROM carrito
              INNER JOIN productos
              ON carrito.producto_id = productos.id
              WHERE carrito.usuario_id = ?";

$stmt = mysqli_prepare($conexion, $sql_total);

if (!$stmt) {

    echo json_encode([
        "exito" => false,
        "mensaje" => "Error calculando total: " . mysqli_error($conexion)
    ]);

    exit;
}

mysqli_stmt_bind_param(
    $stmt,
    "i",
    $usuario_id
);

mysqli_stmt_execute($stmt);

$resultado_total = mysqli_stmt_get_result($stmt);

$fila_total = $resultado_total->fetch_assoc();

$total = floatval($fila_total['total'] ?? 0);


/* =========================
   RESPUESTA
========================= */

echo json_encode([

    "exito" => true,

    "mensaje" => "Producto agregado al carrito",

    "carrito_id" => $carrito_id,

    "producto_id" => $producto_id,

    "cantidad" => $nueva_cantidad,

    "stock" => $stock,

    "disponible" => $disponible,

    "total" => $total

]);

exit;

?>