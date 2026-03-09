// 1. Estado de la aplicación
let descansos = JSON.parse(localStorage.getItem("descansos_app")) || [];
const listaContainer = document.getElementById("break-list");
const form = document.getElementById("break-form");

// 2. Función para guardar en LocalStorage
function save() {
  localStorage.setItem("descansos_app", JSON.stringify(descansos));
  // Llamada a la función para mostrart el contenido
  render();
}

// 3. Crear nuevo descanso
form.addEventListener("submit", (e) => {
  e.preventDefault();
  

  // 1. VALIDACIÓN DE LÍMITE: Si no estamos editando y ya hay 4, detenemos la ejecución
  if (!editId && descansos.length >= 3) {
    alert("¡Límite alcanzado! No puedes añadir más de 3 descansos simultáneos.");
    return; // Sale de la función y no crea nada
  }

  const nombre = document.getElementById("input-name").value;
  const mins = parseInt(document.getElementById("input-min").value) || 0;
  const secs = parseInt(document.getElementById("input-sec").value) || 0;
  const tiempoTotal = (mins * 60) + secs; // Convertimos todo a segundos

  const cantidad = parseInt(document.getElementById("input-breaks").value);

  if (editId) {
    const index = descansos.findIndex(item => item.id === editId);
    descansos[index] = {
      ...descansos[index],
      nombre: nombre,
      tiempoObjetivo: tiempoTotal,
      cantidadTotal: cantidad,
      completados: 0,
      segundosActuales: 0,
      estado: "stopped",
      historial: []
    };
    editId = null;
  } else {
    // Lógica de creación (lo mismo, usando tiempoTotal)
    const nuevoDescanso = {
      id: Date.now(),
      nombre: nombre,
      tiempoObjetivo: tiempoTotal,
      cantidadTotal: cantidad,
      completados: 0,
      segundosActuales: 0,
      estado: "stopped",
      historial: [],
      fechaCreacion: new Date().toISOString()
    };
    descansos.push(nuevoDescanso);
  }

  save();
  form.reset();
  document.getElementById("my_modal_1").close();
});

// 4. Renderizar (Dibujar) la interfaz
function render() {
  listaContainer.innerHTML = "";

  descansos.forEach((d) => {
    // 1. Determinar si es un estado "Terminado" real o solo el estado inicial
    const esEstadoFinalizado = d.estado === "stopped" && d.completados > 0;

    // 2. Lógica de Colores del Texto y Animación
    let timeStatusClass = "";
    if (d.estado === "paused" && d.segundosActuales > 0) {
      // Solo parpadea si realmente hay tiempo contando
      timeStatusClass = "text-gray-600 animate-pulse";
    } else if (d.estado === "running") {
      timeStatusClass = d.segundosActuales > d.tiempoObjetivo ? "text-red-600 font-bold" : "text-gray-700";
    } else {
      // Si está stopped o pausado sin tiempo, se queda estático
      timeStatusClass = esEstadoFinalizado ? "text-gray-500" : "text-gray-800";
    }

    // 3. Lógica de Fondo y Borde del Contenedor
    // Solo ponemos gris si realmente se ha dado a Stop y hay sesiones guardadas
    const containerBgClass = esEstadoFinalizado ? "bg-gray-200" : "bg-white";
    const borderClass = esEstadoFinalizado ? "border-gray-200" : "border-white";
    // 1. Calculamos el exceso acumulado de todas las sesiones
    const excesoTotalSegundos = d.historial.reduce((acc, sesion) => acc + (sesion.exceso || 0), 0);
    // 4. Obtener el exceso de la última sesión si existe
    const excesoTexto = excesoTotalSegundos > 0
      ? `<span class="text-red-600 font-bold"> +${formatTime(excesoTotalSegundos)}</span>`
      : "";

    listaContainer.innerHTML += `
    <section class="mt-6 cursor-pointer group" onclick="abrirHistorial(event, ${d.id})">
      <header class="flex justify-between px-3  transition-transform">
        <div>
          <span class="${esEstadoFinalizado ? "font-semibold text-gray-500" : "font-semibold text-gray-800"}">${d.nombre}</span>
        </div>
        <div class="flex gap-2 text-sm ${esEstadoFinalizado ? "font-semibold text-gray-500" : "font-semibold text-gray-800"}">
          <span>${d.completados}/${d.cantidadTotal}</span>
          <div>
            <span>${formatTime(d.tiempoObjetivo)}</span>
            ${excesoTexto} 
          </div>
        </div>
      </header>

      <div class="flex justify-between items-center px-2 py-2 mt-2 ${borderClass} border-2 ${containerBgClass} rounded-md shadow-xl/10 gap-4 transition-colors duration-300">
        
        <div onclick="prepararEdicion(${d.id})"
          class="px-2 py-1 border border-gray-300 hover:bg-gray-200 border-1 rounded-md cursor-pointer active:scale-95 easy-in"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path fill="#999999" d="M4.42 20.579a1 1 0 0 1-.737-.326a.988.988 0 0 1-.263-.764l.245-2.694L14.983 5.481l3.537 3.536L7.205 20.33l-2.694.245a.95.95 0 0 1-.091.004ZM19.226 8.31L15.69 4.774l2.121-2.121a1 1 0 0 1 1.415 0l2.121 2.121a1 1 0 0 1 0 1.415l-2.12 2.12l-.001.001Z" />
          </svg>
        </div>

        <div class="px-3 py-1 font-semibold text-xl font-mono ${timeStatusClass} px-2 rounded">
          ${formatTime(d.segundosActuales)}
        </div>

        <div class="flex gap-2">
          ${renderButtons(d)}
        </div>
      </div>
    </section>
        `;
  });
  actualizarTotalGlobal();
}
// Auxiliar para formato 00:00:00
function formatTime(sec) {
  const h = Math.floor(sec / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((sec % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

// Inicializar
render();

setInterval(() => {
  let huboCambio = false;

  descansos.forEach((d) => {
    if (d.estado === "running") {
      d.segundosActuales++;
      huboCambio = true;
    }
  });

  // Solo renderizamos si algo cambió para no saturar el navegador
  if (huboCambio) {
    render();
  }
}, 1000);
function startTimer(id) {
  // Solo pausamos los que REALMENTE estén corriendo
  descansos.forEach(item => {
    if (item.id !== id && item.estado === "running") {
      item.estado = "paused";
    }
  });

  const d = descansos.find(item => item.id === id);
  if (d) {
    if (d.segundosActuales === 0) {
      d.ultimaHoraInicio = new Date().toISOString();
    }
    d.estado = "running";
    save();
  }
}
function pauseTimer(id) {
  const d = descansos.find((item) => item.id === id);
  d.estado = "paused";
  save();
}

function stopTimer(id) {
  const d = descansos.find((item) => item.id === id);
  if (!d) return;

  // Calculamos si hubo exceso
  const exceso = d.segundosActuales > d.tiempoObjetivo ? d.segundosActuales - d.tiempoObjetivo : 0;

  // GUARDAR EN HISTORIAL: Usamos "fin" para que coincida con el modal
  d.historial.push({
    duracion: d.segundosActuales,
    exceso: exceso,
    fin: new Date().toISOString() // Cambiado de timestamp a fin
  });

  d.completados++;
  d.segundosActuales = 0;
  d.estado = "stopped";

  save();
}
function undoLast(id) {
  const d = descansos.find((item) => item.id === id);
  if (!d) return;

  // CASO A: Si el cronómetro está en pausa, simplemente lo reseteamos a cero
  if (d.estado === "paused") {
    d.segundosActuales = 0;
    d.estado = "stopped";
    // No restamos 'completados' aquí porque solo estamos reseteando el tiempo actual
  }
  // CASO B: Si no está en pausa pero hay historial, borramos la última sesión
  else if (d.historial.length > 0) {
    d.historial.pop();
    d.completados--;
    d.segundosActuales = 0;
    d.estado = "stopped";
  }

  save(); // Esto guarda y refresca la interfaz
}

function renderButtons(d) {
  // 1. Determinar si se han completado todos los descansos establecidos
  const esFinalAbsoluto = d.completados >= d.cantidadTotal;

  // ESTADO: CORRIENDO (Running)
  if (d.estado === "running") {
    return `
      <div class="flex gap-2">
        <div onclick="pauseTimer(${d.id})"
          class="px-2 py-1 border border-teal-500 bg-teal-500 hover:border-teal-600 hover:bg-teal-600 rounded-md text-white cursor-pointer active:scale-95 easy-in"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8.5 4.5h-3a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-13a1 1 0 0 0-1-1m10 0h-3a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-13a1 1 0 0 0-1-1" />
          </svg>
        </div>
        <div onclick="stopTimer(${d.id})"
          class="px-2 py-1 border border-indigo-400 bg-indigo-400 rounded-md text-white hover:border-indigo-500 hover:bg-indigo-500 cursor-pointer active:scale-95 easy-in"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16">
            <path fill="#ffffff" fill-rule="evenodd" d="M11.5 3h-7A1.5 1.5 0 0 0 3 4.5v7A1.5 1.5 0 0 0 4.5 13h7a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 11.5 3m-7-1.5a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h7a3 3 0 0 0 3-3v-7a3 3 0 0 0-3-3z" clip-rule="evenodd" />
          </svg>
        </div>
      </div>

      <div onclick="undoLast(${d.id})"
          class="px-2 py-1 border border-gray-300 bg-gray-200 rounded-md opacity-50 text-white cursor-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path fill="#999999" d="M12 4c2.1 0 4.1.8 5.6 2.3c3.1 3.1 3.1 8.2 0 11.3c-1.8 1.9-4.3 2.6-6.7 2.3l.5-2c1.7.2 3.5-.4 4.8-1.7c2.3-2.3 2.3-6.1 0-8.5C15.1 6.6 13.5 6 12 6v4.6l-5-5l5-5zM6.3 17.6C3.7 15 3.3 11 5.1 7.9l1.5 1.5c-1.1 2.2-.7 5 1.2 6.8q.75.75 1.8 1.2l-.6 2q-1.5-.6-2.7-1.8" />
          </svg>
        </div>
    `;
  }

  // ESTADO: STOPPED (Pero ya se han completado TODOS los descansos)
  if (esFinalAbsoluto && d.estado === "stopped") {
    return `
      <div class="flex gap-2">
        <div class="px-2 py-1 border border-gray-300 bg-gray-200 rounded-md text-white opacity-50 cursor-not-allowed">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M5 5v14a2 2 0 0 0 2.75 1.84L20 13.74a2 2 0 0 0 0-3.5L7.75 3.14A2 2 0 0 0 5 4.89" fill="none" stroke="#999999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <div class='px-2 py-1 border border-gray-300 bg-gray-200 rounded-md opacity-50 cursor-auto'"
        class="px-2 py-1 border border-indigo-400 bg-indigo-400 rounded-md text-white hover:border-indigo-500 hover:bg-indigo-500 cursor-pointer active:scale-95 easy-in"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16">
          <path fill="#999999" fill-rule="evenodd" d="M11.5 3h-7A1.5 1.5 0 0 0 3 4.5v7A1.5 1.5 0 0 0 4.5 13h7a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 11.5 3m-7-1.5a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h7a3 3 0 0 0 3-3v-7a3 3 0 0 0-3-3z" clip-rule="evenodd" />
        </svg>
      </div>
        <div onclick="undoLast(${d.id})"
          class="px-2 py-1 border border-indigo-400 bg-indigo-400 rounded-md text-white hover:border-indigo-500 hover:bg-indigo-500 cursor-pointer active:scale-95 easy-in"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path fill="#ffffff" d="M12 4c2.1 0 4.1.8 5.6 2.3c3.1 3.1 3.1 8.2 0 11.3c-1.8 1.9-4.3 2.6-6.7 2.3l.5-2c1.7.2 3.5-.4 4.8-1.7c2.3-2.3 2.3-6.1 0-8.5C15.1 6.6 13.5 6 12 6v4.6l-5-5l5-5zM6.3 17.6C3.7 15 3.3 11 5.1 7.9l1.5 1.5c-1.1 2.2-.7 5 1.2 6.8q.75.75 1.8 1.2l-.6 2q-1.5-.6-2.7-1.8" />
          </svg>
        </div>
      </div>
    `;
  }

  // ESTADO POR DEFECTO: Play habilitado (Aún quedan descansos por hacer o se acaba de resetear)
  return `
    <div class="flex gap-2">
      <div onclick="startTimer(${d.id})"
        class="px-2 py-1 border border-teal-500 bg-teal-500 hover:border-teal-600 hover:bg-teal-600 rounded-md text-white cursor-pointer active:scale-95 easy-in"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <path d="M5 5v14a2 2 0 0 0 2.75 1.84L20 13.74a2 2 0 0 0 0-3.5L7.75 3.14A2 2 0 0 0 5 4.89" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>

      <div onclick="stopTimer(${d.id})"
        class="px-2 py-1 border border-indigo-400 bg-indigo-400 rounded-md text-white hover:border-indigo-500 hover:bg-indigo-500 cursor-pointer active:scale-95 easy-in"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16">
          <path fill="#ffffff" fill-rule="evenodd" d="M11.5 3h-7A1.5 1.5 0 0 0 3 4.5v7A1.5 1.5 0 0 0 4.5 13h7a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 11.5 3m-7-1.5a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h7a3 3 0 0 0 3-3v-7a3 3 0 0 0-3-3z" clip-rule="evenodd" />
        </svg>
      </div>

      ${(d.completados > 0 || d.estado === "paused") ? `
        <div onclick="undoLast(${d.id})"
          class="px-2 py-1 border border-indigo-400 bg-indigo-400 rounded-md text-white hover:border-indigo-500 hover:bg-indigo-500 cursor-pointer active:scale-95 easy-in"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path fill="#ffffff" d="M12 4c2.1 0 4.1.8 5.6 2.3c3.1 3.1 3.1 8.2 0 11.3c-1.8 1.9-4.3 2.6-6.7 2.3l.5-2c1.7.2 3.5-.4 4.8-1.7c2.3-2.3 2.3-6.1 0-8.5C15.1 6.6 13.5 6 12 6v4.6l-5-5l5-5zM6.3 17.6C3.7 15 3.3 11 5.1 7.9l1.5 1.5c-1.1 2.2-.7 5 1.2 6.8q.75.75 1.8 1.2l-.6 2q-1.5-.6-2.7-1.8" />
          </svg>
        </div>` : `
        <div class="px-2 py-1 border border-gray-300 bg-gray-200 rounded-md text-white opacity-50 cursor-auto">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path fill="#999999" d="M12 4c2.1 0 4.1.8 5.6 2.3c3.1 3.1 3.1 8.2 0 11.3c-1.8 1.9-4.3 2.6-6.7 2.3l.5-2c1.7.2 3.5-.4 4.8-1.7c2.3-2.3 2.3-6.1 0-8.5C15.1 6.6 13.5 6 12 6v4.6l-5-5l5-5zM6.3 17.6C3.7 15 3.3 11 5.1 7.9l1.5 1.5c-1.1 2.2-.7 5 1.2 6.8q.75.75 1.8 1.2l-.6 2q-1.5-.6-2.7-1.8" />
          </svg>
        </div>
      `}
    </div>
  `;
}

function actualizarTotalGlobal() {
  let total = 0;
  descansos.forEach((d) => {
    // Sumamos el historial
    const sumaHistorial = d.historial.reduce(
      (acc, sesion) => acc + sesion.duracion,
      0,
    );
    // Sumamos el cronómetro actual
    total += sumaHistorial + d.segundosActuales;
  });

  const display = document.getElementById("total-global"); // Asegúrate de que este ID exista en tu H2
  if (display) display.innerText = formatTime(total);
}


let editId = null; // Guardará el ID del descanso que estamos editando
function prepararEdicion(id) {
  editId = id;
  const d = descansos.find((item) => item.id === id);

  if (!d) return; // Seguridad por si no encuentra el ID

  document.getElementById("modal-title").innerText = `Editando: ${d.nombre}`;
  document.getElementById("input-name").value = d.nombre;

  // --- Desglosar segundos a Minutos y Segundos ---
  const mins = Math.floor(d.tiempoObjetivo / 60);
  const secs = d.tiempoObjetivo % 60;

  // Aquí es donde fallaba: comprueba que estos IDs existan en tu HTML
  document.getElementById("input-min").value = mins;
  document.getElementById("input-sec").value = secs;

  document.getElementById("input-breaks").value = d.cantidadTotal;

  // Mostrar el botón eliminar
  const btnEliminar = document.getElementById("btn-eliminar-modal");
  if (btnEliminar) btnEliminar.classList.remove("hidden");

  document.getElementById("my_modal_1").showModal();
}

// Cuando abras el modal desde el botón de "Nuevo Descanso"
function abrirModalNuevo() {
  editId = null;
  form.reset();

  document.getElementById("modal-title").innerText = "Añadir descanso";
  document.getElementById("input-min").value = "5"; // Valor por defecto
  document.getElementById("input-sec").value = "0";

  const btnEliminar = document.getElementById("btn-eliminar-modal");
  if (btnEliminar) btnEliminar.classList.add("hidden");

  document.getElementById("my_modal_1").showModal();
}

function eliminarActual() {
  if (editId === null) return;

  // Filtramos el array para borrar el elemento
  descansos = descansos.filter(d => d.id !== editId);

  save(); // Guarda en localStorage y hace render()
  document.getElementById("my_modal_1").close();
  editId = null;
}

function stopTimer(id) {
  const d = descansos.find((item) => item.id === id);

  // Calculamos si hubo exceso
  const exceso = d.segundosActuales > d.tiempoObjetivo ? d.segundosActuales - d.tiempoObjetivo : 0;

  // Guardamos la sesión con el dato del exceso
  d.historial.push({
    duracion: d.segundosActuales,
    exceso: exceso, // Guardamos cuánto se pasó
    timestamp: Date.now(),
  });

  d.completados++;
  d.segundosActuales = 0;
  d.estado = "stopped";
  save();
}

function abrirHistorial(event, id) {
  if (event.target.closest('div[onclick^="prepararEdicion"]') ||
    event.target.closest('div[onclick^="startTimer"]') ||
    event.target.closest('div[onclick^="pauseTimer"]') ||
    event.target.closest('div[onclick^="stopTimer"]') ||
    event.target.closest('div[onclick^="undoLast"]')) return;

  const d = descansos.find(item => item.id === id);
  if (!d) return;

  const fechaCrea = d.fechaCreacion
    ? new Date(d.fechaCreacion).toLocaleDateString() + " " + new Date(d.fechaCreacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : "---";

  document.getElementById("historial-titulo").innerHTML = `
    <div class="flex flex-col">
      <span class="text-2xl font-bold text-gray-800">${d.nombre}</span>
      <span class="text-[10px] font-normal text-gray-400 uppercase tracking-tighter mt-1">
        Creado: ${fechaCrea}
      </span>
    </div>
  `;

  const body = document.getElementById("historial-lista-body");
  body.innerHTML = "";

  if (d.historial.length === 0) {
    body.innerHTML = `<tr><td colspan="4" class="py-8 text-center text-gray-400 italic font-light">Sin datos de finalización.</td></tr>`;
  } else {
    d.historial.forEach(s => {
      // Verificamos si existe s.fin (por si hay datos viejos con s.timestamp)
      const fechaReferencia = s.fin || s.timestamp || new Date().toISOString();

      if (!fechaReferencia) return; // Evita errores si la sesión está corrupta

      const objFecha = new Date(fechaReferencia);
      const fechaFin = objFecha.toLocaleDateString();
      const horaFin = objFecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      body.innerHTML += `
    <tr class="border-b hover:bg-gray-50 transition-colors text-sm text-left">
      <td class="py-4">
        <div class="font-medium text-gray-700">${horaFin}</div>
        <div class="text-[10px] text-gray-400">${fechaFin}</div>
      </td>
      <td class="py-4 text-gray-500 font-medium">
        ${formatTime(d.tiempoObjetivo)}
      </td>
      <td class="py-4 font-mono font-bold text-gray-800">
        ${formatTime(s.duracion)}
      </td>
      <td class="py-4">
        ${s.exceso > 0
          ? `<span class="text-red-600 font-bold">+${formatTime(s.exceso)}</span>`
          : `<span class="text-green-600 font-bold">00:00:00</span>`}
      </td>
    </tr>
  `;
    });
  }

  document.getElementById("modal_historial").showModal();
}