// === Utilidades ===
function parseCSV(text) {
  const rows = [];
  let row = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(cur);
      cur = '';
    } else if (char === '\n' && !inQuotes) {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = '';
    } else {
      cur += char;
    }
  }
  if (cur.length > 0 || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

// === Estado global ===
let imagenesActuales = [];
let indiceActual = 0;
let carrito = [];
let filtroActivo = "todos"; // para combinar con buscador
let datosCargados = [];     // cache de productos para re-render si hiciera falta

// === Render de productos desde Google Sheets CSV ===
async function cargarMenu() {
  const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRo63knchlh1UGmOW3GMpBloAvQBU4mp7N38up2iXRIZg81SgSqyUCdzR7gWoH1JzxNMDnqxzsqboOu/pub?output=csv";
  try {
    const response = await fetch(url);
    const data = await response.text();
    const filas = parseCSV(data);
    const contenedor = document.getElementById("menu");
    if (!contenedor) return;

    contenedor.innerHTML = "";
    datosCargados = [];

    for (let i = 1; i < filas.length; i++) {
      const fila = filas[i];
      if (fila.length < 6) continue;

      const producto = (fila[0] || '').trim();
      const precio = (fila[1] || '').trim();
      const imagenesRaw = (fila[2] || '').trim();
      const estado = ((fila[3] || '').trim() || 'disponible').toLowerCase();
      const descripcion = (fila[4] || '').trim();
      const categoria = (fila[5] || 'otros').trim().toLowerCase();

      if (!producto || estado !== "disponible") continue;

      let imagenes = imagenesRaw.includes(";")
        ? imagenesRaw.split(";").map(u => u.trim()).filter(Boolean)
        : imagenesRaw.split(",").map(u => u.trim()).filter(Boolean);

      if (imagenes.length === 0) {
        imagenes = ["https://via.placeholder.com/600x400?text=Sin+imagen"];
      }

      const item = document.createElement("div");
      item.className = "item";
      item.dataset.categoria = categoria;
      item.dataset.producto = producto.toLowerCase();
      item.dataset.descripcion = descripcion.toLowerCase();
      item.dataset.precio = precio;
      item.innerHTML = `
        <img src="${imagenes[0]}" alt="${producto}" loading="lazy">
        <h2>${producto}</h2>
        <p>Precio: $${precio}</p>
        <div class="acciones">
          <button class="addCarrito">Agregar al carrito</button>
          <a href="https://wa.me/549XXXXXXXXXX?text=${encodeURIComponent('Quiero pedir ' + producto)}" target="_blank" rel="noopener">Pedir por WhatsApp</a>
        </div>
      `;

      item.querySelector(".addCarrito").onclick = (e) => {
        e.stopPropagation();
        agregarAlCarrito(producto, precio);
      };
      item.onclick = () => abrirModal(producto, precio, descripcion, imagenes);
      contenedor.appendChild(item);

      // Guardar en caché por si se desea re-render
      datosCargados.push({ producto, precio, descripcion, categoria, imagenes });
    }
  } catch (error) {
    console.error("Error al cargar la carta:", error);
    const menu = document.getElementById("menu");
    if (menu) {
      menu.innerHTML = "<p>No se pudo cargar la carta. Intentá más tarde.</p>";
    }
  }
}

// === Modal de producto ===
function abrirModal(producto, precio, descripcion, imagenes) {
  imagenesActuales = imagenes;
  indiceActual = 0;

  const imgEl = document.getElementById("imagenModal");
  const tituloEl = document.getElementById("tituloModal");
  const precioEl = document.getElementById("precioModal");
  const descEl = document.getElementById("descripcionModal");
  const wppEl = document.getElementById("whatsappModal");
  const modal = document.getElementById("modal");
  const modalContent = document.querySelector(".modal-content");

  if (!imgEl || !tituloEl || !precioEl || !descEl || !wppEl || !modal || !modalContent) return;

  imgEl.src = imagenesActuales[indiceActual];
  imgEl.alt = producto;
  tituloEl.textContent = producto;
  precioEl.textContent = `Precio: $${precio}`;
  descEl.textContent = descripcion || '';
  wppEl.href = `https://wa.me/549XXXXXXXXXX?text=${encodeURIComponent('Quiero pedir ' + producto)}`;

  // Agregar botón "Agregar al carrito" dentro del modal (si no existe)
  let btnModal = document.getElementById("addCarritoModal");
  if (!btnModal) {
    btnModal = document.createElement("button");
    btnModal.id = "addCarritoModal";
    btnModal.textContent = "Agregar al carrito";
    btnModal.className = "addCarrito";
    // Insertar antes del botón de WhatsApp
    wppEl.parentNode.insertBefore(btnModal, wppEl);
  }
  btnModal.onclick = () => agregarAlCarrito(producto, precio);

  modal.style.display = "block";
  modal.setAttribute("aria-hidden", "false");
  modalContent.classList.remove("animarModal"); // reset animación
  // Forzar reflow y aplicar animación
  void modalContent.offsetWidth;
  modalContent.classList.add("animarModal");
}

function cerrarModal() {
  const modal = document.getElementById("modal");
  if (!modal) return;
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
}

// Controles modal producto
const cerrarBtn = document.getElementById("cerrar");
if (cerrarBtn) cerrarBtn.onclick = cerrarModal;

const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
if (prevBtn) {
  prevBtn.onclick = () => {
    if (imagenesActuales.length === 0) return;
    indiceActual = (indiceActual - 1 + imagenesActuales.length) % imagenesActuales.length;
    const imgEl = document.getElementById("imagenModal");
    if (imgEl) imgEl.src = imagenesActuales[indiceActual];
  };
}
if (nextBtn) {
  nextBtn.onclick = () => {
    if (imagenesActuales.length === 0) return;
    indiceActual = (indiceActual + 1) % imagenesActuales.length;
    const imgEl = document.getElementById("imagenModal");
    if (imgEl) imgEl.src = imagenesActuales[indiceActual];
  };
}

const modalEl = document.getElementById("modal");
if (modalEl) {
  modalEl.addEventListener("click", (e) => {
    if (e.target.id === "modal") cerrarModal();
  });
}

const imagenModalEl = document.getElementById("imagenModal");
if (imagenModalEl) {
  imagenModalEl.onclick = () => {
    imagenModalEl.classList.toggle("zoomed");
  };
}

// === Menú flotante negocio ===
const menuBtn = document.getElementById("menuBtn");
const cerrarMenu = document.getElementById("cerrarMenu");
if (menuBtn) {
  menuBtn.onclick = () => {
    const mf = document.getElementById("menuFlotante");
    if (mf) mf.classList.remove("oculto");
  };
}
if (cerrarMenu) {
  cerrarMenu.onclick = () => {
    const mf = document.getElementById("menuFlotante");
    if (mf) mf.classList.add("oculto");
  };
}

// === Filtros de categoría con estado activo ===
document.querySelectorAll(".filtro-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const categoria = btn.dataset.categoria || "todos";
    filtroActivo = categoria;

    document.querySelectorAll(".filtro-btn").forEach(b => b.classList.remove("activo"));
    btn.classList.add("activo");

    aplicarFiltroYBusqueda();
  });
});

// === Buscador mejorado (nombre + categoría + descripción) ===
const buscador = document.getElementById("buscador");
if (buscador) {
  buscador.addEventListener("input", () => {
    aplicarFiltroYBusqueda();
  });
}

// Combinar filtro de categoría con texto del buscador
function aplicarFiltroYBusqueda() {
  const texto = (document.getElementById("buscador")?.value || "").toLowerCase();

  document.querySelectorAll(".item").forEach(item => {
    const nombre = item.dataset.producto || "";
    const categoria = item.dataset.categoria || "";
    const descripcion = item.dataset.descripcion || "";

    const coincideBusqueda =
      !texto ||
      nombre.includes(texto) ||
      categoria.includes(texto) ||
      descripcion.includes(texto);

    const coincideCategoria =
      filtroActivo === "todos" || categoria === filtroActivo;

    item.style.display = (coincideBusqueda && coincideCategoria) ? "flex" : "none";
  });
}

// === Carrito flotante con modal ===
function agregarAlCarrito(producto, precio) {
  const precioNum = parseFloat((precio || "0").toString().replace(",", ".")) || 0;
  carrito.push({ producto, precio: precioNum });
  actualizarCarritoModal();
  // Feedback visual opcional: vibrar o animar botón carrito si existe
  const btn = document.getElementById("abrirCarrito");
  if (btn) {
    btn.classList.add("pulse");
    setTimeout(() => btn.classList.remove("pulse"), 300);
  }
}

function actualizarCarritoModal() {
  const lista = document.getElementById("carritoLista");
  const totalEl = document.getElementById("carritoTotal");
  if (!lista || !totalEl) return;

  lista.innerHTML = carrito.map((p, i) => `
    <li>
      ${p.producto} - $${p.precio.toFixed(2)}
      <button class="quitar" data-index="${i}">✕</button>
    </li>
  `).join("");

  const total = carrito.reduce((acc, p) => acc + p.precio, 0);
  totalEl.textContent = `Total: $${total.toFixed(2)}`;

  // Quitar ítems del carrito
  lista.querySelectorAll(".quitar").forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.dataset.index, 10);
      if (!isNaN(idx)) {
        carrito.splice(idx, 1);
        actualizarCarritoModal();
      }
    };
  });
}

// Abrir/cerrar modal de carrito
const abrirCarritoBtn = document.getElementById("abrirCarrito");
const modalCarrito = document.getElementById("modalCarrito");
const cerrarCarritoBtn = document.getElementById("cerrarCarrito");

if (abrirCarritoBtn && modalCarrito) {
  abrirCarritoBtn.onclick = () => {
    modalCarrito.style.display = "block";
    modalCarrito.setAttribute("aria-hidden", "false");
  };
}
if (cerrarCarritoBtn && modalCarrito) {
  cerrarCarritoBtn.onclick = () => {
    modalCarrito.style.display = "none";
    modalCarrito.setAttribute("aria-hidden", "true");
  };
}
if (modalCarrito) {
  modalCarrito.addEventListener("click", (e) => {
    if (e.target.id === "modalCarrito") {
      modalCarrito.style.display = "none";
      modalCarrito.setAttribute("aria-hidden", "true");
    }
  });
}

// Enviar carrito por WhatsApp
const enviarCarritoBtn = document.getElementById("enviarCarrito");
if (enviarCarritoBtn) {
  enviarCarritoBtn.onclick = () => {
    if (carrito.length === 0) {
      alert("El carrito está vacío");
      return;
    }
    const mensaje = carrito.map(p => `${p.producto} - $${p.precio.toFixed(2)}`).join(", ");
    window.open(`https://wa.me/549XXXXXXXXXX?text=${encodeURIComponent("Quiero pedir: " + mensaje)}`, "_blank");
  };
}

// === Modo oscuro/claro con persistencia ===
const toggleModo = document.getElementById("toggleModo");
if (localStorage.getItem("modo") === "oscuro") {
  document.body.classList.add("oscuro");
}
if (toggleModo) {
  toggleModo.onclick = () => {
    document.body.classList.toggle("oscuro");
    localStorage.setItem("modo", document.body.classList.contains("oscuro") ? "oscuro" : "claro");
  };
}

// === Inicializar ===
cargarMenu();
