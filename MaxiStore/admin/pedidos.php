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
   DATOS ADMINISTRADOR
===================================================== */

$admin_nombre =
    $_SESSION['usuario_nombre'] ?? 'Administrador';

$admin_apellido =
    $_SESSION['usuario_apellido'] ?? '';


/* =====================================================
   BÚSQUEDA
===================================================== */

$busqueda = '';

if (isset($_GET['buscar'])) {

    $busqueda =
        trim($_GET['buscar']);

}


/* =====================================================
   FILTRO ESTADO
===================================================== */

$filtro_estado = '';

if (isset($_GET['estado'])) {

    $filtro_estado =
        trim($_GET['estado']);

}


/* =====================================================
   ESTADOS PERMITIDOS
===================================================== */

$estados_validos = [

    'pendiente',
    'completado',
    'cancelado'

];


/* =====================================================
   CONSULTA
===================================================== */

$pedidos = [];


$sql = "

    SELECT

        pedidos.id,
        pedidos.total,
        pedidos.estado,
        pedidos.fecha_pedido,

        usuarios.nombre,
        usuarios.apellido,
        usuarios.email

    FROM pedidos

    INNER JOIN usuarios
        ON pedidos.usuario_id = usuarios.id

    WHERE 1 = 1

";


/* =====================================================
   BÚSQUEDA
===================================================== */

if ($busqueda !== '') {

    $busqueda_segura =
        mysqli_real_escape_string(
            $conexion,
            $busqueda
        );


    $sql .= "

        AND (

            pedidos.id LIKE '%$busqueda_segura%'

            OR usuarios.nombre
            LIKE '%$busqueda_segura%'

            OR usuarios.apellido
            LIKE '%$busqueda_segura%'

            OR usuarios.email
            LIKE '%$busqueda_segura%'

        )

    ";

}


/* =====================================================
   FILTRO ESTADO
===================================================== */

if (
    $filtro_estado !== '' &&
    in_array(
        $filtro_estado,
        $estados_validos,
        true
    )
) {

    $estado_seguro =
        mysqli_real_escape_string(
            $conexion,
            $filtro_estado
        );


    $sql .= "

        AND pedidos.estado =
        '$estado_seguro'

    ";

}


/* =====================================================
   ORDEN
===================================================== */

$sql .= "

    ORDER BY pedidos.id DESC

";


/* =====================================================
   EJECUTAR
===================================================== */

$resultado =
    mysqli_query(
        $conexion,
        $sql
    );


/* =====================================================
   GUARDAR PEDIDOS
===================================================== */

if ($resultado) {

    while (
        $pedido =
        mysqli_fetch_assoc($resultado)
    ) {

        $pedidos[] =
            $pedido;

    }

}


/* =====================================================
   FUNCIÓN ESTADO
===================================================== */

function nombreEstado($estado)
{

    switch ($estado) {

        case 'pendiente':
            return 'Pendiente';

        case 'completado':
            return 'Completado';

        case 'cancelado':
            return 'Cancelado';

        default:
            return ucfirst($estado);

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
        content="Administración de pedidos de MaxiStore"
    >

    <title>
        Pedidos | MaxiStore
    </title>


    <!-- =================================================
         CSS ADMIN
    ================================================== -->

    <link
        rel="stylesheet"
        href="/maxistore/css/admin.css"
    >


    <!-- =================================================
         CSS PEDIDOS
    ================================================== -->

    <link
        rel="stylesheet"
        href="/maxistore/css/pedidos.css"
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
         BOTÓN MENÚ
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


        <!-- CERRAR -->

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
                class="admin-dashboard-btn"
            >

                <i class="bi bi-speedometer2"></i>

                <span>
                    Dashboard
                </span>

            </a>

        </div>


        <!-- =================================================
             MENÚ ADMINISTRACIÓN
        ================================================== -->

        <nav class="admin-menu">


            <div class="admin-menu-titulo">
                ADMINISTRACIÓN
            </div>


            <!-- PEDIDOS -->

            <a
                href="/maxistore/admin/pedidos.php"
                class="admin-menu-enlace admin-menu-activo"
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
                    ADMINISTRACIÓN
                </span>

                <h1>
                    Pedidos
                </h1>

            </div>


            <!-- ADMIN -->

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
             PANEL
        ================================================== -->

        <section
            class="admin-panel pedidos-panel"
        >


            <!-- =================================================
                 CABECERA
            ================================================== -->

            <div
                class="admin-panel-header pedidos-header"
            >

                <div>

                    <span>
                        GESTIÓN
                    </span>

                    <h2>
                        Todos los pedidos
                    </h2>

                </div>


                <div class="pedidos-total">

                    <i class="bi bi-box-seam"></i>

                    <span>

                        <?php
                        echo count($pedidos);
                        ?>

                        pedidos

                    </span>

                </div>

            </div>


            <!-- =================================================
                 FILTROS
            ================================================== -->

            <div class="pedidos-filtros">


                <!-- BÚSQUEDA -->

                <form
                    method="GET"
                    action="/maxistore/admin/pedidos.php"
                    class="pedidos-busqueda"
                >

                    <div class="campo-busqueda">

                        <i class="bi bi-search"></i>

                        <input
                            type="text"
                            name="buscar"
                            placeholder="Buscar pedido, cliente o correo..."
                            value="<?php

                                echo htmlspecialchars(
                                    $busqueda
                                );

                            ?>"
                        >

                    </div>


                    <button
                        type="submit"
                        class="btn-buscar"
                    >

                        <i class="bi bi-search"></i>

                        Buscar

                    </button>

                </form>


                <!-- ESTADO -->

                <form
                    method="GET"
                    action="/maxistore/admin/pedidos.php"
                    class="pedidos-filtro-estado"
                >


                    <?php if (
                        $busqueda !== ''
                    ): ?>

                        <input
                            type="hidden"
                            name="buscar"
                            value="<?php

                                echo htmlspecialchars(
                                    $busqueda
                                );

                            ?>"
                        >

                    <?php endif; ?>


                    <select
                        name="estado"
                        onchange="this.form.submit()"
                        aria-label="Filtrar por estado"
                    >

                        <option value="">
                            Todos los estados
                        </option>


                        <option
                            value="pendiente"
                            <?php

                            echo (
                                $filtro_estado ===
                                'pendiente'
                            )
                            ? 'selected'
                            : '';

                            ?>
                        >

                            Pendientes

                        </option>


                        <option
                            value="completado"
                            <?php

                            echo (
                                $filtro_estado ===
                                'completado'
                            )
                            ? 'selected'
                            : '';

                            ?>
                        >

                            Completados

                        </option>


                        <option
                            value="cancelado"
                            <?php

                            echo (
                                $filtro_estado ===
                                'cancelado'
                            )
                            ? 'selected'
                            : '';

                            ?>
                        >

                            Cancelados

                        </option>

                    </select>

                </form>


            </div>


            <!-- =================================================
                 INFORMACIÓN FILTROS
            ================================================== -->

            <?php if (
                $busqueda !== '' ||
                $filtro_estado !== ''
            ): ?>

                <div class="pedidos-filtro-info">

                    <i class="bi bi-funnel"></i>

                    <span>
                        Mostrando resultados filtrados
                    </span>


                    <a
                        href="/maxistore/admin/pedidos.php"
                    >

                        Limpiar filtros

                        <i class="bi bi-x-circle"></i>

                    </a>

                </div>

            <?php endif; ?>


            <!-- =================================================
                 TABLA
            ================================================== -->

            <div
                class="tabla-contenedor pedidos-tabla"
            >

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
                                Fecha
                            </th>

                            <th>
                                Total
                            </th>

                            <th>
                                Estado
                            </th>

                            <th>
                                Acción
                            </th>

                        </tr>

                    </thead>


                    <tbody>


                    <?php if (
                        count($pedidos) > 0
                    ): ?>


                        <?php foreach (
                            $pedidos
                            as $pedido
                        ): ?>


                            <tr>


                                <!-- PEDIDO -->

                                <td>

                                    <strong
                                        class="pedido-numero"
                                    >

                                        #

                                        <?php

                                        echo intval(
                                            $pedido['id']
                                        );

                                        ?>

                                    </strong>

                                </td>


                                <!-- CLIENTE -->

                                <td>

                                    <div
                                        class="cliente-pedido"
                                    >

                                        <strong>

                                            <?php

                                            echo htmlspecialchars(
                                                $pedido['nombre'] .
                                                ' ' .
                                                $pedido['apellido']
                                            );

                                            ?>

                                        </strong>

                                        <span>

                                            <?php

                                            echo htmlspecialchars(
                                                $pedido['email']
                                            );

                                            ?>

                                        </span>

                                    </div>

                                </td>


                                <!-- FECHA -->

                                <td>

                                    <span
                                        class="pedido-fecha"
                                    >

                                        <i
                                            class="bi bi-calendar3"
                                        ></i>

                                        <?php

                                        if (
                                            !empty(
                                                $pedido[
                                                    'fecha_pedido'
                                                ]
                                            )
                                        ) {

                                            echo date(
                                                'd/m/Y H:i',
                                                strtotime(
                                                    $pedido[
                                                        'fecha_pedido'
                                                    ]
                                                )
                                            );

                                        } else {

                                            echo 'Sin fecha';

                                        }

                                        ?>

                                    </span>

                                </td>


                                <!-- TOTAL -->

                                <td>

                                    <strong
                                        class="pedido-total"
                                    >

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

                                    </strong>

                                </td>


                                <!-- ESTADO -->

                                <td>

                                    <?php

                                    $estado_actual =
                                        strtolower(
                                            trim(
                                                $pedido['estado']
                                            )
                                        );

                                    ?>


                                    <span
                                        class="estado estado-<?php

                                            echo htmlspecialchars(
                                                $estado_actual
                                            );

                                        ?>"
                                    >

                                        <?php

                                        echo htmlspecialchars(
                                            nombreEstado(
                                                $estado_actual
                                            )
                                        );

                                        ?>

                                    </span>

                                </td>


                                <!-- ACCIÓN -->

                                <td>

                                    <a
                                        href="/maxistore/usuario/detalle_pedido.php?id=<?php echo intval($pedido['id']); ?>"
                                        class="pedido-ver"
                                    >

                                        <i
                                            class="bi bi-eye"
                                        ></i>

                                        <span>
                                            Ver
                                        </span>

                                    </a>

                                </td>


                            </tr>


                        <?php endforeach; ?>


                    <?php else: ?>


                        <tr>

                            <td
                                colspan="6"
                                class="tabla-vacia"
                            >

                                <div
                                    class="pedidos-sin-resultados"
                                >

                                    <i
                                        class="bi bi-box-seam"
                                    ></i>


                                    <strong>
                                        No se encontraron pedidos
                                    </strong>


                                    <span>

                                        <?php

                                        if (
                                            $busqueda !== '' ||
                                            $filtro_estado !== ''
                                        ) {

                                            echo 'Prueba cambiando los filtros de búsqueda.';

                                        } else {

                                            echo 'Todavía no hay pedidos registrados.';

                                        }

                                        ?>

                                    </span>


                                    <?php if (
                                        $busqueda !== '' ||
                                        $filtro_estado !== ''
                                    ): ?>


                                        <a
                                            href="/maxistore/admin/pedidos.php"
                                            class="btn-limpiar-filtros"
                                        >

                                            <i
                                                class="bi bi-arrow-counterclockwise"
                                            ></i>

                                            Limpiar filtros

                                        </a>


                                    <?php endif; ?>


                                </div>

                            </td>

                        </tr>


                    <?php endif; ?>


                    </tbody>

                </table>

            </div>


        </section>


    </main>


</div>


<!-- =====================================================
     JAVASCRIPT GENERAL
===================================================== -->

<script src="/maxistore/js/script.js"></script>


</body>

</html>
```
