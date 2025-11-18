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

async function cargarMenu() {
  const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRo63knchlh1UGmOW3GMpBloAvQBU4mp7N38up2iXRIZg81SgSqyUCdzR7gWoH1JzxNMDnqxzsqboOu/pub?output=csv";
  try {
    const response = await fetch(url);
    const data = await response.text();
    const filas = parseCSV(data);
    const contenedor = document.getElementById("menu");

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
      item.innerHTML = `
        <img src="${imagenes[0]}" alt="${producto}">
        <h2>${producto}</h2>
        <p>Precio: $${precio}</p>
        <a href="https://wa.me/549XXXXXXXXXX?text=${encodeURIComponent('Quiero pedir ' + producto)}">Pedir por WhatsApp</a>
      `;
      item.onclick = () => abrirModal(producto, precio, descripcion, imagenes);
      contenedor.appendChild(item);
    }
  } catch (error) {
    console.error("Error al cargar la carta:", error);
    document.getElementById("menu").innerHTML = "<p>No se pudo cargar la carta. Intentá más tarde.</p>";
  }
}

let imagenesActuales = [];
let indiceActual = 0;

function abrirModal(producto, precio, descripcion, imagenes) {
  imagenesActuales = imagenes;
  indiceActual = 0;

  document.getElementById("imagenModal").src = imagenesActuales[indiceActual];
  document.getElementById("imagenModal").alt = producto;
  document.getElementById("tituloModal").textContent = producto;
  document.getElementById("precioModal").textContent = `Precio: $${precio}`;
  document.getElementById("descripcionModal").textContent = descripcion || '';
  document.getElementById("whatsappModal").href = `https://wa.me/549XXXXXXXXXX?text=${encodeURIComponent('Quiero pedir ' + producto)}`;

  document.getElementById("modal").style.display = "block";
  document.getElementById("modal").setAttribute("aria-hidden", "false");
}

function cerrarModal() {
  document.getElementById("modal").style.display = "none";
  document.getElementById("modal").setAttribute("aria-hidden", "true");
}

document.getElementById("cerrar").onclick = cerrarModal;

document.getElementById("prev").onclick = () => {
  if (imagenesActuales.length === 0) return;
  indiceActual = (indiceActual - 1 + imagenesActuales.length) % imagenesActuales.length;
  document.getElementById("imagenModal").src = imagenesActuales[indiceActual];
};

document.getElementById("next").onclick = () => {
  if (imagenesActuales.length === 0) return;
  indiceActual = (indiceActual + 1) % imagenesActuales.length;
  document.getElementById("imagenModal").src = imagenesActuales[indiceActual];
};

document.getElementById("modal").addEventListener("click", (e) => {
  if (e.target.id === "modal") cerrarModal();
});

document.getElementById("imagenModal").onclick = () => {
  document.getElementById("imagenModal").classList.toggle("zoomed");
};

document.getElementById("menuBtn").onclick = () => {
  document.getElementById("menuFlotante").classList.remove("oculto");
};

document.getElementById("cerrarMenu").onclick = () => {
  document.getElementById("menuFlotante").classList.add("oculto");
};

// Filtros con botón activo
document.querySelectorAll(".filtro-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const categoria = btn.dataset.categoria;

    // Marcar botón activo
    document.querySelectorAll(".filtro-btn").forEach(b => b.classList.remove("activo"));
    btn.classList.add("activo");

    // Mostrar/ocultar productos
    document.querySelectorAll(".item").forEach(item => {
      item.style.display = (categoria === "todos" || item.dataset.categoria === categoria)
        ? "flex"
        : "none";
    });
  });
});

cargarMenu();
