<?php

if(session_status() === PHP_SESSION_NONE)
{
    session_start();
}

/*
    Detectamos la carpeta principal del proyecto
*/
$rutaApp = '/los_phpsistas/tiendaTecnoMarketSAS';

$logueado = isset($_SESSION['usuario']);

?>

<div class="menu-lateral">

    <input type="checkbox" id="menu">

    <label for="menu" class="btn-menu">
        ☰
    </label>

    <nav class="sidebar">

        <h2>TecnoMarket</h2>


        <?php if($logueado){ ?>

            <div class="usuario-menu">

                Bienvenido,
                <?php echo htmlspecialchars($_SESSION['nombre']); ?>

            </div>


            <?php if($_SESSION['rol'] == "administrador"){ ?>

                <!-- ADMINISTRADOR -->

                <a href="<?php echo $rutaApp; ?>/inicio.php">
                    Inicio
                </a>

                <a href="<?php echo $rutaApp; ?>/index.php">
                    Registrar Producto
                </a>

                <a href="<?php echo $rutaApp; ?>/php/buscar.php">
                    Buscar
                </a>

                <a href="<?php echo $rutaApp; ?>/php/dashboard.php">
                    Dashboard
                </a>

            <?php } ?>


            <?php if($_SESSION['rol'] == "cliente"){ ?>

                <!-- CLIENTE -->

                <a href="<?php echo $rutaApp; ?>/php/cliente.php">
                    Productos
                </a>

            <?php } ?>


            <a href="<?php echo $rutaApp; ?>/php/cerrar_sesion.php">
                Cerrar sesión
            </a>


        <?php }else{ ?>

            <!-- USUARIO NO LOGUEADO -->

            <a href="<?php echo $rutaApp; ?>/inicio.php">
                Inicio
            </a>

            <a href="<?php echo $rutaApp; ?>/login.php">
                Iniciar sesión
            </a>

            <a href="<?php echo $rutaApp; ?>/registro.php">
                Registrarse
            </a>

        <?php } ?>

    </nav>

</div>