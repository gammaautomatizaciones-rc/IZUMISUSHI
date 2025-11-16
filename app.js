// URL CSV IZUMI
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRNGCPSH5C80N8aS9rAbIqlTsrKHF5lGxy5yvGa9ek0WVL7Rjit6EQiZEk2736TV1gbPJKaSvlrxu-z/pub?gid=1981062211&single=true&output=csv";

const IMG_PATH = "img/";

let items = [];
let filtrados = [];
let tipos = [];
let categoriasPorTipo = {};

// Normalización anti-NaN
function normalizarPrecio(valor) {
    if (!valor) return 0;
    let limpio = String(valor).replace(/[^0-9]/g, "").trim();
    return Number(limpio) || 0;
}

// Cargar CSV
async function cargarMenu() {
    const res = await fetch(SHEET_URL);
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
    tipos.forEach(t => {
        categoriasPorTipo[t] = [...new Set(items.filter(i => i.tipo === t).map(i => i.categoria))];
    });

    renderTipoSelect();
}

// Render Select Tipo
function renderTipoSelect() {
    const tipoSelect = document.getElementById("tipoSelect");
    tipoSelect.innerHTML = `<option value="">Elegí tipo</option>` +
        tipos.map(t => `<option value="${t}">${capitalizar(t)}</option>`).join("");

    tipoSelect.addEventListener("change", () => {
        const tipo = tipoSelect.value;
        renderCategoriaSelect(tipo);
        limpiarSecciones();
    });
}

// Render Select Categoría según tipo
function renderCategoriaSelect(tipo) {
    const catSelect = document.getElementById("categoriaSelect");
    catSelect.innerHTML = "";

    if (!tipo) {
        catSelect.innerHTML = `<option value="">Elegí categoría</option>`;
        return;
    }

    const categorias = categoriasPorTipo[tipo];

    catSelect.innerHTML = `<option value="">Elegí categoría</option>` +
        categorias.map(c => `<option value="${c}">${c}</option>`).join("");

    catSelect.addEventListener("change", () => {
        mostrarCategoria(catSelect.value);
    });
}

function limpiarSecciones() {
    document.getElementById("menu").innerHTML = "";
}

// Muestra la categoría elegida
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

        grid.innerHTML += `
            <div class="card">
                ${tieneImg ? `<img src="${IMG_PATH + i.imagen}" onerror="this.remove()">` : ""}
                <div class="texto">
                    <h3>${i.nombre}</h3>
                    <p>${i.descripcion}</p>
                    <div class="precio">$${i.precio.toLocaleString("es-AR")}</div>
                </div>
            </div>
        `;
    });
}

// Capitaliza primera letra (para tipo)
function capitalizar(t) {
    return t.charAt(0).toUpperCase() + t.slice(1);
}
function mostrarTodo() {
    const cont = document.getElementById("menu");
    cont.innerHTML = "";

    // Agrupo los ítems por categoría
    const categorias = [...new Set(items.map(i => i.categoria))];

    categorias.forEach(cat => {
        const filtrados = items.filter(i => i.categoria === cat);

        cont.innerHTML += `
            <div class="cat-section">
                <h2 class="categoria-titulo">${cat}</h2>
                <div class="grid grid-${cat}"></div>
            </div>
        `;

        const grid = cont.querySelector(`.grid-${CSS.escape(cat)}`);

        filtrados.forEach(i => {
            const tieneImg = i.imagen && i.imagen.length > 2;

            grid.innerHTML += `
                <div class="card">
                    ${tieneImg ? `<img src="${IMG_PATH + i.imagen}" onerror="this.remove()">` : ""}
                    <div class="texto">
                        <h3>${i.nombre}</h3>
                        <p>${i.descripcion}</p>
                        <div class="precio">$${i.precio.toLocaleString("es-AR")}</div>
                    </div>
                </div>
            `;
        });
    });
}

cargarMenu();
