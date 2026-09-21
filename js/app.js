const formulario = document.getElementById("formMovimiento");
const descripcion = document.getElementById("descripcion");
const monto = document.getElementById("monto");
const tipo = document.getElementById("tipo");
const categoria = document.getElementById("categoria");
const fecha = document.getElementById("fecha");

const listaMovimientos = document.getElementById("listaMovimientos");
const filtro = document.getElementById("filtro");

const saldoElemento = document.getElementById("saldo");
const ingresosElemento = document.getElementById("ingresos");
const gastosElemento = document.getElementById("gastos");

const mayorGastoElemento = document.getElementById("mayorGasto");
const totalMovimientosElemento = document.getElementById("totalMovimientos");
const promedioGastoElemento = document.getElementById("promedioGasto");
const botonTema = document.querySelector(".btn-tema");
const graficoCategorias = document.getElementById("graficoCategorias");
const btnAgregar = document.querySelector('.btn-agregar');
const btnCancelar = document.getElementById('btnCancelar');

let editId = null;

// --- MODO OSCURO ---
const botonTemaId = document.getElementById("btnTema");

function aplicarModoOscuro(activar) {
    if (activar) {
        document.body.classList.add("modo-oscuro");
        if (botonTemaId) botonTemaId.textContent = "☀️";
        localStorage.setItem("modoOscuro", "1");
    } else {
        document.body.classList.remove("modo-oscuro");
        if (botonTemaId) botonTemaId.textContent = "🌙";
        localStorage.setItem("modoOscuro", "0");
    }
}

function initModoOscuro() {
    try {
        const almacenado = localStorage.getItem("modoOscuro");

        if (almacenado === null) {
            const preferDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            aplicarModoOscuro(preferDark);
        } else {
            aplicarModoOscuro(almacenado === "1");
        }

        if (botonTemaId) {
            botonTemaId.addEventListener("click", () => {
                const ahoraOscuro = document.body.classList.contains("modo-oscuro");
                aplicarModoOscuro(!ahoraOscuro);
            });
        }
    } catch (e) {
        console.warn('No se pudo inicializar el modo oscuro:', e);
    }
}


// ===============================
// CARGAR MOVIMIENTOS
// ===============================

let movimientos = JSON.parse(localStorage.getItem("movimientos")) || [];


// ===============================
// GUARDAR MOVIMIENTOS
// ===============================

function guardarMovimientos() {
    localStorage.setItem("movimientos", JSON.stringify(movimientos));
}


// ===============================
// AGREGAR MOVIMIENTO
// ===============================

formulario.addEventListener("submit", function (evento) {

    evento.preventDefault();
    const datos = {
        descripcion: descripcion.value.trim(),
        monto: Number(monto.value),
        fecha: fecha && fecha.value ? fecha.value : new Date().toISOString().slice(0,10),
        tipo: tipo.value,
        categoria: categoria.value
    };

    if (editId) {
        // Editar movimiento existente
        const idx = movimientos.findIndex(m => m.id === editId);
        if (idx !== -1) {
            movimientos[idx] = Object.assign({}, movimientos[idx], datos);
        }
        editId = null;
        if (btnAgregar) btnAgregar.textContent = '+ Agregar movimiento';
        if (btnCancelar) btnCancelar.hidden = true;
    } else {
        const nuevoMovimiento = Object.assign({ id: Date.now() }, datos);
        movimientos.push(nuevoMovimiento);
    }

    guardarMovimientos();

    formulario.reset();

    // restaurar fecha por defecto
    try {
        if (fecha) fecha.value = new Date().toISOString().slice(0,10);
    } catch (e) {}

    mostrarMovimientos();
    actualizarResumen();
    actualizarEstadisticas();
});


// ===============================
// MOSTRAR MOVIMIENTOS
// ===============================

function mostrarMovimientos() {

    listaMovimientos.innerHTML = "";

    let movimientosFiltrados = movimientos;

    if (filtro.value !== "todos") {
        movimientosFiltrados = movimientos.filter(
            movimiento => movimiento.tipo === filtro.value
        );
    }

    if (movimientosFiltrados.length === 0) {

        listaMovimientos.innerHTML = `
            <div class="sin-movimientos">
                <p>No hay movimientos registrados.</p>
                <span>Agrega tu primer ingreso o gasto.</span>
            </div>
        `;

        return;
    }

    movimientosFiltrados.forEach(movimiento => {

        const elemento = document.createElement("div");

        elemento.classList.add("movimiento");

        const signo = movimiento.tipo === "ingreso" ? "+" : "-";

        const fechaTexto = movimiento.fecha ? new Date(movimiento.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

        elemento.innerHTML = `
            <div>
                <strong>${movimiento.descripcion}</strong>
                <span>${movimiento.categoria}</span>
                <small class="fecha">${fechaTexto}</small>
            </div>

            <div class="movimiento-derecha">

                <strong class="${movimiento.tipo}">
                    ${signo}$${movimiento.monto.toFixed(2)}
                </strong>

                <button
                    class="btn-eliminar"
                    onclick="eliminarMovimiento(${movimiento.id})">
                    🗑️
                </button>

                <button
                    class="btn-editar"
                    onclick="iniciarEdicion(${movimiento.id})">
                    ✏️
                </button>

            </div>
        `;

        listaMovimientos.appendChild(elemento);
    });
}


// ===============================
// ELIMINAR MOVIMIENTO
// ===============================

function eliminarMovimiento(id) {

    movimientos = movimientos.filter(
        movimiento => movimiento.id !== id
    );

    guardarMovimientos();

    mostrarMovimientos();
    actualizarResumen();
    actualizarEstadisticas();
}


// ===============================
// ACTUALIZAR RESUMEN
// ===============================

function actualizarResumen() {

    let ingresos = 0;
    let gastos = 0;

    movimientos.forEach(movimiento => {

        if (movimiento.tipo === "ingreso") {
            ingresos += movimiento.monto;
        } else {
            gastos += movimiento.monto;
        }

    });

    const saldo = ingresos - gastos;

    ingresosElemento.textContent = `$${ingresos.toFixed(2)}`;
    gastosElemento.textContent = `$${gastos.toFixed(2)}`;
    saldoElemento.textContent = `$${saldo.toFixed(2)}`;
}


// ===============================
// FILTRO
// ===============================

filtro.addEventListener("change", function () {

    mostrarMovimientos();

});


// ===============================
// ESTADÍSTICAS
// ===============================

function actualizarEstadisticas() {

    // Obtener solamente los gastos
    const gastos = movimientos.filter(
        movimiento => movimiento.tipo === "gasto"
    );


    // ===============================
    // TOTAL DE MOVIMIENTOS
    // ===============================

    totalMovimientosElemento.textContent = movimientos.length;


    // ===============================
    // MAYOR GASTO
    // ===============================

    if (gastos.length > 0) {

        const mayorGasto = Math.max(
            ...gastos.map(movimiento => movimiento.monto)
        );

        mayorGastoElemento.textContent =
            `$${mayorGasto.toFixed(2)}`;

    } else {

        mayorGastoElemento.textContent = "$0.00";

    }


    // ===============================
    // PROMEDIO DE GASTO
    // ===============================

    if (gastos.length > 0) {

        const totalGastos = gastos.reduce(
            (total, movimiento) =>
                total + movimiento.monto,
            0
        );

        const promedio = totalGastos / gastos.length;

        promedioGastoElemento.textContent =
            `$${promedio.toFixed(2)}`;

    } else {

        promedioGastoElemento.textContent = "$0.00";

    }


    // ===============================
    // GASTOS POR CATEGORÍA
    // ===============================

    const categorias = {};

    gastos.forEach(movimiento => {

        if (!categorias[movimiento.categoria]) {
            categorias[movimiento.categoria] = 0;
        }

        categorias[movimiento.categoria] += movimiento.monto;

    });


    // Limpiar gráfico anterior
    graficoCategorias.innerHTML = "";


    // Si no existen gastos
    if (Object.keys(categorias).length === 0) {

        graficoCategorias.innerHTML = `
            <p class="sin-estadisticas">
                No hay gastos registrados.
            </p>
        `;

        return;
    }


    // ===============================
    // ORDENAR CATEGORÍAS
    // ===============================

    const categoriasOrdenadas =
        Object.entries(categorias).sort(
            (a, b) => b[1] - a[1]
        );


    // Obtener el gasto más alto
    const mayorCategoria =
        categoriasOrdenadas[0][1];


    // ===============================
    // CREAR BARRAS
    // ===============================

    categoriasOrdenadas.forEach(
        ([nombreCategoria, total]) => {

            const porcentaje =
                (total / mayorCategoria) * 100;

            const elemento =
                document.createElement("div");

            elemento.classList.add("barra-contenedor");

            elemento.innerHTML = `
                <strong>${nombreCategoria}</strong>

                <div class="barra-fondo">

                    <div
                        class="barra"
                        style="width: ${porcentaje}%">
                    </div>

                </div>

                <span class="valor-barra">
                    $${total.toFixed(2)}
                </span>
            `;

            graficoCategorias.appendChild(elemento);
        }
    );
}


// ===============================
// INICIAR APLICACIÓN
// ===============================

guardarMovimientos();

mostrarMovimientos();

actualizarResumen();

actualizarEstadisticas();
// Inicializar modo oscuro después de cargar UI
initModoOscuro();

// Establecer fecha por defecto en el formulario (hoy)
try {
    if (fecha) {
        const hoy = new Date().toISOString().slice(0, 10);
        fecha.value = hoy;
    }
} catch (e) {
    console.warn('No se pudo establecer la fecha por defecto:', e);
}

// ====== EDICIÓN ======
function iniciarEdicion(id) {
    const mov = movimientos.find(m => m.id === id);
    if (!mov) return;

    editId = id;
    descripcion.value = mov.descripcion || '';
    monto.value = mov.monto || '';
    tipo.value = mov.tipo || 'gasto';
    categoria.value = mov.categoria || '';
    if (fecha) fecha.value = mov.fecha ? mov.fecha : new Date().toISOString().slice(0,10);

    if (btnAgregar) btnAgregar.textContent = 'Guardar cambios';
    if (btnCancelar) btnCancelar.hidden = false;
    // scroll al formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

if (btnCancelar) {
    btnCancelar.addEventListener('click', () => {
        editId = null;
        formulario.reset();
        if (fecha) fecha.value = new Date().toISOString().slice(0,10);
        if (btnAgregar) btnAgregar.textContent = '+ Agregar movimiento';
        btnCancelar.hidden = true;
    });
}

// Exponer iniciarEdicion en el scope global para usar onclick inline
window.iniciarEdicion = iniciarEdicion;