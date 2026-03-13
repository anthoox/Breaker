/**
 * BREAKER - Sistema de Gestión de Descansos con Persistencia
 * ---------------------------------------------------------
 * Este script controla el ciclo de vida de los cronómetros, la persistencia en 
 * LocalStorage y la actualización dinámica del DOM mediante una función de renderizado.
 */

// --- 1. CONFIGURACIÓN Y ESTADO ---

// Intentamos cargar los datos del almacenamiento local. Si no existen, inicializamos un array vacío.
// JSON.parse convierte el string de LocalStorage en un array de objetos JavaScript.
let descansos = JSON.parse(localStorage.getItem("descansos_app")) || [];

// Variable de control para el modal: si tiene un ID, estamos editando; si es null, estamos creando.
let editId = null;

// Referencias directas a los nodos del HTML para manipular la interfaz.
const listaContainer = document.getElementById("break-list");
const form = document.getElementById("break-form");

// --- 2. PERSISTENCIA ---

/**
 * Guarda el estado actual del array 'descansos' en el almacenamiento del navegador.
 * Se debe llamar siempre que cambie un dato (tiempo, nombre, estado).
 */
function save() {
  localStorage.setItem("descansos_app", JSON.stringify(descansos));
  render(); // Tras guardar, redibujamos la interfaz para reflejar los cambios.
}

/**
 * Función de utilidad para convertir segundos totales en formato legible HH:MM:SS.
 * .padStart(2, "0") asegura que siempre haya dos dígitos (ej: "05" en lugar de "5").
 */
function formatTime(sec) {
  const h = Math.floor(sec / 3600).toString().padStart(2, "0");
  const m = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

// --- 3. LÓGICA DE CONTROL ---

/**
 * Activa el cronómetro de un descanso.
 * Incluye lógica para que solo pueda haber UN descanso activo a la vez (pausa el resto).
 */
function startTimer(id) {
  descansos.forEach(item => {
    // Si hay otro cronómetro corriendo, lo pasamos a estado "paused".
    if (item.id !== id && item.estado === "running") {
      item.estado = "paused";
    }
  });
  const d = descansos.find(item => item.id === id);
  if (d) {
    // Si el cronómetro estaba a cero, registramos la marca de tiempo de inicio.
    if (d.segundosActuales === 0) d.ultimaHoraInicio = new Date().toISOString();
    d.estado = "running";
    save();
  }
}

/**
 * Cambia el estado a pausa, lo que detiene el incremento de segundos en el setInterval global.
 */
function pauseTimer(id) {
  const d = descansos.find((item) => item.id === id);
  if (d) {
    d.estado = "paused";
    save();
  }
}

/**
 * Finaliza la sesión actual de descanso.
 * Calcula el exceso de tiempo si el usuario se pasó del límite y guarda la sesión en el historial.
 */
function stopTimer(id) {
  const d = descansos.find((item) => item.id === id);
  if (!d) return;

  // Calculamos la diferencia entre el tiempo consumido y el objetivo (mínimo 0).
  const exceso = d.segundosActuales > d.tiempoObjetivo ? d.segundosActuales - d.tiempoObjetivo : 0;

  // Añadimos un registro al array historial del objeto.
  d.historial.push({
    duracion: d.segundosActuales,
    exceso: exceso,
    fin: new Date().toISOString()
  });

  d.completados++;           // Aumentamos el contador de sesiones hechas.
  d.segundosActuales = 0;    // Reseteamos el reloj para la próxima sesión.
  d.estado = "stopped";      // Estado base.
  save();
}

/**
 * Permite deshacer el último paso:
 * 1. Si estaba pausado, simplemente limpia el tiempo actual.
 * 2. Si ya se había guardado (stop), borra el último registro del historial.
 */
function undoLast(id) {
  const d = descansos.find((item) => item.id === id);
  if (!d) return;
  if (d.estado === "paused") {
    d.segundosActuales = 0;
    d.estado = "stopped";
  } else if (d.historial.length > 0) {
    d.historial.pop();      // Elimina el último elemento del array.
    d.completados--;        // Restamos uno al contador de éxitos.
    d.segundosActuales = 0;
    d.estado = "stopped";
  }
  save();
}

// --- 4. FORMULARIO Y MODAL ---

/**
 * Captura el evento de envío del formulario (Crear o Editar).
 */
form.addEventListener("submit", (e) => {
  e.preventDefault(); // Evita el refresco de página.

  // Validación de seguridad: máximo 3 descansos activos.
  if (!editId && descansos.length >= 3) {
    alert("Límite alcanzado");
    return;
  }

  // Recogemos los valores de los inputs.
  const nombre = document.getElementById("input-name").value;
  const mins = parseInt(document.getElementById("input-min").value) || 0;
  const secs = parseInt(document.getElementById("input-sec").value) || 0;
  const tiempoTotal = (mins * 60) + secs; // Todo se procesa en segundos internamente.
  const cantidad = parseInt(document.getElementById("input-breaks").value);

  if (editId) {
    // MODO EDICIÓN: Buscamos por ID y actualizamos propiedades.
    const index = descansos.findIndex(item => item.id === editId);
    descansos[index] = { ...descansos[index], nombre, tiempoObjetivo: tiempoTotal, cantidadTotal: cantidad };
    editId = null;
  } else {
    // MODO CREACIÓN: Creamos el objeto con su estructura inicial.
    descansos.push({
      id: Date.now(), // ID único basado en milisegundos.
      nombre,
      tiempoObjetivo: tiempoTotal,
      cantidadTotal: cantidad,
      completados: 0,
      segundosActuales: 0,
      estado: "stopped",
      historial: [],
      fechaCreacion: new Date().toISOString()
    });
  }
  save();
  form.reset();
  document.getElementById("my_modal_1").close(); // Cerramos el modal de DaisyUI.
});

/**
 * Configura el modal para un descanso nuevo con valores por defecto.
 */
function abrirModalNuevo() {
  editId = null;
  form.reset();
  document.getElementById("input-min").value = "5";
  document.getElementById("input-sec").value = "0";
  document.getElementById("input-breaks").value = "1";
  document.getElementById("btn-eliminar-modal").classList.add("hidden");
  document.getElementById("my_modal_1").showModal();
}

/**
 * Carga los datos de un descanso existente en los campos del formulario para editarlo.
 */
function prepararEdicion(id) {
  editId = id;
  const d = descansos.find(item => item.id === id);
  document.getElementById("input-name").value = d.nombre;
  document.getElementById("input-min").value = Math.floor(d.tiempoObjetivo / 60);
  document.getElementById("input-sec").value = d.tiempoObjetivo % 60;
  document.getElementById("input-breaks").value = d.cantidadTotal;
  document.getElementById("btn-eliminar-modal").classList.remove("hidden");
  document.getElementById("my_modal_1").showModal();
}

/**
 * Elimina permanentemente el descanso del array y actualiza la UI.
 */
function eliminarActual() {
  descansos = descansos.filter(d => d.id !== editId);
  save();
  document.getElementById("my_modal_1").close();
}

// --- 5. RENDERIZADO (DISEÑO FIJO) ---

/**
 * Transforma el array de datos en HTML visible.
 * Se ejecuta cada vez que algo cambia y cada segundo si hay un timer activo.
 */
function render() {
  listaContainer.innerHTML = ""; // Vaciamos la lista para evitar duplicados.

  descansos.forEach((d) => {
    // REGLA VISUAL: El color cambia a gris (finalizado) solo si se han completado TODAS las sesiones.
    const esFinalizado = d.estado === "stopped" && d.completados === d.cantidadTotal;

    // Lógica de estilos para el cronómetro (normal, pausa con parpadeo, o exceso en rojo).
    let timeClass = "text-gray-800";
    if (d.estado === "paused") timeClass = "text-gray-600 animate-pulse";
    else if (d.estado === "running") timeClass = d.segundosActuales > d.tiempoObjetivo ? "text-red-600 font-bold" : "text-gray-700";
    else if (esFinalizado) timeClass = "text-gray-500";

    const containerBg = esFinalizado ? "bg-gray-200" : "bg-white";
    const borderCol = esFinalizado ? "border-gray-200" : "border-white";

    // Calculamos la suma total de segundos de exceso de todas las sesiones de este descanso.
    const excesoTotal = d.historial.reduce((acc, s) => acc + (s.exceso || 0), 0);

    // Inserción del HTML usando Template Literals.
    listaContainer.innerHTML += `
      <section class="mt-6 cursor-pointer group w-full px-4" onclick="abrirHistorial(event, ${d.id})">
        <header class="flex justify-between px-3">
          <span class="font-semibold ${esFinalizado ? "text-gray-500" : "text-gray-800"}">${d.nombre}</span>
          <div class="flex gap-2 text-sm font-semibold ${esFinalizado ? "text-gray-500" : "text-gray-800"}">
            <span>${d.completados}/${d.cantidadTotal}</span>
            <span>${formatTime(d.tiempoObjetivo)}${excesoTotal > 0 ? `<span class="text-red-600 font-bold"> +${formatTime(excesoTotal)}</span>` : ""}</span>
          </div>
        </header>
        <div class="flex justify-between items-center px-2 py-2 mt-2 ${borderCol} border-2 ${containerBg} rounded-md shadow-sm gap-4">
          <div onclick="prepararEdicion(${d.id})" class="px-2 py-1 border border-gray-300 hover:bg-gray-100 rounded-md cursor-pointer active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#999" d="M4.42 20.579a1 1 0 0 1-.737-.326a.988.988 0 0 1-.263-.764l.245-2.694L14.983 5.481l3.537 3.536L7.205 20.33l-2.694.245a.95.95 0 0 1-.091.004ZM19.226 8.31L15.69 4.774l2.121-2.121a1 1 0 0 1 1.415 0l2.121 2.121a1 1 0 0 1 0 1.415l-2.12 2.12l-.001.001Z" /></svg>
          </div>
          <div class="px-3 py-1 font-semibold text-xl font-mono ${timeClass}">${formatTime(d.segundosActuales)}</div>
          <div class="flex gap-2">${renderButtons(d)}</div>
        </div>
      </section>`;
  });
  actualizarTotalGlobal();
}

/**
 * Genera el set de botones (Play/Pausa/Stop/Undo) dinámicamente según el estado del descanso.
 */
function renderButtons(d) {
  const terminado = d.completados >= d.cantidadTotal;
  const running = d.estado === "running";

  // CASO A: El cronómetro está corriendo.
  if (running) {
    return `
      <div class="flex gap-2">
        <div onclick="pauseTimer(${d.id})" class="px-2 py-1 border border-teal-400 bg-teal-400 hover:bg-teal-500 rounded-md text-white cursor-pointer active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 640 640"><path fill="#fbfbfb" d="M176 96c-26.5 0-48 21.5-48 48v352c0 26.5 21.5 48 48 48h64c26.5 0 48-21.5 48-48V144c0-26.5-21.5-48-48-48zm224 0c-26.5 0-48 21.5-48 48v352c0 26.5 21.5 48 48 48h64c26.5 0 48-21.5 48-48V144c0-26.5-21.5-48-48-48z"/></svg>
        </div>
        <div onclick="stopTimer(${d.id})" class="px-2 py-1 border border-gray-300 hover:bg-gray-100 rounded-md cursor-pointer active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 512 512"><path fill="#999" d="M392 432H120a40 40 0 0 1-40-40V120a40 40 0 0 1 40-40h272a40 40 0 0 1 40 40v272a40 40 0 0 1-40 40"/></svg>
        </div>
      </div>
      <div class="px-2 py-1 border border-gray-200 bg-gray-200 rounded-md opacity-50">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#999" d="M12 4c2.1 0 4.1.8 5.6 2.3c3.1 3.1 3.1 8.2 0 11.3c-1.8 1.9-4.3 2.6-6.7 2.3l.5-2c1.7.2 3.5-.4 4.8-1.7c2.3-2.3 2.3-6.1 0-8.5C15.1 6.6 13.5 6 12 6v4.6l-5-5l5-5z" /></svg>
      </div>`;
  }

  // CASO B: Se ha alcanzado el número máximo de descansos planeados.
  if (terminado && d.estado === "stopped") {
    return `
      <div class="flex gap-2">
        <div class="px-2 py-1 border border-gray-300 bg-gray-200 rounded-md opacity-50"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 512 512"><path fill="#999" d="M133 440a35.37 35.37 0 0 1-17.5-4.67c-12-6.8-19.46-20-19.46-34.33V111c0-14.37 7.46-27.53 19.46-34.33a35.13 35.13 0 0 1 35.77.45l247.85 148.36a36 36 0 0 1 0 61l-247.89 148.4A35.5 35.5 0 0 1 133 440"/></svg></div>
        <div class="px-2 py-1 border border-gray-300 bg-gray-200 rounded-md opacity-50"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 512 512"><path fill="#999" d="M392 432H120a40 40 0 0 1-40-40V120a40 40 0 0 1 40-40h272a40 40 0 0 1 40 40v272a40 40 0 0 1-40 40"/></svg></div>
        <div onclick="undoLast(${d.id})" class="px-2 py-1 border border-gray-300 bg-white hover:bg-gray-100 rounded-md cursor-pointer active:scale-95"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#999" d="M12 4c2.1 0 4.1.8 5.6 2.3c3.1 3.1 3.1 8.2 0 11.3c-1.8 1.9-4.3 2.6-6.7 2.3l.5-2c1.7.2 3.5-.4 4.8-1.7c2.3-2.3 2.3-6.1 0-8.5C15.1 6.6 13.5 6 12 6v4.6l-5-5l5-5z" /></svg></div>
      </div>`;
  }

  // CASO C: Estado base (esperando para empezar o pausado).
  return `
    <div class="flex gap-2">
      <div onclick="startTimer(${d.id})" class="px-2 py-1 bg-teal-400 border border-teal-400 hover:bg-teal-500 rounded-md text-white cursor-pointer active:scale-95">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 512 512"><path fill="#fbfbfb" d="M133 440a35.37 35.37 0 0 1-17.5-4.67c-12-6.8-19.46-20-19.46-34.33V111c0-14.37 7.46-27.53 19.46-34.33a35.13 35.13 0 0 1 35.77.45l247.85 148.36a36 36 0 0 1 0 61l-247.89 148.4A35.5 35.5 0 0 1 133 440"/></svg>
      </div>
      <div onclick="stopTimer(${d.id})" class="px-2 py-1 border border-gray-300 hover:bg-gray-100 rounded-md cursor-pointer active:scale-95">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 512 512"><path fill="#999" d="M392 432H120a40 40 0 0 1-40-40V120a40 40 0 0 1 40-40h272a40 40 0 0 1 40 40v272a40 40 0 0 1-40 40"/></svg>
      </div>
      <div onclick="undoLast(${d.id})" class="${(d.completados > 0 || d.estado === 'paused') ? 'border border-gray-300 hover:bg-gray-100' : 'bg-gray-200 border border-gray-200 opacity-50'} px-2 py-1 rounded-md cursor-pointer active:scale-95">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#999" d="M12 4c2.1 0 4.1.8 5.6 2.3c3.1 3.1 3.1 8.2 0 11.3c-1.8 1.9-4.3 2.6-6.7 2.3l.5-2c1.7.2 3.5-.4 4.8-1.7c2.3-2.3 2.3-6.1 0-8.5C15.1 6.6 13.5 6 12 6v4.6l-5-5l5-5z" /></svg>
      </div>
    </div>`;
}

/**
 * Recorre todos los descansos y sus respectivos historiales para calcular el 
 * tiempo total acumulado que aparece en la parte superior de la aplicación.
 */
function actualizarTotalGlobal() {
  const total = descansos.reduce((acc, d) => acc + d.historial.reduce((s, sesion) => s + sesion.duracion, 0) + d.segundosActuales, 0);
  const display = document.getElementById("total-global");
  if (display) display.innerText = formatTime(total);
}

/**
 * RELOJ MAESTRO: Se ejecuta cada 1000ms (1 segundo).
 * Si encuentra un descanso en estado "running", incrementa sus segundos.
 */
setInterval(() => {
  let cambio = false;
  descansos.forEach(d => { if (d.estado === "running") { d.segundosActuales++; cambio = true; } });
  if (cambio) render(); // Solo renderizamos si realmente hubo un cambio de tiempo para optimizar.
}, 1000);

/**
 * Maneja la apertura del modal de historial.
 * Usa .closest() para evitar que el modal se abra si el usuario hizo clic en los botones de acción.
 */
function abrirHistorial(event, id) {
  if (event.target.closest('div[onclick]')) return;
  const d = descansos.find(item => item.id === id);

  // Inyectamos el título con la fecha de creación formateada.
  document.getElementById("historial-titulo").innerHTML = `<div class="flex flex-col"><span class="text-2xl font-bold text-gray-800">${d.nombre}</span><span class="text-[10px] text-gray-400 uppercase mt-1">Creado: ${new Date(d.fechaCreacion).toLocaleString()}</span></div>`;

  const body = document.getElementById("historial-lista-body");

  // Generamos las filas de la tabla de historial o mostramos mensaje de vacío.
  body.innerHTML = d.historial.length === 0
    ? `<tr><td colspan="4" class="py-8 text-center text-gray-400 italic font-light">Sin datos.</td></tr>`
    : d.historial.map(s => {
      const f = new Date(s.fin);
      return `
          <tr class="border-b hover:bg-gray-50 text-sm text-left">
            <td class="py-4">
              <div>${f.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              <div class="text-[10px] text-gray-400">${f.toLocaleDateString()}</div>
            </td>
            <td class="py-4 text-gray-500">${formatTime(d.tiempoObjetivo)}</td>
            <td class="py-4 font-mono font-bold text-gray-800">${formatTime(s.duracion)}</td>
            <td class="py-4">
              ${s.exceso > 0 ? `<span class="text-red-600 font-bold">+${formatTime(s.exceso)}</span>` : `<span class="text-green-600 font-bold">00:00:00</span>`}
            </td>
          </tr>`;
    }).join("");

  document.getElementById("modal_historial").showModal();
}

// Ejecución inicial para pintar la aplicación por primera vez al cargar la página.
render();