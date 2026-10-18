```php
<?php

session_start();

require_once "conexion.php";


/* =====================================================
   VERIFICAR MÉTODO
===================================================== */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {

    header("Location: ../usuario/iniciar_sesion.php");

    exit;
}


/* =====================================================
   RECIBIR DATOS
===================================================== */

$correo =
    trim($_POST['correo'] ?? '');

$contrasena =
    $_POST['contrasena'] ?? '';


/* =====================================================
   VALIDAR
===================================================== */

if (
    empty($correo) ||
    empty($contrasena)
) {

    header(
        "Location: ../usuario/iniciar_sesion.php?error=campos"
    );

    exit;
}


/* =====================================================
   BUSCAR USUARIO
===================================================== */

$sql = "
    SELECT
        id,
        nombre,
        apellido,
        correo,
        telefono,
        password AS contrasena,
        rol,
        estado
    FROM usuarios
    WHERE correo = ?
    LIMIT 1
";


$stmt =
    mysqli_prepare(
        $conexion,
        $sql
    );


if (!$stmt) {

    die(
        "Error preparando consulta: " .
        mysqli_error($conexion)
    );

}


mysqli_stmt_bind_param(
    $stmt,
    "s",
    $correo
);


mysqli_stmt_execute($stmt);


$resultado =
    mysqli_stmt_get_result($stmt);


/* =====================================================
   VERIFICAR USUARIO
===================================================== */

if ($resultado->num_rows === 0) {

    header(
        "Location: ../usuario/iniciar_sesion.php?error=1"
    );

    exit;
}


$usuario =
    mysqli_fetch_assoc($resultado);


/* =====================================================
   VERIFICAR ESTADO
===================================================== */

if ($usuario['estado'] !== 'activo') {

    die(
        "Tu cuenta se encuentra desactivada."
    );

}


/* =====================================================
   VERIFICAR CONTRASEÑA
===================================================== */

if (
    !password_verify(
        $contrasena,
        $usuario['contrasena']
    )
) {

    header(
        "Location: ../usuario/iniciar_sesion.php?error=1"
    );

    exit;
}


/* =====================================================
   REGENERAR ID DE SESIÓN
===================================================== */

session_regenerate_id(true);


/* =====================================================
   GUARDAR DATOS DEL USUARIO
===================================================== */

$_SESSION['usuario_id'] =
    $usuario['id'];

$_SESSION['usuario_nombre'] =
    $usuario['nombre'];

$_SESSION['usuario_apellido'] =
    $usuario['apellido'];

$_SESSION['usuario_correo'] =
    $usuario['correo'];

$_SESSION['usuario_telefono'] =
    $usuario['telefono'];

$_SESSION['usuario_rol'] =
    $usuario['rol'];


/* =====================================================
   REDIRIGIR AL PERFIL
===================================================== */

header(
    "Location: ../usuario/perfil.php"
);

exit;

?>
```
