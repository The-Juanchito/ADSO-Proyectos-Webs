
<?php

session_start();

/* =====================================================
   CONEXIÓN A LA BASE DE DATOS
===================================================== */

require_once "../php/conexion.php";


/* =====================================================
   VERIFICAR MÉTODO POST
===================================================== */

if ($_SERVER["REQUEST_METHOD"] !== "POST") {

    header("Location: crear_cuenta.php");
    exit;

}


/* =====================================================
   RECIBIR DATOS DEL FORMULARIO
===================================================== */

$nombre = trim($_POST["nombre"] ?? "");
$apellido = trim($_POST["apellido"] ?? "");
$correo = trim($_POST["correo"] ?? "");
$telefono = trim($_POST["telefono"] ?? "");
$contrasena = $_POST["contrasena"] ?? "";
$confirmar_contrasena = $_POST["confirmar_contrasena"] ?? "";


/* =====================================================
   VALIDAR CAMPOS
===================================================== */

if (
    empty($nombre) ||
    empty($apellido) ||
    empty($correo) ||
    empty($telefono) ||
    empty($contrasena) ||
    empty($confirmar_contrasena)
) {

    die("
        <div style='
            max-width:600px;
            margin:50px auto;
            padding:30px;
            font-family:Arial;
            background:white;
            border:1px solid #ddd;
            border-radius:10px;
        '>

            <h2 style='color:#c62828;'>
                Campos incompletos
            </h2>

            <p>
                Por favor completa todos los campos obligatorios.
            </p>

            <a
                href='crear_cuenta.php'
                style='
                    display:inline-block;
                    padding:12px 20px;
                    background:#0074F3;
                    color:white;
                    text-decoration:none;
                    border-radius:6px;
                    font-weight:bold;
                '
            >
                Volver al registro
            </a>

        </div>
    ");

}


/* =====================================================
   VALIDAR CORREO
===================================================== */

if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {

    die("
        <div style='
            max-width:600px;
            margin:50px auto;
            padding:30px;
            font-family:Arial;
            background:white;
            border:1px solid #ddd;
            border-radius:10px;
        '>

            <h2 style='color:#c62828;'>
                Correo inválido
            </h2>

            <p>
                Ingresa un correo electrónico válido.
            </p>

            <a
                href='crear_cuenta.php'
                style='
                    display:inline-block;
                    padding:12px 20px;
                    background:#0074F3;
                    color:white;
                    text-decoration:none;
                    border-radius:6px;
                    font-weight:bold;
                '
            >
                Volver al registro
            </a>

        </div>
    ");

}


/* =====================================================
   VALIDAR CONTRASEÑAS
===================================================== */

if ($contrasena !== $confirmar_contrasena) {

    die("
        <div style='
            max-width:600px;
            margin:50px auto;
            padding:30px;
            font-family:Arial;
            background:white;
            border:1px solid #ddd;
            border-radius:10px;
        '>

            <h2 style='color:#c62828;'>
                Las contraseñas no coinciden
            </h2>

            <p>
                Verifica las dos contraseñas e inténtalo nuevamente.
            </p>

            <a
                href='registro.php'
                style='
                    display:inline-block;
                    padding:12px 20px;
                    background:#0074F3;
                    color:white;
                    text-decoration:none;
                    border-radius:6px;
                    font-weight:bold;
                '
            >
                Volver al registro
            </a>

        </div>
    ");

}


/* =====================================================
   VALIDAR LONGITUD DE CONTRASEÑA
===================================================== */

if (strlen($contrasena) < 8) {

    die("
        <div style='
            max-width:600px;
            margin:50px auto;
            padding:30px;
            font-family:Arial;
            background:white;
            border:1px solid #ddd;
            border-radius:10px;
        '>

            <h2 style='color:#c62828;'>
                Contraseña demasiado corta
            </h2>

            <p>
                La contraseña debe tener mínimo 8 caracteres.
            </p>

            <a
                href='registro.php'
                style='
                    display:inline-block;
                    padding:12px 20px;
                    background:#0074F3;
                    color:white;
                    text-decoration:none;
                    border-radius:6px;
                    font-weight:bold;
                '
            >
                Volver al registro
            </a>

        </div>
    ");

}


/* =====================================================
   COMPROBAR SI EL CORREO YA EXISTE
===================================================== */

$sql = "
    SELECT id
    FROM usuarios
    WHERE correo = ?
    LIMIT 1
";


$stmt = mysqli_prepare(
    $conexion,
    $sql
);


if (!$stmt) {

    die(
        "Error preparando consulta: " .
        htmlspecialchars(mysqli_error($conexion))
    );

}


mysqli_stmt_bind_param(
    $stmt,
    "s",
    $correo
);


mysqli_stmt_execute($stmt);


$resultado = mysqli_stmt_get_result($stmt);


if ($resultado->num_rows > 0) {

    die("
        <div style='
            max-width:600px;
            margin:50px auto;
            padding:30px;
            font-family:Arial;
            background:white;
            border:1px solid #ddd;
            border-radius:10px;
        '>

            <h2 style='color:#c62828;'>
                Correo ya registrado
            </h2>

            <p>
                Ya existe una cuenta registrada con este correo.
            </p>

            <a
                href='registro.php'
                style='
                    display:inline-block;
                    padding:12px 20px;
                    background:#0074F3;
                    color:white;
                    text-decoration:none;
                    border-radius:6px;
                    font-weight:bold;
                '
            >
                Volver al registro
            </a>

        </div>
    ");

}


mysqli_stmt_close($stmt);


/* =====================================================
   CIFRAR CONTRASEÑA
===================================================== */

$contrasena_cifrada = password_hash(
    $contrasena,
    PASSWORD_DEFAULT
);


/* =====================================================
   INSERTAR USUARIO
===================================================== */

$sql = "
    INSERT INTO usuarios
    (
        nombre,
        apellido,
        correo,
        telefono,
        password,
        rol,
        estado
    )
    VALUES
    (
        ?,
        ?,
        ?,
        ?,
        ?,
        'cliente',
        'activo'
    )
";


$stmt = mysqli_prepare(
    $conexion,
    $sql
);


if (!$stmt) {

    die(
        "Error preparando registro: " .
        htmlspecialchars(mysqli_error($conexion))
    );

}


mysqli_stmt_bind_param(
    $stmt,
    "sssss",
    $nombre,
    $apellido,
    $correo,
    $telefono,
    $contrasena_cifrada
);


/* =====================================================
   GUARDAR USUARIO
===================================================== */

if (!mysqli_stmt_execute($stmt)) {

    die("
        <div style='
            max-width:600px;
            margin:50px auto;
            padding:30px;
            font-family:Arial;
            background:white;
            border:1px solid #ddd;
            border-radius:10px;
        '>

            <h2 style='color:#c62828;'>
                No se pudo crear la cuenta
            </h2>

            <p>
                " .
                htmlspecialchars(
                    mysqli_stmt_error($stmt)
                ) .
                "
            </p>

            <a
                href='registro.php'
                style='
                    display:inline-block;
                    padding:12px 20px;
                    background:#0074F3;
                    color:white;
                    text-decoration:none;
                    border-radius:6px;
                    font-weight:bold;
                '
            >
                Volver al registro
            </a>

        </div>
    ");

}


/* =====================================================
   OBTENER ID DEL USUARIO
===================================================== */

$usuario_id = mysqli_insert_id($conexion);


/* =====================================================
   GUARDAR DATOS EN SESIÓN
===================================================== */

$_SESSION["usuario_id"] = $usuario_id;

$_SESSION["usuario_nombre"] = $nombre;

$_SESSION["usuario_apellido"] = $apellido;

$_SESSION["usuario_correo"] = $correo;

$_SESSION["usuario_rol"] = "cliente";


/* =====================================================
   CERRAR STATEMENT
===================================================== */

mysqli_stmt_close($stmt);


/* =====================================================
   REDIRECCIONAR
===================================================== */

header("Location: perfil.php");

exit;

?>
