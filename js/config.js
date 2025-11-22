// === CONFIGURACIÓN Y ESTADO GLOBAL ===

// URL del menú (Google Sheets CSV)
// Asegurate de que este link sea el correcto de TU hoja
export const URL_MENU_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRo63knchlh1UGmOW3GMpBloAvQBU4mp7N38up2iXRIZg81SgSqyUCdzR7gWoH1JzxNMDnqxzsqboOu/pub?output=csv";

// === Estados globales ===
export let imagenesActuales = [];
export let indiceActual = 0;
export let carrito = [];
export let filtroActivo = "todos";
export let datosCargados = [];

// === Setters ===
export function setImagenesActuales(arr) { imagenesActuales = arr; }
export function setIndiceActual(n) { indiceActual = n; }
export function setFiltroActivo(v) { filtroActivo = v; }
export function setDatosCargados(v) { datosCargados = v; }
