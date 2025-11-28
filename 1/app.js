
// === AGENDA 2026 - UNIDAD DE TRANSPORTES PMT (BY GELM) ===================

const LS_KEY = 'agenda2026';

const fechaInput    = document.getElementById('fecha');
const categoriaSel  = document.getElementById('categoria');
const servicioSel   = document.getElementById('servicio');
const lugarInput    = document.getElementById('lugar');
const detalleInput  = document.getElementById('detalle');

const btnAgregar    = document.getElementById('btnAgregar');
const btnExcel      = document.getElementById('btnExcel');
const btnBorrarTodo = document.getElementById('btnBorrarTodo');

const verMesSel     = document.getElementById('verMes');
const estadoLbl     = document.getElementById('estado');
const tablaBody     = document.querySelector('#tablaAgenda tbody');

let agenda = [];

// Cargar desde localStorage
function cargarAgenda() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    agenda = raw ? JSON.parse(raw) : [];
  } catch (e) {
    agenda = [];
  }
}

// Guardar en localStorage
function guardarAgenda() {
  localStorage.setItem(LS_KEY, JSON.stringify(agenda));
}

// Formatear fecha a dd/mm/yyyy
function formatearFechaDisplay(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return '';
  const dia  = String(d.getDate()).padStart(2,'0');
  const mes  = String(d.getMonth()+1).padStart(2,'0');
  const anio = d.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

// Obtener mes (1-12) desde fecha ISO
function obtenerMes(iso) {
  const d = new Date(iso + 'T00:00:00');
  return isNaN(d) ? 0 : d.getMonth() + 1;
}

// Renderizar tabla según mes seleccionado
function renderAgenda() {
  const mesFiltro = parseInt(verMesSel.value || '0', 10);

  // Ordenar por fecha ascendente
  agenda.sort((a,b) => (a.fecha || '').localeCompare(b.fecha || ''));

  tablaBody.innerHTML = '';

  let contMostrados = 0;

  agenda.forEach(reg => {
    if (mesFiltro !== 0 && reg.mes !== mesFiltro) return;

    const tr = document.createElement('tr');

    const tdFecha = document.createElement('td');
    tdFecha.textContent = reg.fechaDisplay || '';
    tr.appendChild(tdFecha);

    const tdCat = document.createElement('td');
    tdCat.textContent = reg.categoria || '';
    tr.appendChild(tdCat);

    const tdServ = document.createElement('td');
    tdServ.textContent = reg.servicio || '';
    tr.appendChild(tdServ);

    const tdLugar = document.createElement('td');
    tdLugar.textContent = reg.lugar || '';
    tr.appendChild(tdLugar);

    const tdDet = document.createElement('td');
    tdDet.textContent = reg.detalle || '';
    tr.appendChild(tdDet);

    tablaBody.appendChild(tr);
    contMostrados++;
  });

  const total = agenda.length;
  const mesTexto = mesFiltro === 0
    ? 'todos los meses'
    : verMesSel.options[verMesSel.selectedIndex].textContent;

  estadoLbl.textContent = `Mostrando ${contMostrados} de ${total} actividades para ${mesTexto}.`;
}

// Agregar registro
function agregarRegistro() {
  const fecha = fechaInput.value.trim();
  const categoria = categoriaSel.value.trim();
  const servicio  = servicioSel.value.trim();
  const lugar     = lugarInput.value.trim();
  const detalle   = detalleInput.value.trim();

  if (!fecha) {
    alert('Ingresa una fecha para la actividad.');
    fechaInput.focus();
    return;
  }
  if (!categoria) {
    alert('Selecciona una categoría.');
    categoriaSel.focus();
    return;
  }
  if (!detalle) {
    if (!confirm('El detalle está vacío. ¿Agregar de todos modos?')) return;
  }

  const nuevo = {
    id: Date.now(),
    fecha,
    fechaDisplay: formatearFechaDisplay(fecha),
    mes: obtenerMes(fecha),
    categoria,
    servicio,
    lugar,
    detalle
  };

  agenda.push(nuevo);
  guardarAgenda();
  renderAgenda();

  // Limpiar solo detalle y lugar, conservar filtros
  lugarInput.value   = '';
  detalleInput.value = '';
}

// Exportar a Excel
function exportarExcel() {
  if (!agenda.length) {
    alert('No hay actividades en la agenda para exportar.');
    return;
  }

  const data = agenda
    .slice()
    .sort((a,b) => (a.fecha || '').localeCompare(b.fecha || ''))
    .map(reg => ({
      'Fecha': reg.fechaDisplay,
      'Categoría': reg.categoria,
      'Servicio': reg.servicio,
      'Lugar / ruta': reg.lugar,
      'Detalle': reg.detalle
    }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Agenda 2026');

  XLSX.writeFile(wb, 'AGENDA_TRANSPORTES_2026.xlsx');
}

// Borrar todo
function borrarTodo() {
  if (!agenda.length) {
    alert('No hay registros que borrar.');
    return;
  }
  if (!confirm('¿Borrar TODA la agenda 2026 de este dispositivo?')) return;

  agenda = [];
  guardarAgenda();
  renderAgenda();
}

// Eventos
btnAgregar && btnAgregar.addEventListener('click', agregarRegistro);
btnExcel   && btnExcel.addEventListener('click', exportarExcel);
btnBorrarTodo && btnBorrarTodo.addEventListener('click', borrarTodo);
verMesSel  && verMesSel.addEventListener('change', renderAgenda);

// Inicializar
(function init() {
  cargarAgenda();

  // Mes actual por defecto
  const hoy = new Date();
  const mesActual = hoy.getFullYear() === 2026 ? hoy.getMonth()+1 : 1;
  if (verMesSel) verMesSel.value = String(mesActual);

  renderAgenda();
})();
