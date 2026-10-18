<?php

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$usuario_logueado =
    isset($_SESSION['usuario_id']);

$usuario_nombre =
    $_SESSION['usuario_nombre'] ?? '';

$usuario_apellido =
    $_SESSION['usuario_apellido'] ?? '';

$usuario_rol =
    $_SESSION['usuario_rol'] ?? 'cliente';

?>

<!-- =====================================================
     MENÚ PRINCIPAL MAXISTORE
===================================================== -->

<header class="menu-principal">


    <!-- =================================================
         BARRA SUPERIOR
    ================================================== -->

    <div class="menu-barra">


        <!-- LOGO -->

        <a
            href="/maxistore/index.php"
            class="menu-logo"
        >

            <img
                src="/maxistore/imagenes/Logo.jpeg"
                alt="MaxiStore"
            >

        </a>


        <!-- =================================================
             BOTÓN HAMBURGUESA
        ================================================== -->

        <button
            type="button"
            class="menu-boton"
            id="menu-boton"
            aria-label="Abrir menú"
            aria-expanded="false"
            aria-controls="menu-contenido"
        >

            <i
                id="menu-icono"
                class="bi bi-list"
            ></i>

        </button>


        <!-- =================================================
             MENÚ DESKTOP
        ================================================== -->

        <nav class="menu-desktop">


            <a
                href="/maxistore/index.php"
                class="menu-enlace"
            >

                <i class="bi bi-house"></i>

                <span>Inicio</span>

            </a>


            <a
                href="php/carrito.php"
                class="menu-enlace"
            >

                <i class="bi bi-cart3"></i>

                <span>Carrito</span>

                <span class="menu-contador">
                    0
                </span>

            </a>


            <?php if ($usuario_logueado): ?>


                <a
                    href="/maxistore/usuario/perfil.php"
                    class="menu-enlace"
                >

                    <i class="bi bi-person-circle"></i>

                    <span>Mi perfil</span>

                </a>


                <?php if ($usuario_rol === 'admin'): ?>

                    <a
                        href="/maxistore/admin/index1.php"
                        class="menu-enlace menu-admin"
                    >

                        <i class="bi bi-speedometer2"></i>

                        <span>Administración</span>

                    </a>

                <?php endif; ?>


                <a
                    href="/maxistore/php/cerrar_sesion.php"
                    class="menu-enlace menu-salir"
                >

                    <i class="bi bi-box-arrow-right"></i>

                    <span>Cerrar sesión</span>

                </a>


            <?php else: ?>


                <a
                    href="/maxistore/usuario/iniciar_sesion.php"
                    class="menu-enlace"
                >

                    <i class="bi bi-person"></i>

                    <span>Iniciar sesión</span>

                </a>


                <a
                    href="/maxistore/usuario/crear_cuenta.php"
                    class="menu-enlace"
                >

                    <i class="bi bi-person-plus"></i>

                    <span>Crear cuenta</span>

                </a>


            <?php endif; ?>


        </nav>


    </div>


    <!-- =================================================
         OVERLAY
    ================================================== -->

    <div
        class="menu-overlay"
        id="menu-overlay"
    ></div>


    <!-- =================================================
         MENÚ MÓVIL
    ================================================== -->

    <div
        class="menu-contenido"
        id="menu-contenido"
    >


        <!-- CABECERA -->

        <div class="menu-movil-cabecera">


            <div class="menu-movil-logo">

                <img
                    src="imagenes/Logo.jpeg"
                    alt="MaxiStore"
                >

            </div>


            <?php if ($usuario_logueado): ?>

                <div class="menu-movil-usuario">

                    <i class="bi bi-person-circle"></i>

                    <div>

                        <strong>

                            <?php

                            echo htmlspecialchars(
                                trim(
                                    $usuario_nombre .
                                    ' ' .
                                    $usuario_apellido
                                )
                            );

                            ?>

                        </strong>

                        <span>

                            <?php

                            echo $usuario_rol === 'admin'
                                ? 'Administrador'
                                : 'Cliente';

                            ?>

                        </span>

                    </div>

                </div>

            <?php endif; ?>


        </div>


        <!-- =================================================
             ENLACES
        ================================================== -->

        <nav class="menu-movil-enlaces">


            <a
                href="index.php"
                class="menu-enlace"
            >

                <i class="bi bi-house"></i>

                <span>Inicio</span>

            </a>


            <a
                href="php/carrito.php"
                class="menu-enlace"
            >

                <i class="bi bi-cart3"></i>

                <span>Carrito</span>

                <span class="menu-contador">
                    0
                </span>

            </a>


            <?php if ($usuario_logueado): ?>


                <a
                    href="usuario/perfil.php"
                    class="menu-enlace"
                >

                    <i class="bi bi-person-circle"></i>

                    <span>Mi perfil</span>

                </a>


                <a
                    href="usuario/mis_pedidos.php"
                    class="menu-enlace"
                >

                    <i class="bi bi-box-seam"></i>

                    <span>Mis pedidos</span>

                </a>


                <?php if ($usuario_rol === 'admin'): ?>

                    <a
                        href="admin/index1.php"
                        class="menu-enlace menu-admin"
                    >

                        <i class="bi bi-speedometer2"></i>

                        <span>Administración</span>

                    </a>

                <?php endif; ?>


                <a
                    href="php/cerrar_sesion.php"
                    class="menu-enlace menu-salir"
                >

                    <i class="bi bi-box-arrow-right"></i>

                    <span>Cerrar sesión</span>

                </a>


            <?php else: ?>


                <a
                    href="usuario/iniciar_sesion.php"
                    class="menu-enlace"
                >

                    <i class="bi bi-person"></i>

                    <span>Iniciar sesión</span>

                </a>


                <a
                    href="usuario/crear_cuenta.php"
                    class="menu-enlace"
                >

                    <i class="bi bi-person-plus"></i>

                    <span>Crear cuenta</span>

                </a>


            <?php endif; ?>


        </nav>


        <!-- =================================================
             PIE DEL MENÚ
        ================================================== -->

        <div class="menu-movil-pie">

            <span>

                © <?php echo date('Y'); ?> MaxiStore

            </span>

        </div>


    </div>


</header>