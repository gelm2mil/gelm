// ====== Estado en memoria y almacenamiento local ======
const STORAGE_KEY = 'transportes2026_data';

let state = {
  agenda: [],   // {id, fecha, categoria, servicio, lugar, detalle}
};

function cargarEstado() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.agenda)) {
        state.agenda = parsed.agenda;
      }
    }
  } catch(e) {
    console.error('Error al cargar estado', e);
  }
}

function guardarEstado() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch(e) {
    console.error('Error al guardar estado', e);
  }
}

// Util para generar IDs simples
function generarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ====== Navegación de vistas ======
const tabButtons = document.querySelectorAll('.nav-tabs button');
const vistas = {
  agenda: document.getElementById('vista-agenda'),
  operativos: document.getElementById('vista-operativos'),
  denuncias: document.getElementById('vista-denuncias'),
  buscador: document.getElementById('vista-buscador'),
  respaldos: document.getElementById('vista-respaldos')
};

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const vista = btn.getAttribute('data-vista');
    Object.keys(vistas).forEach(k => {
      vistas[k].classList.toggle('activa', k === vista);
    });
  });
});

// ====== Agenda 2026 ======
const inputFecha = document.getElementById('agendaFecha');
const inputCategoria = document.getElementById('agendaCategoria');
const inputServicio = document.getElementById('agendaServicio');
const inputLugar = document.getElementById('agendaLugar');
const inputDetalle = document.getElementById('agendaDetalle');
const btnAgregarAgenda = document.getElementById('btnAgregarAgenda');
const selectMesFiltro = document.getElementById('agendaMesFiltro');
const tablaAgendaBody = document.querySelector('#tablaAgenda tbody');
const tablaOperativosBody = document.querySelector('#tablaOperativos tbody');
const tablaDenunciasBody = document.querySelector('#tablaDenuncias tbody');

btnAgregarAgenda.addEventListener('click', () => {
  const fecha = inputFecha.value;
  const categoria = inputCategoria.value;
  const servicio = inputServicio.value;
  const lugar = inputLugar.value.trim();
  const detalle = inputDetalle.value.trim();

  if (!fecha || !categoria || !detalle) {
    alert('Por favor ingresa al menos la fecha, categoría y detalle.');
    return;
  }

  state.agenda.push({
    id: generarId(),
    fecha,
    categoria,
    servicio,
    lugar,
    detalle
  });

  guardarEstado();
  inputDetalle.value = '';
  renderAgenda();
  alert('Actividad agregada a la agenda.');
});

selectMesFiltro.addEventListener('change', renderAgenda);

function renderAgenda() {
  const mes = parseInt(selectMesFiltro.value, 10);
  tablaAgendaBody.innerHTML = '';
  tablaOperativosBody.innerHTML = '';
  tablaDenunciasBody.innerHTML = '';

  const eventosOrdenados = [...state.agenda].sort((a,b) => (a.fecha || '').localeCompare(b.fecha || ''));

  eventosOrdenados.forEach(ev => {
    if (!ev.fecha || ev.fecha.length < 7) return;
    const m = parseInt(ev.fecha.split('-')[1], 10) - 1;
    if (m !== mes) return;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${ev.fecha}</td>
      <td>${ev.categoria}</td>
      <td>${ev.servicio || ''}</td>
      <td>${ev.lugar || ''}</td>
      <td>${ev.detalle || ''}</td>
    `;
    tablaAgendaBody.appendChild(tr);

    if (ev.categoria === 'OPERATIVO') {
      const tro = document.createElement('tr');
      tro.innerHTML = `
        <td>${ev.fecha}</td>
        <td>${ev.servicio || ''}</td>
        <td>${ev.lugar || ''}</td>
        <td>${ev.detalle || ''}</td>
      `;
      tablaOperativosBody.appendChild(tro);
    }

    if (ev.categoria === 'DENUNCIA') {
      const trd = document.createElement('tr');
      trd.innerHTML = `
        <td>${ev.fecha}</td>
        <td>${ev.servicio || ''}</td>
        <td>${ev.lugar || ''}</td>
        <td>${ev.detalle || ''}</td>
      `;
      tablaDenunciasBody.appendChild(trd);
    }
  });
}

// ====== Buscador de placas / licencias / DPI ======
let placasData = [];
const estadoEl = document.getElementById('estado');
const busquedaInput = document.getElementById('busquedaInput');
const btnBuscar = document.getElementById('btnBuscar');
const resultadoEl = document.getElementById('resultado');

function normalizarTexto(t) {
  if (!t) return '';
  return String(t).toUpperCase().replace(/\s+/g, '').replace(/-/g, '');
}

fetch('fetch("placas.json?v=" + Date.now())
')
  .then(r => r.json())
  .then(data => {
    placasData = Array.isArray(data) ? data : [];
    estadoEl.textContent = 'Archivo de placas cargado (' + placasData.length + ' registros).';
  })
  .catch(err => {
    console.error('Error cargando placas.json', err);
    estadoEl.textContent = 'No se pudo cargar placas.json. Verifica que esté en la misma carpeta.';
  });

btnBuscar.addEventListener('click', hacerBusqueda);
busquedaInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    hacerBusqueda();
  }
});

function hacerBusqueda() {
  const q = normalizarTexto(busquedaInput.value);
  resultadoEl.innerHTML = '';
  if (!q) {
    resultadoEl.innerHTML = '<p class="nota">Ingresa un dato para buscar.</p>';
    return;
  }

  if (!placasData.length) {
    resultadoEl.innerHTML = '<p class="nota">No hay datos de placas cargados.</p>';
    return;
  }

  const encontrados = placasData.filter(reg => {
    return Object.values(reg).some(v => normalizarTexto(v).includes(q));
  });

  if (!encontrados.length) {
    resultadoEl.innerHTML = '<p class="nota">No se encontraron resultados.</p>';
    return;
  }

  encontrados.forEach((reg, idx) => {
    const div = document.createElement('div');
    div.className = 'result-item';

    const keys = Object.keys(reg);
    const posiblePlacaKey = keys.find(k => k.toUpperCase().includes('PLACA'));
    const posibleLicKey = keys.find(k => k.toUpperCase().includes('LICEN'));
    const posibleNombreKey = keys.find(k => k.toUpperCase().includes('NOMBRE') || k.toUpperCase().includes('PROPIE'));

    const placa = posiblePlacaKey ? reg[posiblePlacaKey] : '';
    const licencia = posibleLicKey ? reg[posibleLicKey] : '';
    const nombre = posibleNombreKey ? reg[posibleNombreKey] : '';

    const tituloParts = [];
    if (placa) tituloParts.push('PLACA: ' + placa);
    if (licencia) tituloParts.push('LICENCIA: ' + licencia);
    if (nombre) tituloParts.push('PROPIETARIO: ' + nombre);

    const tituloText = tituloParts.join(' | ') || 'Registro #' + (idx + 1);

    const detalleHtml = Object.entries(reg).map(([k,v]) => {
      return `<div><b>${k}:</b> ${v}</div>`;
    }).join('');

    div.innerHTML = `
      <div class="result-item-titulo">${tituloText}</div>
      <div class="result-item-detalle">${detalleHtml}</div>
    `;

    resultadoEl.appendChild(div);
  });
}

// ====== Respaldos ======
const btnDescargarRespaldo = document.getElementById('btnDescargarRespaldo');

btnDescargarRespaldo.addEventListener('click', () => {
  const payload = {
    version: '1.0',
    generado: new Date().toISOString(),
    agenda: state.agenda
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth()+1).padStart(2,'0');
  const dd = String(hoy.getDate()).padStart(2,'0');
  a.href = url;
  a.download = `respaldo_transportes2026_${yyyy}${mm}${dd}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// ====== Pie con fecha actual ======
const pieFecha = document.getElementById('pie-fecha');
if (pieFecha) {
  const hoy = new Date();
  const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
  pieFecha.textContent = 'Fecha actual: ' + hoy.toLocaleDateString('es-GT', opciones);
}

// Inicializar
cargarEstado();
renderAgenda();
