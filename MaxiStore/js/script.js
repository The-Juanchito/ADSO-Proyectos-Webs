/* =====================================================
   MAXISTORE - JAVASCRIPT GENERAL
===================================================== */

const MAXISTORE_BASE = "/maxistore/";


/* =====================================================
   INICIO
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    iniciarMenuPrincipal();

    iniciarMenuAdministrador();

    iniciarAgregarCarrito();

});


/* =====================================================
   MENSAJES
===================================================== */

function mostrarMensaje(texto) {

    let mensaje = document.getElementById("mensaje");

    if (!mensaje) {

        mensaje = document.createElement("div");

        mensaje.id = "mensaje";

        document.body.appendChild(mensaje);

    }

    mensaje.innerText = texto;

    mensaje.style.display = "block";

    setTimeout(function () {

        mensaje.style.display = "none";

    }, 2500);

}


/* =====================================================
   FORMATO DE PESOS
===================================================== */

function formatoPesos(numero) {

    return "$" + Number(numero).toLocaleString("es-CO");

}


/* =====================================================
   MENÚ PRINCIPAL DE LA TIENDA
===================================================== */

function iniciarMenuPrincipal() {

    const botonMenu =
        document.getElementById("menu-boton");

    const contenidoMenu =
        document.getElementById("menu-contenido");

    const overlay =
        document.getElementById("menu-overlay");


    if (!botonMenu || !contenidoMenu) {

        return;

    }


    const icono =
        botonMenu.querySelector("i");


    /* =================================================
       ABRIR
    ================================================= */

    function abrirMenu() {

        contenidoMenu.classList.add(
            "menu-abierto"
        );


        if (overlay) {

            overlay.classList.add(
                "menu-abierto"
            );

        }


        botonMenu.classList.add(
            "menu-activo"
        );


        botonMenu.setAttribute(
            "aria-expanded",
            "true"
        );


        botonMenu.setAttribute(
            "aria-label",
            "Cerrar menú"
        );


        document.body.classList.add(
            "menu-bloqueado"
        );


        if (icono) {

            icono.classList.remove(
                "bi-list"
            );

            icono.classList.add(
                "bi-x-lg"
            );

        }

    }


    /* =================================================
       CERRAR
    ================================================= */

    function cerrarMenu() {

        contenidoMenu.classList.remove(
            "menu-abierto"
        );


        if (overlay) {

            overlay.classList.remove(
                "menu-abierto"
            );

        }


        botonMenu.classList.remove(
            "menu-activo"
        );


        botonMenu.setAttribute(
            "aria-expanded",
            "false"
        );


        botonMenu.setAttribute(
            "aria-label",
            "Abrir menú"
        );


        document.body.classList.remove(
            "menu-bloqueado"
        );


        if (icono) {

            icono.classList.remove(
                "bi-x-lg"
            );

            icono.classList.add(
                "bi-list"
            );

        }

    }


    /* =================================================
       BOTÓN
    ================================================= */

    botonMenu.addEventListener(
        "click",
        function () {

            const abierto =
                contenidoMenu.classList.contains(
                    "menu-abierto"
                );


            if (abierto) {

                cerrarMenu();

            } else {

                abrirMenu();

            }

        }
    );


    /* =================================================
       OVERLAY
    ================================================= */

    if (overlay) {

        overlay.addEventListener(
            "click",
            cerrarMenu
        );

    }


    /* =================================================
       ENLACES
    ================================================= */

    const enlaces =
        contenidoMenu.querySelectorAll("a");


    enlaces.forEach(function (enlace) {

        enlace.addEventListener(
            "click",
            cerrarMenu
        );

    });


    /* =================================================
       ESC
    ================================================= */

    document.addEventListener(
        "keydown",
        function (evento) {

            if (evento.key === "Escape") {

                cerrarMenu();

            }

        }
    );


    /* =================================================
       CAMBIO A ESCRITORIO
    ================================================= */

    window.addEventListener(
        "resize",
        function () {

            if (window.innerWidth > 850) {

                cerrarMenu();

            }

        }
    );

}


/* =====================================================
   MENÚ ADMINISTRADOR
===================================================== */

function iniciarMenuAdministrador() {

    const boton =
        document.getElementById(
            "adminMenuToggle"
        );


    const cerrar =
        document.getElementById(
            "adminMenuCerrar"
        );


    const sidebar =
        document.getElementById(
            "adminSidebar"
        );


    const overlay =
        document.getElementById(
            "adminOverlay"
        );


    if (!sidebar) {

        return;

    }


    /* =================================================
       ABRIR
    ================================================= */

    function abrirAdminMenu() {

        sidebar.classList.add(
            "menu-visible"
        );


        if (overlay) {

            overlay.classList.add(
                "menu-visible"
            );

        }


        document.body.classList.add(
            "admin-menu-abierto"
        );


        if (boton) {

            boton.classList.add(
                "menu-activo"
            );


            boton.setAttribute(
                "aria-expanded",
                "true"
            );

        }

    }


    /* =================================================
       CERRAR
    ================================================= */

    function cerrarAdminMenu() {

        sidebar.classList.remove(
            "menu-visible"
        );


        if (overlay) {

            overlay.classList.remove(
                "menu-visible"
            );

        }


        document.body.classList.remove(
            "admin-menu-abierto"
        );


        if (boton) {

            boton.classList.remove(
                "menu-activo"
            );


            boton.setAttribute(
                "aria-expanded",
                "false"
            );

        }

    }


    /* =================================================
       BOTÓN ABRIR
    ================================================= */

    if (boton) {

        boton.addEventListener(
            "click",
            function () {

                const abierto =
                    sidebar.classList.contains(
                        "menu-visible"
                    );


                if (abierto) {

                    cerrarAdminMenu();

                } else {

                    abrirAdminMenu();

                }

            }
        );

    }


    /* =================================================
       BOTÓN CERRAR
    ================================================= */

    if (cerrar) {

        cerrar.addEventListener(
            "click",
            cerrarAdminMenu
        );

    }


    /* =================================================
       OVERLAY
    ================================================= */

    if (overlay) {

        overlay.addEventListener(
            "click",
            cerrarAdminMenu
        );

    }


    /* =================================================
       ESC
    ================================================= */

    document.addEventListener(
        "keydown",
        function (evento) {

            if (evento.key === "Escape") {

                cerrarAdminMenu();

            }

        }
    );


    /* =================================================
       ENLACES
    ================================================= */

    const enlaces =
        sidebar.querySelectorAll("a");


    enlaces.forEach(function (enlace) {

        enlace.addEventListener(
            "click",
            function () {

                if (window.innerWidth <= 850) {

                    cerrarAdminMenu();

                }

            }
        );

    });


    /* =================================================
       CAMBIO A PC
    ================================================= */

    window.addEventListener(
        "resize",
        function () {

            if (window.innerWidth > 850) {

                cerrarAdminMenu();

            }

        }
    );

}


/* =====================================================
   AGREGAR PRODUCTOS AL CARRITO
===================================================== */

function iniciarAgregarCarrito() {

    const formularios =
        document.querySelectorAll(
            ".form-carrito"
        );


    formularios.forEach(function (form) {

        form.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                const boton =
                    form.querySelector(
                        ".btn-carrito, .btn-agregar"
                    );


                if (!boton) {

                    return;

                }


                if (boton.disabled) {

                    return;

                }


                boton.disabled = true;


                const textoOriginal =
                    boton.innerHTML;


                boton.innerHTML =
                    '<i class="bi bi-hourglass-split"></i> Agregando...';


                const datos =
                    new FormData(form);


                fetch(
                    form.action,
                    {
                        method: "POST",
                        body: datos
                    }
                )


                .then(function (respuesta) {

                    if (!respuesta.ok) {

                        throw new Error(
                            "Error HTTP " +
                            respuesta.status
                        );

                    }

                    return respuesta.json();

                })


                .then(function (datos) {

                    if (!datos.exito) {

                        mostrarMensaje(
                            datos.mensaje ||
                            "No se pudo agregar el producto"
                        );


                        boton.disabled = false;

                        boton.innerHTML =
                            textoOriginal;

                        return;

                    }


                    boton.innerHTML =
                        '<i class="bi bi-check-circle"></i> Agregado';


                    mostrarMensaje(
                        "Producto agregado al carrito"
                    );


                    actualizarContadorCarrito(
                        datos.total_carrito ??
                        datos.total ??
                        null
                    );


                    const productoId =
                        datos.producto_id;


                    const stockElemento =
                        document.querySelector(
                            `[data-stock="${productoId}"]`
                        );


                    if (stockElemento) {

                        stockElemento.innerText =
                            datos.disponible;

                    }


                    if (
                        Number(datos.disponible) <= 0
                    ) {

                        const tarjeta =
                            boton.closest(
                                ".producto-card, .producto"
                            );


                        if (tarjeta) {

                            const stock =
                                tarjeta.querySelector(
                                    ".stock-disponible, .stock"
                                );


                            if (stock) {

                                stock.innerHTML =
                                    '<i class="bi bi-box-seam"></i> ' +
                                    '<strong>Agotado</strong>';

                            }

                        }


                        boton.innerHTML =
                            '<i class="bi bi-x-circle"></i> Agotado';

                        boton.disabled = true;

                        return;

                    }


                    setTimeout(function () {

                        boton.innerHTML =
                            '<i class="bi bi-cart-plus"></i> Agregar al carrito';

                        boton.disabled = false;

                    }, 1500);

                })


                .catch(function (error) {

                    console.error(
                        "Error:",
                        error
                    );


                    mostrarMensaje(
                        "Ocurrió un error al agregar el producto"
                    );


                    boton.disabled = false;

                    boton.innerHTML =
                        textoOriginal;

                });

            }
        );

    });

}


/* =====================================================
   CONTADOR DEL CARRITO
===================================================== */

function actualizarContadorCarrito(cantidad) {

    if (
        cantidad === null ||
        cantidad === undefined
    ) {

        return;

    }


    const contadores =
        document.querySelectorAll(
            ".menu-contador"
        );


    contadores.forEach(function (contador) {

        contador.innerText =
            cantidad;

    });

}


/* =====================================================
   CAMBIAR CANTIDAD DEL CARRITO
===================================================== */

function cambiarCantidad(
    carritoId,
    accion
) {

    fetch(
        MAXISTORE_BASE +
        "php/actualizar_carrito.php",
        {

            method: "POST",

            headers: {
                "Content-Type":
                    "application/x-www-form-urlencoded"
            },

            body:
                "carrito_id=" +
                encodeURIComponent(carritoId) +
                "&accion=" +
                encodeURIComponent(accion)

        }
    )


    .then(function (respuesta) {

        if (!respuesta.ok) {

            throw new Error(
                "Error HTTP " +
                respuesta.status
            );

        }

        return respuesta.json();

    })


    .then(function (datos) {

        if (!datos.exito) {

            mostrarMensaje(
                datos.mensaje ||
                "Ocurrió un error"
            );

            return;

        }


        if (datos.eliminado) {

            const producto =
                document.getElementById(
                    "producto-" +
                    carritoId
                );


            if (producto) {

                producto.remove();

            }


            actualizarTotal(
                datos.total
            );


            actualizarContadorCarrito(
                datos.total_carrito ??
                null
            );


            mostrarMensaje(
                "Producto eliminado"
            );


            comprobarCarrito();

            return;

        }


        const cantidad =
            document.getElementById(
                "cantidad-" +
                carritoId
            );


        if (cantidad) {

            cantidad.innerText =
                datos.cantidad;

        }


        const stock =
            document.getElementById(
                "stock-" +
                carritoId
            );


        if (stock) {

            if (Number(datos.stock) <= 0) {

                stock.innerText =
                    "AGOTADO";

                stock.classList.add(
                    "stock-agotado"
                );

            } else {

                stock.innerText =
                    datos.stock;

                stock.classList.remove(
                    "stock-agotado"
                );

            }

        }


        const subtotal =
            document.getElementById(
                "subtotal-" +
                carritoId
            );


        if (subtotal) {

            subtotal.innerText =
                formatoPesos(
                    datos.subtotal
                );

        }


        const botonMas =
            document.getElementById(
                "btn-mas-" +
                carritoId
            );


        if (botonMas) {

            botonMas.disabled =
                Number(datos.stock) <= 0;

        }


        actualizarTotal(
            datos.total
        );


        actualizarContadorCarrito(
            datos.total_carrito ??
            null
        );

    })


    .catch(function (error) {

        console.error(
            "Error:",
            error
        );


        mostrarMensaje(
            "Ocurrió un error al actualizar el carrito"
        );

    });

}


/* =====================================================
   ACTUALIZAR TOTAL
===================================================== */

function actualizarTotal(total) {

    const elemento =
        document.getElementById(
            "total-carrito"
        );


    if (elemento) {

        elemento.innerText =
            formatoPesos(total);

    }

}


/* =====================================================
   ELIMINAR PRODUCTO
===================================================== */

function eliminarProducto(carritoId) {

    fetch(
        MAXISTORE_BASE +
        "php/eliminar_carrito.php",
        {

            method: "POST",

            headers: {
                "Content-Type":
                    "application/x-www-form-urlencoded"
            },

            body:
                "carrito_id=" +
                encodeURIComponent(carritoId)

        }
    )


    .then(function (respuesta) {

        if (!respuesta.ok) {

            throw new Error(
                "Error HTTP " +
                respuesta.status
            );

        }

        return respuesta.json();

    })


    .then(function (datos) {

        if (!datos.exito) {

            mostrarMensaje(
                datos.mensaje ||
                "No se pudo eliminar"
            );

            return;

        }


        const producto =
            document.getElementById(
                "producto-" +
                carritoId
            );


        if (producto) {

            producto.remove();

        }


        actualizarTotal(
            datos.total
        );


        actualizarContadorCarrito(
            datos.total_carrito ??
            null
        );


        mostrarMensaje(
            "Producto eliminado del carrito"
        );


        comprobarCarrito();

    })


    .catch(function (error) {

        console.error(
            "Error:",
            error
        );


        mostrarMensaje(
            "Ocurrió un error al eliminar el producto"
        );

    });

}


/* =====================================================
   COMPROBAR CARRITO
===================================================== */

function comprobarCarrito() {

    const productos =
        document.querySelectorAll(
            ".producto-carrito"
        );


    if (productos.length === 0) {

        setTimeout(function () {

            location.reload();

        }, 500);

    }

}