// === IMPORTAR DEPENDENCIAS ===
import {
  URL_MENU_CSV,
  imagenesActuales,
  indiceActual,
  carrito,
  filtroActivo,
  datosCargados,
  setImagenesActuales,
  setIndiceActual,
  setFiltroActivo,
  setDatosCargados
} from "./config.js";

import { parseCSV } from "./utils.js";

// ====================================================
// ============ CARGA DEL MENÚ ========================
// ====================================================
async function cargarMenu() {
  try {
    const response = await fetch(URL_MENU_CSV);
    const data = await response.text();
    const filas = parseCSV(data);

    const contenedor = document.getElementById("menu");
    if (!contenedor) return;

    contenedor.innerHTML = "";
    setDatosCargados([]);

    for (let i = 1; i < filas.length; i++) {
      const fila = filas[i];
      if (!fila || fila.length < 6) continue;

      const producto = (fila[0] || "").trim();
      const precio = (fila[1] || "").trim();
      const imagenesRaw = (fila[2] || "").trim();
      const estado = ((fila[3] || "").trim().toLowerCase() || "disponible");
      const descripcion = (fila[4] || "").trim();
      const categoria = (fila[5] || "").trim().toLowerCase();

      if (!producto || estado !== "disponible") continue;

      let imagenes =
        imagenesRaw.includes(";")
          ? imagenesRaw.split(";").map(x => x.trim()).filter(Boolean)
          : imagenesRaw.split(",").map(x => x.trim()).filter(Boolean);

      if (imagenes.length === 0) {
        imagenes = ["https://via.placeholder.com/600x400?text=Sin+imagen"];
      }

      // Crear item
      const item = document.createElement("div");
      item.className = "item";
      item.dataset.categoria = categoria;
      item.dataset.producto = producto.toLowerCase();
      item.dataset.descripcion = descripcion.toLowerCase();
      item.dataset.precio = precio;

      // → MENSAJE INDIVIDUAL PARA WSP
      const mensajeWPP = encodeURIComponent(
        `Hola! Quiero pedir:\n${producto} – $${precio}`
      );

      item.innerHTML = `
        <img src="${imagenes[0]}" alt="${producto}" loading="lazy">
        <h2>${producto}</h2>
        <p>Precio: $${precio}</p>
        <div class="acciones">
          <button class="addCarrito">Agregar al carrito</button>
          <a href="https://wa.me/5493758556569?text=${mensajeWPP}" target="_blank" rel="noopener">Pedir por WhatsApp</a>
        </div>
      `;

      // Botón agregar desde la card
      item.querySelector(".addCarrito").onclick = (e) => {
        e.stopPropagation();
        agregarAlCarrito(producto, precio);
      };

      // Abrir modal producto
      item.onclick = () =>
        abrirModal(producto, precio, descripcion, imagenes);

      contenedor.appendChild(item);

      datosCargados.push({ producto, precio, descripcion, categoria, imagenes });
    }
  } catch (error) {
    console.error("Error al cargar menú:", error);
    document.getElementById("menu").innerHTML =
      "<p>No se pudo cargar la carta. Intentá más tarde.</p>";
  }
}

// ====================================================
// ========== MODAL PRODUCTO ===========================
// ====================================================
function abrirModal(producto, precio, descripcion, imagenes) {
  setImagenesActuales(imagenes);
  setIndiceActual(0);

  document.getElementById("imagenModal").src = imagenesActuales[indiceActual];
  document.getElementById("tituloModal").textContent = producto;
  document.getElementById("precioModal").textContent = `Precio: $${precio}`;
  document.getElementById("descripcionModal").textContent = descripcion || "";

  // → Mensaje individual
  const mensaje = encodeURIComponent(
    `Hola! Quiero pedir:\n${producto} – $${precio}`
  );

  document.getElementById("whatsappModal").href =
    `https://wa.me/5493758556569?text=${mensaje}`;

  // Guardamos datos para "Agregar al carrito"
  document.getElementById("addCarritoModal").dataset.producto = producto;
  document.getElementById("addCarritoModal").dataset.precio = precio;

  const modal = document.getElementById("modal");
  modal.style.display = "block";
  modal.setAttribute("aria-hidden", "false");
}

function cerrarModal() {
  const modal = document.getElementById("modal");
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
}

document.getElementById("cerrar")?.addEventListener("click", cerrarModal);

// Carrusel
document.getElementById("prev")?.addEventListener("click", () => {
  if (imagenesActuales.length === 0) return;
  setIndiceActual((indiceActual - 1 + imagenesActuales.length) % imagenesActuales.length);
  document.getElementById("imagenModal").src = imagenesActuales[indiceActual];
});

document.getElementById("next")?.addEventListener("click", () => {
  if (imagenesActuales.length === 0) return;
  setIndiceActual((indiceActual + 1) % imagenesActuales.length);
  document.getElementById("imagenModal").src = imagenesActuales[indiceActual];
});

// ====================================================
// ========== BOTÓN "AGREGAR AL CARRITO" DEL MODAL =====
// ====================================================
document.getElementById("addCarritoModal")?.addEventListener("click", () => {
  const btn = document.getElementById("addCarritoModal");
  agregarAlCarrito(btn.dataset.producto, btn.dataset.precio);
});

// ====================================================
// ================== FILTROS =========================
// ====================================================
document.querySelectorAll(".filtro-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    setFiltroActivo(btn.dataset.categoria || "todos");

    document.querySelectorAll(".filtro-btn").forEach((b) =>
      b.classList.remove("activo")
    );
    btn.classList.add("activo");

    aplicarFiltroYBusqueda();
  });
});

// Buscador
document.getElementById("buscador")?.addEventListener("input", aplicarFiltroYBusqueda);

function aplicarFiltroYBusqueda() {
  const texto = (document.getElementById("buscador").value || "").toLowerCase();

  document.querySelectorAll(".item").forEach((item) => {
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

    item.style.display =
      coincideBusqueda && coincideCategoria ? "flex" : "none";
  });
}

// ====================================================
// ================= CARRITO ==========================
// ====================================================
function agregarAlCarrito(producto, precio) {
  const precioNum = parseFloat((precio || "0").replace(",", ".")) || 0;
  carrito.push({ producto, precio: precioNum });
  actualizarCarritoModal();
}

function actualizarCarritoModal() {
  const lista = document.getElementById("carritoLista");
  const totalEl = document.getElementById("carritoTotal");

  let total = 0;

  lista.innerHTML = carrito
    .map((p, i) => {
      total += p.precio;
      return `
      <li>
        ${p.producto} - $${p.precio.toFixed(2)}
        <button class="quitar" data-index="${i}">✕</button>
      </li>
    `;
    })
    .join("");

  totalEl.textContent = `Total: $${total.toFixed(2)}`;

  lista.querySelectorAll(".quitar").forEach((btn) => {
    btn.onclick = () => {
      carrito.splice(btn.dataset.index, 1);
      actualizarCarritoModal();
    };
  });
}

// ====================================================
// ================= MODAL CARRITO =====================
// ====================================================
document.getElementById("abrirCarrito")?.addEventListener("click", () => {
  const modal = document.getElementById("modalCarrito");
  modal.style.display = "block";
  modal.setAttribute("aria-hidden", "false");
});

document.getElementById("cerrarCarrito")?.addEventListener("click", () => {
  const modal = document.getElementById("modalCarrito");
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
});

// ====================================================
// ========= ENVIAR CARRITO A WHATSAPP =================
// ====================================================
document.getElementById("enviarCarrito")?.addEventListener("click", () => {
  if (carrito.length === 0) return alert("El carrito está vacío");

  let mensaje = "Hola! Quiero hacer un pedido:\n\n";

  carrito.forEach(item => {
    mensaje += `• ${item.producto} – $${item.precio.toFixed(2)}\n`;
  });

  const total = carrito.reduce((acc, p) => acc + p.precio, 0);
  mensaje += `\nTotal: $${total.toFixed(2)}`;

  const url = `https://wa.me/5493758556569?text=${encodeURIComponent(mensaje)}`;

  window.open(url, "_blank");
});

// =========================
//  MODAL SUGERENCIAS
// =========================

const btnSuge = document.getElementById("btnSugerencias");
const modalSuge = document.getElementById("modalSugerencias");
const cerrarSuge = document.getElementById("cerrarSuge");

btnSuge.addEventListener("click", () => {
  modalSuge.classList.remove("oculto");
});

cerrarSuge.addEventListener("click", () => {
  modalSuge.classList.add("oculto");
});

// Cerrar al clickear fuera
modalSuge.addEventListener("click", (e) => {
  if (e.target === modalSuge) {
    modalSuge.classList.add("oculto");
  }
});


// ====================================================
// =============== MENÚ FLOTANTE (☰) ===================
// ====================================================
document.getElementById("menuBtn")?.addEventListener("click", () => {
  document.getElementById("menuFlotante").classList.remove("oculto");
});

document.getElementById("cerrarMenu")?.addEventListener("click", () => {
  document.getElementById("menuFlotante").classList.add("oculto");
});

// ====================================================
// ================ INICIAR ============================
// ====================================================
cargarMenu();
