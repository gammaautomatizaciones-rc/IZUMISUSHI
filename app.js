// URL CSV IZUMI
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRNGCPSH5C80N8aS9rAbIqlTsrKHF5lGxy5yvGa9ek0WVL7Rjit6EQiZEk2736TV1gbPJKaSvlrxu-z/pub?gid=1981062211&single=true&output=csv";
const IMG_PATH = "img/";

// Define el intervalo de actualización en milisegundos (30 segundos)
const INTERVALO_ACTUALIZACION = 30000; 

let items = [];
let filtrados = [];
let tipos = [];
let categoriasPorTipo = {};
// Bandera para asegurar que los listeners de change se adjunten una sola vez
let listenersAttached = false; 

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

        renderTipoSelect(true); // Pasar 'true' para indicar que es una recarga
    } catch (error) {
        console.error("❌ Fallo en la carga del menú:", error);
    }
}

// ------------------------------------------------------------------
// 🍣 RENDER SELECT TIPO
// ------------------------------------------------------------------
function renderTipoSelect(isReload = false) {
    const tipoSelect = document.getElementById("tipoSelect");
    const catSelect = document.getElementById("categoriaSelect");
    
    // Guardar los valores seleccionados para restaurarlos
    const selectedTipo = isReload ? tipoSelect.value : '';
    const selectedCat = isReload ? catSelect.value : '';


    tipoSelect.innerHTML = `<option value="">Elegí tipo</option>` +
        tipos.map(t => `<option value="${t}">${capitalizar(t)}</option>`).join("");
    
    // Restaurar selección de tipo y actualizar categoría
    tipoSelect.value = selectedTipo;
    
    // Si ya se adjuntaron, no lo hagas de nuevo
    if (!listenersAttached) {
        tipoSelect.addEventListener("change", () => {
            const tipo = tipoSelect.value;
            renderCategoriaSelect(tipo);
            limpiarSecciones();
        });
    }

    // Si es una recarga, re-renderiza el select de categoría y muestra el menú
    if (isReload) {
        renderCategoriaSelect(selectedTipo, selectedCat);
    } else {
        // Renderizado inicial del select de categoría (vacío)
        renderCategoriaSelect("");
    }
}

// ------------------------------------------------------------------
// 🍣 RENDER SELECT CATEGORÍA
// ------------------------------------------------------------------
function renderCategoriaSelect(tipo, selectedCat = "") {
    const catSelect = document.getElementById("categoriaSelect");
    catSelect.innerHTML = "";

    if (!tipo) {
        catSelect.innerHTML = `<option value="">Elegí categoría</option>`;
        limpiarSecciones();
        return;
    }

    const categorias = categoriasPorTipo[tipo];

    catSelect.innerHTML = `<option value="">Elegí categoría</option>` +
        categorias.map(c => `<option value="${c}">${c}</option>`).join("");
    
    // Restaurar selección de categoría
    catSelect.value = selectedCat;

    // Adjuntar listener SÓLO una vez
    if (!listenersAttached) {
        catSelect.addEventListener("change", () => {
            mostrarCategoria(catSelect.value);
        });
        // Marcamos que los listeners de ambos selectores ya se adjuntaron
        listenersAttached = true; 
    }
    
    // Mostrar la categoría si había algo seleccionado
    if (selectedCat) {
        mostrarCategoria(selectedCat);
    }
}

function limpiarSecciones() {
    document.getElementById("menu").innerHTML = "";
}

// ------------------------------------------------------------------
// 🍣 Muestra la categoría elegida
// ------------------------------------------------------------------
function mostrarCategoria(cat) {
    const cont = document.getElementById("menu");
    cont.innerHTML = "";

    if (!cat) return;

    const filtrados = items.filter(i => i.categoria === cat);

    cont.innerHTML = `
        <div class="cat-section">
            <h2 class="categoria-titulo">${cat}</h2>
            <div class="grid"></div>
        </div>
    `;

    const grid = cont.querySelector(".grid");

    filtrados.forEach(i => {
        const tieneImg = i.imagen && i.imagen.length > 2;
        
        // El price ya es un Number gracias a normalizarPrecio()
        const formattedPrice = i.precio.toLocaleString("es-AR", { minimumFractionDigits: 0 });

        grid.innerHTML += `
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
}

// ------------------------------------------------------------------
// 🍣 Código de Ayuda
// ------------------------------------------------------------------
function capitalizar(t) {
    return t.charAt(0).toUpperCase() + t.slice(1);
}

// La función 'mostrarTodo' fue eliminada ya que no se usa en la lógica de selección por Tipo/Categoría.
// La dejo comentada por si la necesitas:
/*
function mostrarTodo() {
    // ... (código original de mostrarTodo) ...
}
*/

// ------------------------------------------------------------------
// 🚀 INICIALIZACIÓN Y RECARGA
// ------------------------------------------------------------------

// 1. Carga inicial
cargarMenu();

// 2. Configurar la recarga periódica cada 30 segundos
setInterval(cargarMenu, INTERVALO_ACTUALIZACION);
