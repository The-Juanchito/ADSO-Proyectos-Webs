```php
<?php

session_start();

require_once "../php/conexion.php";


/* =====================================================
   VERIFICAR SESIÓN
===================================================== */

if (!isset($_SESSION['usuario_id'])) {

    header("Location: /maxistore/usuario/iniciar_sesion.php");
    exit;

}


/* =====================================================
   VERIFICAR ROL ADMINISTRADOR
===================================================== */

if (
    !isset($_SESSION['usuario_rol']) ||
    $_SESSION['usuario_rol'] !== 'admin'
) {

    header("Location: /maxistore/index.php");
    exit;

}


/* =====================================================
   DATOS DEL ADMINISTRADOR
===================================================== */

$admin_nombre =
    $_SESSION['usuario_nombre'] ?? 'Administrador';

$admin_apellido =
    $_SESSION['usuario_apellido'] ?? '';


/* =====================================================
   TOTAL DE PEDIDOS
===================================================== */

$total_pedidos = 0;

$sql = "
    SELECT COUNT(*) AS total
    FROM pedidos
";

$resultado = mysqli_query($conexion, $sql);

if ($resultado) {

    $datos = mysqli_fetch_assoc($resultado);

    $total_pedidos =
        intval($datos['total'] ?? 0);

}


/* =====================================================
   PEDIDOS PAGADOS
===================================================== */

$pedidos_pagados = 0;

$sql = "
    SELECT COUNT(*) AS total
    FROM pagos
    WHERE estado = 'completado'
";

$resultado = mysqli_query($conexion, $sql);

if ($resultado) {

    $datos = mysqli_fetch_assoc($resultado);

    $pedidos_pagados =
        intval($datos['total'] ?? 0);

}


/* =====================================================
   PEDIDOS PENDIENTES
===================================================== */

$pedidos_pendientes = 0;

$sql = "
    SELECT COUNT(*) AS total
    FROM pedidos
    WHERE estado = 'pendiente'
";

$resultado = mysqli_query($conexion, $sql);

if ($resultado) {

    $datos = mysqli_fetch_assoc($resultado);

    $pedidos_pendientes =
        intval($datos['total'] ?? 0);

}


/* =====================================================
   PEDIDOS CANCELADOS
===================================================== */

$pedidos_cancelados = 0;

$sql = "
    SELECT COUNT(*) AS total
    FROM pedidos
    WHERE estado = 'cancelado'
";

$resultado = mysqli_query($conexion, $sql);

if ($resultado) {

    $datos = mysqli_fetch_assoc($resultado);

    $pedidos_cancelados =
        intval($datos['total'] ?? 0);

}


/* =====================================================
   TOTAL DE CLIENTES
===================================================== */

$total_clientes = 0;

$sql = "
    SELECT COUNT(*) AS total
    FROM usuarios
    WHERE rol = 'cliente'
";

$resultado = mysqli_query($conexion, $sql);

if ($resultado) {

    $datos = mysqli_fetch_assoc($resultado);

    $total_clientes =
        intval($datos['total'] ?? 0);

}


/* =====================================================
   TOTAL DE PRODUCTOS
===================================================== */

$total_productos = 0;

$sql = "
    SELECT COUNT(*) AS total
    FROM productos
    WHERE estado = 1
";

$resultado = mysqli_query($conexion, $sql);

if ($resultado) {

    $datos = mysqli_fetch_assoc($resultado);

    $total_productos =
        intval($datos['total'] ?? 0);

}


/* =====================================================
   PRODUCTOS BAJO STOCK
===================================================== */

$productos_bajo_stock = 0;

$sql = "
    SELECT COUNT(*) AS total
    FROM productos
    WHERE estado = 1
    AND stock <= 5
";

$resultado = mysqli_query($conexion, $sql);

if ($resultado) {

    $datos = mysqli_fetch_assoc($resultado);

    $productos_bajo_stock =
        intval($datos['total'] ?? 0);

}


/* =====================================================
   VENTAS TOTALES
===================================================== */

$ventas_totales = 0;

$sql = "
    SELECT COALESCE(SUM(monto), 0) AS total
    FROM pagos
    WHERE estado = 'completado'
";

$resultado = mysqli_query($conexion, $sql);

if ($resultado) {

    $datos = mysqli_fetch_assoc($resultado);

    $ventas_totales =
        floatval($datos['total'] ?? 0);

}


/* =====================================================
   ÚLTIMOS PEDIDOS
===================================================== */

$ultimos_pedidos = [];

$sql = "
    SELECT
        pedidos.id,
        pedidos.total,
        pedidos.estado,
        pedidos.fecha_pedido,

        usuarios.nombre,
        usuarios.apellido

    FROM pedidos

    INNER JOIN usuarios
        ON pedidos.usuario_id = usuarios.id

    ORDER BY pedidos.id DESC

    LIMIT 5
";

$resultado = mysqli_query($conexion, $sql);

if ($resultado) {

    while ($pedido = mysqli_fetch_assoc($resultado)) {

        $ultimos_pedidos[] = $pedido;

    }

}


/* =====================================================
   PRODUCTOS MÁS VENDIDOS
===================================================== */

$productos_vendidos = [];

$sql = "
    SELECT
        productos.nombre,
        SUM(detalle_pedido.cantidad) AS cantidad

    FROM detalle_pedido

    INNER JOIN productos
        ON detalle_pedido.producto_id = productos.id

    INNER JOIN pedidos
        ON detalle_pedido.pedido_id = pedidos.id

    INNER JOIN pagos
        ON pagos.pedido_id = pedidos.id

    WHERE pagos.estado = 'completado'

    GROUP BY
        detalle_pedido.producto_id,
        productos.nombre

    ORDER BY cantidad DESC

    LIMIT 5
";

$resultado = mysqli_query($conexion, $sql);

if ($resultado) {

    while ($producto = mysqli_fetch_assoc($resultado)) {

        $productos_vendidos[] = $producto;

    }

}

?>

<!DOCTYPE html>

<html lang="es">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <meta
        name="description"
        content="Panel de administración de MaxiStore"
    >

    <title>Dashboard | MaxiStore</title>


    <!-- =================================================
         CSS ADMINISTRACIÓN
    ================================================== -->

    <link
        rel="stylesheet"
        href="/maxistore/css/admin.css"
    >


    <!-- =================================================
         ICONOS
    ================================================== -->

    <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css"
    >

</head>


<body>


<div class="admin-contenedor">


    <!-- =================================================
         BOTÓN MENÚ MÓVIL
    ================================================== -->

    <button
        type="button"
        class="admin-menu-btn"
        id="adminMenuToggle"
        aria-label="Abrir menú"
        aria-controls="adminSidebar"
        aria-expanded="false"
    >

        <i class="bi bi-list"></i>

    </button>


    <!-- =================================================
         OVERLAY
    ================================================== -->

    <div
        class="admin-overlay"
        id="adminOverlay"
    ></div>


    <!-- =================================================
         SIDEBAR
    ================================================== -->

    <aside
        class="admin-sidebar"
        id="adminSidebar"
    >


        <!-- BOTÓN CERRAR -->

        <button
            type="button"
            class="admin-menu-cerrar"
            id="adminMenuCerrar"
            aria-label="Cerrar menú"
        >

            <i class="bi bi-x-lg"></i>

        </button>


        <!-- =================================================
             LOGO
        ================================================== -->

        <div class="admin-logo">

            <img
                src="/maxistore/imagenes/Logo.jpeg"
                alt="MaxiStore"
            >

        </div>


        <!-- =================================================
             DASHBOARD
        ================================================== -->

        <div class="admin-dashboard">

            <a
                href="/maxistore/admin/index1.php"
                class="admin-dashboard-btn admin-menu-activo"
            >

                <i class="bi bi-speedometer2"></i>

                <span>
                    Dashboard
                </span>

            </a>

        </div>


        <!-- =================================================
             MENÚ
        ================================================== -->

        <nav class="admin-menu">

            <div class="admin-menu-titulo">
                ADMINISTRACIÓN
            </div>


            <!-- PEDIDOS -->

            <a
                href="/maxistore/admin/pedidos.php"
                class="admin-menu-enlace"
            >

                <i class="bi bi-box-seam"></i>

                <span>
                    Pedidos
                </span>

            </a>

            <a
                href="/maxistore/admin/usuarios.php"
                class="admin-menu-enlace"
            >

                <i class="bi bi-people"></i>

                <span>
                    Usuarios
                </span>

            </a>


        </nav>


        <!-- =================================================
             PARTE INFERIOR
        ================================================== -->

        <div class="admin-sidebar-abajo">


            <!-- TIENDA -->

            <a
                href="/maxistore/index.php"
            >

                <i class="bi bi-house"></i>

                <span>
                    Ver tienda
                </span>

            </a>


            <!-- CERRAR SESIÓN -->

            <a
                href="/maxistore/php/cerrar_sesion.php"
            >

                <i class="bi bi-box-arrow-right"></i>

                <span>
                    Cerrar sesión
                </span>

            </a>


        </div>


    </aside>


    <!-- =================================================
         CONTENIDO
    ================================================== -->

    <main class="admin-main">


        <!-- =================================================
             HEADER
        ================================================== -->

        <header class="admin-header">

            <div class="admin-header-titulo">

                <span class="admin-pequeno">
                    PANEL DE CONTROL
                </span>

                <h1>
                    Dashboard
                </h1>

            </div>


            <!-- ADMINISTRADOR -->

            <div class="admin-usuario">

                <i class="bi bi-person-circle"></i>

                <div>

                    <strong>

                        <?php

                        echo htmlspecialchars(
                            trim(
                                $admin_nombre .
                                ' ' .
                                $admin_apellido
                            )
                        );

                        ?>

                    </strong>

                    <span>
                        Administrador
                    </span>

                </div>

            </div>

        </header>


        <!-- =================================================
             ESTADÍSTICAS PRINCIPALES
        ================================================== -->

        <section class="admin-estadisticas">


            <!-- PEDIDOS -->

            <div class="estadistica-card">

                <div class="estadistica-icono">

                    <i class="bi bi-box-seam"></i>

                </div>

                <div>

                    <span>
                        Total pedidos
                    </span>

                    <strong>
                        <?php echo $total_pedidos; ?>
                    </strong>

                </div>

            </div>


            <!-- PAGADOS -->

            <div class="estadistica-card">

                <div class="estadistica-icono">

                    <i class="bi bi-check-circle"></i>

                </div>

                <div>

                    <span>
                        Pedidos pagados
                    </span>

                    <strong>
                        <?php echo $pedidos_pagados; ?>
                    </strong>

                </div>

            </div>


            <!-- PENDIENTES -->

            <div class="estadistica-card">

                <div class="estadistica-icono">

                    <i class="bi bi-clock"></i>

                </div>

                <div>

                    <span>
                        Pendientes
                    </span>

                    <strong>
                        <?php echo $pedidos_pendientes; ?>
                    </strong>

                </div>

            </div>


            <!-- VENTAS -->

            <div class="estadistica-card">

                <div class="estadistica-icono">

                    <i class="bi bi-cash-stack"></i>

                </div>

                <div>

                    <span>
                        Ventas
                    </span>

                    <strong>

                        $

                        <?php

                        echo number_format(
                            $ventas_totales,
                            0,
                            ',',
                            '.'
                        );

                        ?>

                    </strong>

                </div>

            </div>


        </section>


        <!-- =================================================
             ESTADÍSTICAS SECUNDARIAS
        ================================================== -->

        <section
            class="admin-estadisticas admin-estadisticas-secundarias"
        >


            <!-- CLIENTES -->

            <div class="estadistica-card">

                <div class="estadistica-icono">

                    <i class="bi bi-people"></i>

                </div>

                <div>

                    <span>
                        Clientes
                    </span>

                    <strong>
                        <?php echo $total_clientes; ?>
                    </strong>

                </div>

            </div>


            <!-- PRODUCTOS -->

            <div class="estadistica-card">

                <div class="estadistica-icono">

                    <i class="bi bi-bag"></i>

                </div>

                <div>

                    <span>
                        Productos
                    </span>

                    <strong>
                        <?php echo $total_productos; ?>
                    </strong>

                </div>

            </div>


            <!-- BAJO STOCK -->

            <div class="estadistica-card">

                <div class="estadistica-icono">

                    <i class="bi bi-exclamation-triangle"></i>

                </div>

                <div>

                    <span>
                        Bajo stock
                    </span>

                    <strong>
                        <?php echo $productos_bajo_stock; ?>
                    </strong>

                </div>

            </div>


            <!-- CANCELADOS -->

            <div class="estadistica-card">

                <div class="estadistica-icono">

                    <i class="bi bi-x-circle"></i>

                </div>

                <div>

                    <span>
                        Cancelados
                    </span>

                    <strong>
                        <?php echo $pedidos_cancelados; ?>
                    </strong>

                </div>

            </div>


        </section>


        <!-- =================================================
             GRID
        ================================================== -->

        <section class="admin-grid">


            <!-- =================================================
                 ÚLTIMOS PEDIDOS
            ================================================== -->

            <div class="admin-panel">

                <div class="admin-panel-header">

                    <div>

                        <span>
                            ACTIVIDAD
                        </span>

                        <h2>
                            Últimos pedidos
                        </h2>

                    </div>

                    <a
                        href="/maxistore/admin/pedidos.php"
                    >

                        Ver todos

                        <i class="bi bi-arrow-right"></i>

                    </a>

                </div>


                <div class="tabla-contenedor">

                    <table>

                        <thead>

                            <tr>

                                <th>
                                    Pedido
                                </th>

                                <th>
                                    Cliente
                                </th>

                                <th>
                                    Total
                                </th>

                                <th>
                                    Estado
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                        <?php if (
                            count($ultimos_pedidos) > 0
                        ): ?>


                            <?php foreach (
                                $ultimos_pedidos
                                as $pedido
                            ): ?>

                                <tr>

                                    <td>

                                        <strong>

                                            #

                                            <?php
                                            echo intval(
                                                $pedido['id']
                                            );
                                            ?>

                                        </strong>

                                    </td>


                                    <td>

                                        <?php

                                        echo htmlspecialchars(
                                            $pedido['nombre'] .
                                            ' ' .
                                            $pedido['apellido']
                                        );

                                        ?>

                                    </td>


                                    <td>

                                        $

                                        <?php

                                        echo number_format(
                                            floatval(
                                                $pedido['total']
                                            ),
                                            0,
                                            ',',
                                            '.'
                                        );

                                        ?>

                                    </td>


                                    <td>

                                        <?php

                                        $estado =
                                            strtolower(
                                                trim(
                                                    $pedido['estado']
                                                )
                                            );

                                        ?>

                                        <span
                                            class="estado estado-<?php
                                                echo htmlspecialchars(
                                                    $estado
                                                );
                                            ?>"
                                        >

                                            <?php

                                            echo htmlspecialchars(
                                                ucfirst(
                                                    $estado
                                                )
                                            );

                                            ?>

                                        </span>

                                    </td>

                                </tr>

                            <?php endforeach; ?>


                        <?php else: ?>

                            <tr>

                                <td
                                    colspan="4"
                                    class="tabla-vacia"
                                >

                                    No hay pedidos todavía.

                                </td>

                            </tr>

                        <?php endif; ?>

                        </tbody>

                    </table>

                </div>

            </div>


            <!-- =================================================
                 PRODUCTOS MÁS VENDIDOS
            ================================================== -->

            <div class="admin-panel">

                <div class="admin-panel-header">

                    <div>

                        <span>
                            PRODUCTOS
                        </span>

                        <h2>
                            Más vendidos
                        </h2>

                    </div>

                </div>


                <div class="productos-vendidos">


                <?php if (
                    count($productos_vendidos) > 0
                ): ?>


                    <?php

                    $posicion = 1;

                    foreach (
                        $productos_vendidos
                        as $producto
                    ):

                    ?>

                        <div class="producto-vendido">

                            <span
                                class="producto-posicion"
                            >

                                <?php
                                echo $posicion;
                                ?>

                            </span>


                            <div
                                class="producto-vendido-info"
                            >

                                <strong>

                                    <?php

                                    echo htmlspecialchars(
                                        $producto['nombre']
                                    );

                                    ?>

                                </strong>

                                <span>

                                    <?php

                                    echo intval(
                                        $producto['cantidad']
                                    );

                                    ?>

                                    vendidos

                                </span>

                            </div>

                        </div>


                    <?php

                    $posicion++;

                    endforeach;

                    ?>


                <?php else: ?>


                    <div class="sin-datos">

                        <i class="bi bi-bar-chart"></i>

                        <p>
                            Todavía no hay ventas registradas.
                        </p>

                    </div>


                <?php endif; ?>

                </div>

            </div>


        </section>


        <!-- =================================================
             ACCIONES RÁPIDAS
        ================================================== -->

        <section class="acciones-rapidas">

            <h2>
                Acciones rápidas
            </h2>


            <div>


                <a
                    href="/maxistore/admin/pedidos.php"
                >

                    <i class="bi bi-box-seam"></i>

                    <span>
                        Gestionar pedidos
                    </span>

                </a>


            </div>

        </section>


    </main>

</div>


<!-- =====================================================
     JAVASCRIPT
===================================================== -->

<script src="/maxistore/js/script.js"></script>

</body>

</html>
```
