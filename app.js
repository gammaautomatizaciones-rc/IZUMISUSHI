const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQGB-YIZg1GBDc312CNkTrrKtKOO5s7RkMh9qRjAG5Ez3Pq9Nokzb6ydvVayL7XFCmLKh66TaX_qI0S/pub?output=csv";
const IMG_PATH = "img/";

// Define el intervalo de actualización en milisegundos (ej: 30000ms = 30 segundos)
const INTERVALO_ACTUALIZACION = 30000; 

let items = [];
let filtrados = [];
let selectHandlerAttached = false; // Bandera para asegurar que el listener del select se adjunte solo una vez

// ... (El resto de tu código de Papa Parse y la inclusión de la librería se mantiene igual)

/**
 * 🍕 CARGAR CSV EN TIEMPO REAL
 * Obtiene el CSV, lo parsea y llama a renderMenu.
 */
async function cargarMenu() {
    try {
        console.log("Cargando menú desde Google Sheets...");
        // Usamos un timestamp para forzar la no-cache de los datos.
        const res = await fetch(SHEET_URL + "&t=" + Date.now(), { cache: "no-store" });
        
        if (!res.ok) {
            throw new Error(`Error al cargar el menú (HTTP ${res.status}): Asegúrate que la hoja esté publicada.`);
        }

        const csv = await res.text();
        const parsed = Papa.parse(csv, { header: true });

        items = parsed.data
            .filter(row => (row.categoria || "").trim() && (row.nombre || "").trim())
            .map(row => ({
                categoria: (row.categoria || "").trim(),
                nombre: (row.nombre || "").trim(),
                precio: (row.precio || "").trim(),
                descripcion: (row.descripcion || "").trim(),
                imagen: (row.imagen || "").trim(),
                destacado: (row.destacado || "").trim().toLowerCase() === "si"
            }));

        filtrados = items;

        renderMenu();

    } catch (error) {
        console.error("❌ Fallo al obtener o parsear el menú:", error);
        const cont = document.getElementById("menu");
        if (cont) {
            cont.innerHTML = "<p class='error-mensaje'>No se pudo cargar el menú. Por favor, verifica la conexión.</p>";
        }
    }
}

/**
 * 🍔 FUNCIÓN DE RENDERIZADO
 */
function renderMenu() {
    const cont = document.getElementById("menu");
    if (!cont) return;
    
    // Guardamos el valor seleccionado antes de borrar el HTML
    const select = document.getElementById("categoriaSelect");
    const selectedValue = select ? select.value : '';

    cont.innerHTML = "";

    const categorias = [...new Set(filtrados.map(i => i.categoria).filter(c => c))];

    // Re-renderizar las opciones del select
    if (select) {
        select.innerHTML = "<option value=''>Elegí una categoría</option>" +
            categorias.map(c => `<option value="${c}">${c}</option>`).join("");
            
        // Restaurar el valor seleccionado
        select.value = selectedValue;

        // Adjuntar el listener SÓLO una vez
        if (!selectHandlerAttached) {
            select.addEventListener("change", handleCategoryChange);
            selectHandlerAttached = true;
        }
    }

    // ... (El resto de la lógica de renderizado de las tarjetas sigue aquí) ...
    // Nota: Por brevedad, he omitido el bucle de renderizado, pero debe ser el que ya tienes.

    categorias.forEach(cat => {
        const cleanID = cat
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^\w\-]/g, "");

        // 1. Crear la estructura de la sección
        const sectionHTML = `
            <div class='cat-section' id='sec-${cleanID}' style='display:none;'>
                <h2 class='categoria-titulo'>${cat}</h2>
                <div class='grid'></div>
            </div>
        `;
        // Usar insertAdjacentHTML para evitar re-renderizar todo el DOM del grid cada vez
        cont.insertAdjacentHTML('beforeend', sectionHTML);

        const grid = document.querySelector(`#sec-${cleanID} .grid`);

        if (grid) {
            // 2. Llenar el grid
            filtrados
                .filter(i => i.categoria === cat)
                .forEach(i => {
                    const imgHTML = i.imagen
                        ? `<img src="${IMG_PATH}${i.imagen}" alt="${i.nombre}" onerror="this.style.display='none'">`
                        : "";
                    
                    const priceValue = Number(i.precio || 0);
                    const formattedPrice = isNaN(priceValue) ? 'Consultar' : priceValue.toLocaleString("es-AR", { minimumFractionDigits: 0 });

                    grid.innerHTML += `
                        <div class='card ${i.destacado ? 'destacado' : ''}'>
                            ${imgHTML}
                            <div class='texto'>
                                <h3>${i.nombre}</h3>
                                <p>${i.descripcion}</p>
                                <div class='precio'>$${formattedPrice}</div>
                            </div>
                        </div>
                    `;
                });
        }
        
        // Mostrar la categoría que estaba seleccionada antes de la actualización
        if (select && cleanID === selectedValue.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\-]/g, "")) {
            document.getElementById("sec-" + cleanID).style.display = "block";
        }
    });
    
    // Función de manejo del evento de cambio del selector (separada para el listener único)
    function handleCategoryChange() {
        const cat = select.value;
        
        document.querySelectorAll(".cat-section").forEach(sec => sec.style.display = "none");

        if (!cat) return;
        
        const cleanID = cat
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^\w\-]/g, "");

        const section = document.getElementById("sec-" + cleanID);
        if (section) {
            section.style.display = "block";
        }
    }
}


// ------------------------------------------------------------------
// 🚀 INICIALIZACIÓN Y ACTUALIZACIÓN AUTOMÁTICA
// ------------------------------------------------------------------

// 1. Carga inicial
cargarMenu();

// 2. Configurar la recarga periódica
setInterval(cargarMenu, INTERVALO_ACTUALIZACION);

