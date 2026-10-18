
<div class="cookie-overlay" id="cookieOverlay">

    <div class="cookie-card">

        <span class="title">
            🍪 Aviso de cookies
        </span>

        <p class="description">

            Utilizamos cookies para mejorar tu experiencia
            en MaxiStore y ofrecerte un mejor servicio.

            <a href="#">
                Leer nuestra política de cookies
            </a>

        </p>

        <div class="actions">

            <button
                type="button"
                class="pref"
                onclick="cerrarCookies()"
            >
                Ahora no
            </button>

            <button
                type="button"
                class="accept"
                onclick="aceptarCookies()"
            >
                Aceptar
            </button>

        </div>

    </div>

</div>


<script>

function aceptarCookies() {

    localStorage.setItem(
        "maxistore_cookies",
        "aceptadas"
    );

    document.getElementById(
        "cookieOverlay"
    ).style.display = "none";

}


function cerrarCookies() {

    document.getElementById(
        "cookieOverlay"
    ).style.display = "none";

}


document.addEventListener(
    "DOMContentLoaded",
    function () {

        const cookies =
            localStorage.getItem(
                "maxistore_cookies"
            );

        if (cookies === "aceptadas") {

            document.getElementById(
                "cookieOverlay"
            ).style.display = "none";

        }

    }
);

</script>
