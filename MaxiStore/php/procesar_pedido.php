<?php

session_start();

require_once "conexion.php";


/* =====================================================
   VERIFICAR SESIÓN
===================================================== */

if (!isset($_SESSION['usuario_id'])) {

    header(
        "Location: ../usuario/iniciar_sesion.php"
    );

    exit;
}


$usuario_id =
    intval($_SESSION['usuario_id']);


/* =====================================================
   VERIFICAR MÉTODO
===================================================== */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {

    header(
        "Location: checkout.php"
    );

    exit;
}


/* =====================================================
   RECIBIR DATOS
===================================================== */

$nombre =
    trim($_POST['nombre'] ?? '');

$telefono =
    trim($_POST['telefono'] ?? '');

$correo =
    trim($_POST['correo'] ?? '');

$departamento =
    trim($_POST['departamento'] ?? '');

$ciudad =
    trim($_POST['ciudad'] ?? '');

$direccion =
    trim($_POST['direccion'] ?? '');

$indicaciones =
    trim($_POST['indicaciones'] ?? '');


/* =====================================================
   VALIDAR CAMPOS
===================================================== */

if (
    empty($nombre) ||
    empty($telefono) ||
    empty($correo) ||
    empty($departamento) ||
    empty($ciudad) ||
    empty($direccion)
) {

    die(
        "Por favor completa todos los campos obligatorios."
    );
}


/* =====================================================
   VALIDAR CORREO
===================================================== */

if (
    !filter_var(
        $correo,
        FILTER_VALIDATE_EMAIL
    )
) {

    die(
        "El correo electrónico no es válido."
    );
}


/* =====================================================
   OBTENER CARRITO
===================================================== */

$sql_carrito = "
    SELECT

        carrito.id AS carrito_id,

        carrito.producto_id,

        carrito.cantidad,

        productos.nombre,

        productos.precio,

        productos.stock

    FROM carrito

    INNER JOIN productos

        ON carrito.producto_id =
           productos.id

    WHERE carrito.usuario_id = ?
";


$stmt_carrito =
    mysqli_prepare(
        $conexion,
        $sql_carrito
    );


if (!$stmt_carrito) {

    die(
        "Error preparando carrito: " .
        mysqli_error($conexion)
    );
}


mysqli_stmt_bind_param(
    $stmt_carrito,
    "i",
    $usuario_id
);


mysqli_stmt_execute(
    $stmt_carrito
);


$resultado =
    mysqli_stmt_get_result(
        $stmt_carrito
);


/* =====================================================
   VERIFICAR CARRITO
===================================================== */

if (
    !$resultado ||
    mysqli_num_rows($resultado) === 0
) {

    header(
        "Location: carrito.php"
    );

    exit;
}


/* =====================================================
   GUARDAR PRODUCTOS Y CALCULAR TOTAL
===================================================== */

$productos = [];

$total = 0;


while (
    $producto =
    mysqli_fetch_assoc($resultado)
) {


    /* =================================================
       VERIFICAR STOCK
    ================================================= */

    if (
        intval($producto['cantidad']) >
        intval($producto['stock'])
    ) {

        die(
            "No hay suficiente stock de " .
            htmlspecialchars(
                $producto['nombre']
            ) .
            ". Stock disponible: " .
            intval($producto['stock'])
        );
    }


    $productos[] =
        $producto;


    /* =================================================
       CALCULAR SUBTOTAL
    ================================================= */

    $subtotal =
        floatval(
            $producto['precio']
        ) *
        intval(
            $producto['cantidad']
        );


    $total +=
        $subtotal;
}


mysqli_stmt_close(
    $stmt_carrito
);


/* =====================================================
   VALIDAR TOTAL
===================================================== */

if ($total <= 0) {

    die(
        "El total del pedido no es válido."
    );
}


/* =====================================================
   INICIAR TRANSACCIÓN
===================================================== */

mysqli_begin_transaction(
    $conexion
);


try {


    /* =================================================
       GUARDAR DIRECCIÓN
    ================================================= */

    $sql_direccion = "
        INSERT INTO direcciones
        (
            usuario_id,
            nombre_completo,
            telefono,
            direccion,
            ciudad,
            departamento,
            referencia,
            principal
        )
        VALUES
        (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            1
        )
    ";


    $stmt =
        mysqli_prepare(
            $conexion,
            $sql_direccion
        );


    if (!$stmt) {

        throw new Exception(
            "Error preparando dirección: " .
            mysqli_error($conexion)
        );
    }


    mysqli_stmt_bind_param(
        $stmt,
        "issssss",
        $usuario_id,
        $nombre,
        $telefono,
        $direccion,
        $ciudad,
        $departamento,
        $indicaciones
    );


    if (
        !mysqli_stmt_execute($stmt)
    ) {

        throw new Exception(
            "Error guardando dirección: " .
            mysqli_stmt_error($stmt)
        );
    }


    $direccion_id =
        mysqli_insert_id(
            $conexion
        );


    mysqli_stmt_close(
        $stmt
    );


    /* =================================================
       CREAR PEDIDO
    ================================================= */

    $sql_pedido = "
        INSERT INTO pedidos
        (
            usuario_id,
            direccion_id,
            total,
            estado
        )
        VALUES
        (
            ?,
            ?,
            ?,
            'pendiente'
        )
    ";


    $stmt =
        mysqli_prepare(
            $conexion,
            $sql_pedido
        );


    if (!$stmt) {

        throw new Exception(
            "Error preparando pedido: " .
            mysqli_error($conexion)
        );
    }


    mysqli_stmt_bind_param(
        $stmt,
        "iid",
        $usuario_id,
        $direccion_id,
        $total
    );


    if (
        !mysqli_stmt_execute($stmt)
    ) {

        throw new Exception(
            "Error creando pedido: " .
            mysqli_stmt_error($stmt)
        );
    }


    $pedido_id =
        mysqli_insert_id(
            $conexion
        );


    mysqli_stmt_close(
        $stmt
    );


    /* =================================================
       GUARDAR DETALLES
    ================================================= */

    foreach (
        $productos as $producto
    ) {


        $producto_id =
            intval(
                $producto['producto_id']
            );


        $cantidad =
            intval(
                $producto['cantidad']
            );


        $precio =
            floatval(
                $producto['precio']
            );


        $sql_detalle = "
            INSERT INTO detalle_pedido
            (
                pedido_id,
                producto_id,
                cantidad,
                precio
            )
            VALUES
            (
                ?,
                ?,
                ?,
                ?
            )
        ";


        $stmt =
            mysqli_prepare(
                $conexion,
                $sql_detalle
            );


        if (!$stmt) {

            throw new Exception(
                "Error preparando detalle: " .
                mysqli_error($conexion)
            );
        }


        mysqli_stmt_bind_param(
            $stmt,
            "iiid",
            $pedido_id,
            $producto_id,
            $cantidad,
            $precio
        );


        if (
            !mysqli_stmt_execute($stmt)
        ) {

            throw new Exception(
                "Error guardando detalle: " .
                mysqli_stmt_error($stmt)
            );
        }


        mysqli_stmt_close(
            $stmt
        );
    }


    /* =================================================
       CREAR PAGO PENDIENTE
    ================================================= */

    $sql_pago = "
        INSERT INTO pagos
        (
            pedido_id,
            metodo_pago,
            estado,
            monto,
            moneda
        )
        VALUES
        (
            ?,
            'paypal',
            'pendiente',
            ?,
            'COP'
        )
    ";


    $stmt =
        mysqli_prepare(
            $conexion,
            $sql_pago
        );


    if (!$stmt) {

        throw new Exception(
            "Error preparando pago: " .
            mysqli_error($conexion)
        );
    }


    mysqli_stmt_bind_param(
        $stmt,
        "id",
        $pedido_id,
        $total
    );


    if (
        !mysqli_stmt_execute($stmt)
    ) {

        throw new Exception(
            "Error creando pago: " .
            mysqli_stmt_error($stmt)
        );
    }


    mysqli_stmt_close(
        $stmt
    );


    /* =================================================
       CONFIRMAR TRANSACCIÓN
    ================================================= */

    mysqli_commit(
        $conexion
    );


    /* =================================================
       GUARDAR DATOS EN SESIÓN
    ================================================= */

    $_SESSION['pedido_id'] =
        $pedido_id;

    $_SESSION['pedido_total'] =
        $total;

    $_SESSION['pedido_nombre'] =
        $nombre;

    $_SESSION['pedido_telefono'] =
        $telefono;

    $_SESSION['pedido_correo'] =
        $correo;


    /* =================================================
       REDIRIGIR A PAYPAL
    ================================================= */

    header(
        "Location: paypal/pagar.php"
    );

    exit;


} catch (Exception $e) {


    /* =================================================
       DESHACER TRANSACCIÓN
    ================================================= */

    mysqli_rollback(
        $conexion
    );


    /* =================================================
       GUARDAR ERROR EN SESIÓN
    ================================================= */

    $_SESSION['error_pedido'] =
        $e->getMessage();


    /* =================================================
       IR A PÁGINA DE ERROR
    ================================================= */

    header(
        "Location: error_pedido.php"
    );

    exit;
}

?>