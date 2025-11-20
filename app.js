// URL CSV IZUMI (URL original proporcionada)
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRNGCPSH5C80N8aS9rAbIqlTsrKHF5lGxy5yvGa9ek0WVL7Rjit6EQiZEk2736TV1gbPJKaSvlrxu-z/pub?gid=1981062211&single=true&output=csv";

const IMG_PATH = "img/";

// Define el intervalo de actualización en milisegundos (30 segundos)
const INTERVALO_ACTUALIZACION = 30000; 

let items = [];
let filtrados = [];
let tipos = [];
let categoriasPorTipo = {};
// Banderas para asegurar que los listeners de change se adjunten una sola vez
let tipoListenerAttached = false;
let categoriaListenerAttached = false;

// Normalización anti-NaN
function normalizarPrecio(valor) {
    if (!valor) return 0;
    let limpio = String(valor).replace(/[^0-9]/g, "").trim();
    return Number(limpio) || 0;
}

// ------------------------------------------------------------------
// 🍣 CARGAR CSV (función principal de actualización)
// ------------------------------------------------------------------
async function cargarMenu() {
    // Guardamos los valores seleccionados actuales antes de la recarga
    const tipoSelect = document.getElementById("tipoSelect");
    const catSelect = document.getElementById("categoriaSelect");
    const selectedTipo = tipoSelect ? tipoSelect.value : '';
    const selectedCat = catSelect ? catSelect.value : '';

    try {
        // Añadir Date.now() a la URL para evitar la caché de los datos CSV
        const res = await fetch(SHEET_URL + "&t=" + Date.now(), { cache: "no-store" });
        
        if (!res.ok) {
            throw new Error(`Error al cargar el menú (HTTP ${res.status}): Verifica la URL.`);
        }

        const csv = await res.text();
        const parsed = Papa.parse(csv, { header: true });

        items = parsed.data
            .filter(row => row.nombre && row.tipo) // aseguramos datos válidos
            .map(row => ({
                tipo: (row.tipo || "").trim().toLowerCase(),
                categoria: (row.categoria || "").trim(),
                nombre: (row.nombre || "").trim(),
                precio: normalizarPrecio(row.precio),
                descripcion: (row.descripcion || "").trim(),
                imagen: (row.imagen || "").trim(),
            }));

        // Sacamos tipos únicos
        tipos = [...new Set(items.map(i => i.tipo))];

        // Armamos categorías por tipo
        categoriasPorTipo = {}; // Limpiar antes de rellenar
        tipos.forEach(t => {
            categoriasPorTipo[t] = [...new Set(items.filter(i => i.tipo === t).map(i => i.categoria))];
        });

        // Renderizar y restaurar la selección
        renderTipoSelect(selectedTipo, selectedCat);
    } catch (error) {
        console.error("❌ Fallo en la carga del menú:", error);
        const cont = document.getElementById("menu");
        if (cont) {
            cont.innerHTML = "<p class='error-mensaje'>No se pudo cargar el menú. Por favor, verifica la conexión.</p>";
        }
    }
}

// ------------------------------------------------------------------
// 🍣 RENDER SELECT TIPO
// ------------------------------------------------------------------
function renderTipoSelect(selectedTipo = '', selectedCat = '') {
    const tipoSelect = document.getElementById("tipoSelect");
    if (!tipoSelect) return;

    tipoSelect.innerHTML = `<option value="">Elegí tipo</option>` +
        tipos.map(t => `<option value="${t}">${capitalizar(t)}</option>`).join("");
    
    // Restaurar la selección
    tipoSelect.value = selectedTipo;
    
    // Adjuntar listener SÓLO una vez
    if (!tipoListenerAttached) {
        tipoSelect.addEventListener("change", () => {
            const tipo = tipoSelect.value;
            renderCategoriaSelect(tipo);
            limpiarSecciones();
        });
        tipoListenerAttached = true;
    }

    // Si había un tipo seleccionado, re-renderizar la categoría
    renderCategoriaSelect(selectedTipo, selectedCat);
}

// ------------------------------------------------------------------
// 🍣 RENDER SELECT CATEGORÍA
// ------------------------------------------------------------------
function renderCategoriaSelect(tipo, selectedCat = "") {
    const catSelect = document.getElementById("categoriaSelect");
    if (!catSelect) return;

    catSelect.innerHTML = "";

    if (!tipo) {
        catSelect.innerHTML = `<option value="">Elegí categoría</option>`;
        return;
    }

    const categorias = categoriasPorTipo[tipo];

    catSelect.innerHTML = `<option value="">Elegí categoría</option>` +
        categorias.map(c => `<option value="${c}">${c}</option>`).join("");

    // Restaurar la selección
    catSelect.value = selectedCat;

    // Adjuntar listener SÓLO una vez
    if (!categoriaListenerAttached) {
        catSelect.addEventListener("change", () => {
            mostrarCategoria(catSelect.value);
        });
        categoriaListenerAttached = true;
    }

    // Mostrar el menú si había una categoría seleccionada (después de la recarga)
    if (selectedCat) {
        mostrarCategoria(selectedCat);
    }
}

// ------------------------------------------------------------------
// 🍣 Funciones Auxiliares
// ------------------------------------------------------------------
function limpiarSecciones() {
    document.getElementById("menu").innerHTML = "";
}

// Muestra la categoría elegida
function mostrarCategoria(cat) {
    const cont = document.getElementById("menu");
    cont.innerHTML = "";

    if (!cat) return;

    const filtrados = items.filter(i => i.categoria === cat);

    // 1. Crear el contenedor principal de la categoría
    cont.innerHTML = `
        <div class="cat-section">
            <h2 class="categoria-titulo">${cat}</h2>
            <div class="grid" id="grid-${CSS.escape(cat)}"></div> 
        </div>
    `;
    
    // 2. Seleccionar el grid y construir las tarjetas con append/insertAdjacentHTML
    const grid = document.getElementById(`grid-${CSS.escape(cat)}`);
    let cardsHTML = '';

    filtrados.forEach(i => {
        const tieneImg = i.imagen && i.imagen.length > 2;
        const formattedPrice = i.precio.toLocaleString("es-AR", { minimumFractionDigits: 0 });

        cardsHTML += `
            <div class="card">
                ${tieneImg ? `<img src="${IMG_PATH + i.imagen}" alt="${i.nombre}" onerror="this.remove()">` : ""}
                <div class="texto">
                    <h3>${i.nombre}</h3>
                    <p>${i.descripcion}</p>
                    <div class="precio">$${formattedPrice}</div>
                </div>
            </div>
        `;
    });
    
    // 3. Insertar todas las tarjetas en el grid de una sola vez.
    if (grid) {
        grid.innerHTML = cardsHTML;
    }
}

// Capitaliza primera letra (para tipo)
function capitalizar(t) {
    return t.charAt(0).toUpperCase() + t.slice(1);
}

// ------------------------------------------------------------------
// 🚀 INICIALIZACIÓN Y RECARGA
// ------------------------------------------------------------------

// 1. Carga inicial
cargarMenu();

// 2. Configurar la recarga periódica cada 30 segundos
setInterval(cargarMenu, INTERVALO_ACTUALIZACION);
