<?php

session_start();

if(!isset($_SESSION['usuario']))
{
    header("Location: ../login.php");
    exit();
}

if($_SESSION['rol'] != "cliente")
{
    header("Location: ../index.php");
    exit();
}

include("conexion.php");

$productos = null;

if(isset($_POST['buscar']))
{
    $busqueda = $_POST['busqueda'];

    $sql = "SELECT * FROM producto
            WHERE nombre LIKE '%$busqueda%'
            OR codigo LIKE '%$busqueda%'";

    $productos = mysqli_query($conexion, $sql);
}

?>

<!DOCTYPE html>
<html lang="es">

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width, initial-scale=1.0">

<title>Productos - TecnoMarket</title>

<link rel="stylesheet" href="../css/menu.css">
<link rel="stylesheet" href="../css/style.css">

<style>

.productos{
    margin-top:30px;
}

.producto{
    background:white;
    padding:20px;
    margin-bottom:20px;
    border-radius:10px;
    box-shadow:0 2px 10px rgba(0,0,0,.15);
}

.producto img{
    width:120px;
    height:120px;
    object-fit:cover;
    border-radius:8px;
}

.producto h3{
    color:#0d6efd;
    margin-bottom:10px;
}

.buscar{
    display:flex;
    gap:10px;
    margin-top:20px;
}

.buscar input[type="text"]{
    flex:1;
    padding:12px;
    border:1px solid #ccc;
    border-radius:5px;
}

.buscar input[type="submit"]{
    padding:12px 20px;
    background:#0d6efd;
    color:white;
    border:none;
    border-radius:5px;
    cursor:pointer;
}

.buscar input[type="submit"]:hover{
    background:#084298;
}

</style>

</head>

<body>

<?php include("menu.php"); ?>

<div class="contenedor">

    <h2>Productos</h2>

    <h3>
        Bienvenido,
        <?php echo $_SESSION['nombre']; ?>
    </h3>

    <form method="POST" class="buscar">

        <input
        type="text"
        name="busqueda"
        placeholder="Buscar por nombre o código"
        required>

        <input
        type="submit"
        name="buscar"
        value="Buscar">

    </form>

    <div class="productos">

    <?php

    if($productos != null)
    {

        if(mysqli_num_rows($productos) > 0)
        {

            while($fila = mysqli_fetch_assoc($productos))
            {

    ?>

                <div class="producto">

                    <h3>
                        <?php echo $fila['nombre']; ?>
                    </h3>

                    <p>
                        <strong>Código:</strong>
                        <?php echo $fila['codigo']; ?>
                    </p>

                    <p>
                        <strong>Descripción:</strong>
                        <?php echo $fila['descripcion']; ?>
                    </p>

                    <p>
                        <strong>Cantidad disponible:</strong>
                        <?php echo $fila['cantidad']; ?>
                    </p>

                    <p>
                        <strong>Precio:</strong>
                        $<?php echo number_format($fila['valor'],0,',','.'); ?>
                    </p>

                    <?php if(!empty($fila['imagen'])){ ?>

                        <img
                        src="<?php echo $fila['imagen']; ?>"
                        alt="Producto">

                    <?php } ?>

                </div>

    <?php

            }

        }
        else
        {

            echo "<p>No se encontraron productos.</p>";

        }

    }

    ?>

    </div>

</div>

</body>

</html>