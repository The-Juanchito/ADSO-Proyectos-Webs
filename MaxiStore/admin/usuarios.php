<?php

session_start();

require_once __DIR__ . "/../php/conexion.php";

if (!isset($_SESSION['usuario_id'])) {
    header("Location: /maxistore/usuario/iniciar_sesion.php");
    exit;
}

if (($_SESSION['usuario_rol'] ?? '') !== 'admin') {
    header("Location: /maxistore/index.php");
    exit;
}

if (empty($_SESSION['csrf_usuarios'])) {
    $_SESSION['csrf_usuarios'] = bin2hex(random_bytes(32));
}

$mensaje = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $csrf = $_POST['csrf'] ?? '';
    $usuarioId = filter_input(INPUT_POST, 'usuario_id', FILTER_VALIDATE_INT);
    $rol = $_POST['rol'] ?? '';

    if (
        !is_string($csrf) ||
        !hash_equals($_SESSION['csrf_usuarios'], $csrf)
    ) {
        http_response_code(400);
        exit('La solicitud expiró o no es válida. Recarga la página e inténtalo de nuevo.');
    }

    if (!$usuarioId || !in_array($rol, ['cliente', 'admin'], true)) {
        http_response_code(400);
        exit('El usuario o el rol seleccionado no es válido.');
    }

    if ($usuarioId === (int)$_SESSION['usuario_id']) {
        http_response_code(400);
        exit('No puedes cambiar tu propio rol.');
    }

    $stmt = mysqli_prepare($conexion, "SELECT id FROM usuarios WHERE id = ? LIMIT 1");
    if (!$stmt) {
        error_log("Error preparando búsqueda de usuario: " . mysqli_error($conexion));
        http_response_code(500);
        exit('No fue posible actualizar el usuario.');
    }

    mysqli_stmt_bind_param($stmt, "i", $usuarioId);
    if (!mysqli_stmt_execute($stmt)) {
        error_log("Error buscando usuario: " . mysqli_stmt_error($stmt));
        mysqli_stmt_close($stmt);
        http_response_code(500);
        exit('No fue posible actualizar el usuario.');
    }

    $resultado = mysqli_stmt_get_result($stmt);
    $existe = $resultado && mysqli_num_rows($resultado) === 1;
    mysqli_stmt_close($stmt);

    if (!$existe) {
        http_response_code(404);
        exit('No se encontró el usuario seleccionado.');
    }

    $stmt = mysqli_prepare($conexion, "UPDATE usuarios SET rol = ? WHERE id = ?");
    if (!$stmt) {
        error_log("Error preparando actualización de rol: " . mysqli_error($conexion));
        http_response_code(500);
        exit('No fue posible actualizar el usuario.');
    }

    mysqli_stmt_bind_param($stmt, "si", $rol, $usuarioId);
    if (!mysqli_stmt_execute($stmt)) {
        error_log("Error actualizando rol de usuario: " . mysqli_stmt_error($stmt));
        mysqli_stmt_close($stmt);
        http_response_code(500);
        exit('No fue posible actualizar el usuario.');
    }

    mysqli_stmt_close($stmt);
    $_SESSION['mensaje_usuarios'] = 'El rol del usuario se actualizó correctamente.';
    header("Location: /maxistore/admin/usuarios.php");
    exit;
}

if (isset($_SESSION['mensaje_usuarios'])) {
    $mensaje = $_SESSION['mensaje_usuarios'];
    unset($_SESSION['mensaje_usuarios']);
}

$sql = "
    SELECT id, nombre, apellido, correo, telefono, rol, estado, fecha_registro
    FROM usuarios
    ORDER BY fecha_registro DESC, id DESC
";

$resultado = mysqli_query($conexion, $sql);
if (!$resultado) {
    error_log("Error cargando usuarios para administración: " . mysqli_error($conexion));
    http_response_code(500);
    exit('No fue posible cargar los usuarios.');
}

$escapar = static function ($valor): string {
    return htmlspecialchars(
        (string)($valor ?? ''),
        ENT_QUOTES | ENT_SUBSTITUTE,
        'UTF-8'
    );
};

$usuarios = mysqli_fetch_all($resultado, MYSQLI_ASSOC);
mysqli_free_result($resultado);

$nombreAdmin = trim(
    ($_SESSION['usuario_nombre'] ?? '') . ' ' .
    ($_SESSION['usuario_apellido'] ?? '')
);

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <title>Usuarios | MaxiStore</title>
    <link rel="stylesheet" href="/maxistore/css/admin.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css">
</head>
<body>
<div class="admin-contenedor">
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

    <div class="admin-overlay" id="adminOverlay"></div>

    <aside class="admin-sidebar" id="adminSidebar">
        <button
            type="button"
            class="admin-menu-cerrar"
            id="adminMenuCerrar"
            aria-label="Cerrar menú"
        >
            <i class="bi bi-x-lg"></i>
        </button>

        <div class="admin-logo">
            <img src="/maxistore/imagenes/Logo.jpeg" alt="MaxiStore">
        </div>

        <div class="admin-dashboard">
            <a href="/maxistore/admin/index1.php" class="admin-dashboard-btn">
                <i class="bi bi-speedometer2"></i>
                <span>Dashboard</span>
            </a>
        </div>

        <nav class="admin-menu">
            <div class="admin-menu-titulo">ADMINISTRACIÓN</div>
            <a href="/maxistore/admin/pedidos.php" class="admin-menu-enlace">
                <i class="bi bi-box-seam"></i>
                <span>Pedidos</span>
            </a>
            <a href="/maxistore/admin/usuarios.php" class="admin-menu-enlace admin-menu-activo" aria-current="page">
                <i class="bi bi-people"></i>
                <span>Usuarios</span>
            </a>
        </nav>

        <div class="admin-sidebar-abajo">
            <a href="/maxistore/index.php">
                <i class="bi bi-house"></i>
                <span>Ver tienda</span>
            </a>
            <a href="/maxistore/php/cerrar_sesion.php">
                <i class="bi bi-box-arrow-right"></i>
                <span>Cerrar sesión</span>
            </a>
        </div>
    </aside>

    <main class="admin-main">
        <header class="admin-header">
            <div class="admin-header-titulo">
                <span class="admin-pequeno">ADMINISTRACIÓN</span>
                <h1>Usuarios registrados</h1>
            </div>
            <div class="admin-usuario">
                <i class="bi bi-person-circle"></i>
                <span><?= $escapar($nombreAdmin !== '' ? $nombreAdmin : 'Administrador') ?></span>
            </div>
        </header>

        <p class="usuarios-nota">
            Consulta los datos de registro y administra los roles.
            Las contraseñas nunca se muestran; se almacenan cifradas y no se pueden recuperar.
            Las cuentas creadas desde el formulario público siempre comienzan como clientes.
        </p>

        <?php if ($mensaje !== ''): ?>
            <p class="usuarios-mensaje" role="status"><?= $escapar($mensaje) ?></p>
        <?php endif; ?>

        <section class="admin-panel" aria-labelledby="titulo-lista-usuarios">
            <div class="admin-panel-header">
                <div>
                    <span>REGISTROS</span>
                    <h2 id="titulo-lista-usuarios">Cuentas de usuario</h2>
                </div>
            </div>

            <div class="tabla-contenedor">
                <table>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Correo</th>
                            <th>Teléfono</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Fecha de registro</th>
                            <th>Administrar rol</th>
                        </tr>
                    </thead>
                    <tbody>
                    <?php if ($usuarios === []): ?>
                        <tr>
                            <td class="tabla-vacia" colspan="7">Todavía no hay usuarios registrados.</td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($usuarios as $usuario): ?>
                            <tr>
                                <td><?= $escapar(trim($usuario['nombre'] . ' ' . ($usuario['apellido'] ?? ''))) ?></td>
                                <td><?= $escapar($usuario['correo']) ?></td>
                                <td><?= $escapar($usuario['telefono'] ?: 'No indicado') ?></td>
                                <td><?= $usuario['rol'] === 'admin' ? 'Administrador' : 'Cliente' ?></td>
                                <td><?= $escapar(ucfirst($usuario['estado'])) ?></td>
                                <td>
                                    <?php
                                    $fecha = strtotime($usuario['fecha_registro']);
                                    echo $fecha === false
                                        ? $escapar($usuario['fecha_registro'])
                                        : $escapar(date('d/m/Y H:i', $fecha));
                                    ?>
                                </td>
                                <td>
                                    <?php if ((int)$usuario['id'] === (int)$_SESSION['usuario_id']): ?>
                                        Tu cuenta
                                    <?php else: ?>
                                        <form class="usuarios-form-rol" method="post" action="/maxistore/admin/usuarios.php">
                                            <input type="hidden" name="csrf" value="<?= $escapar($_SESSION['csrf_usuarios']) ?>">
                                            <input type="hidden" name="usuario_id" value="<?= (int)$usuario['id'] ?>">
                                            <label class="visually-hidden" for="rol-<?= (int)$usuario['id'] ?>">
                                                Rol para <?= $escapar($usuario['correo']) ?>
                                            </label>
                                            <select id="rol-<?= (int)$usuario['id'] ?>" name="rol">
                                                <option value="cliente" <?= $usuario['rol'] === 'cliente' ? 'selected' : '' ?>>Cliente</option>
                                                <option value="admin" <?= $usuario['rol'] === 'admin' ? 'selected' : '' ?>>Administrador</option>
                                            </select>
                                            <button type="submit">Guardar</button>
                                        </form>
                                    <?php endif; ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </section>
    </main>
</div>
<script src="/maxistore/js/script.js"></script>
</body>
</html>
