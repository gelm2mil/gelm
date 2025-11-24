let registros = [];
let grupoSimilares = [];

// CARGAR EXCEL
async function cargarExcel() {
  const estado = document.getElementById('estado');
  try {
    const resp = await fetch('2025.xlsx');
    if (!resp.ok) throw new Error('No se pudo descargar 2025.xlsx');

    const data = await resp.arrayBuffer();
    const wb = XLSX.read(data, { type: 'array' });
    const hoja = wb.Sheets[wb.SheetNames[0]];
    const filas = XLSX.utils.sheet_to_json(hoja, { header: 1, raw: false });

    let inicio = filas.findIndex(f =>
      (f[0] || '').toString().trim().toUpperCase().startsWith('M-')
    );
    if (inicio === -1) {
      estado.textContent = 'No se encontraron registros de placas en el Excel.';
      return;
    }

    for (let i = inicio; i < filas.length; i++) {
      const f = filas[i];
      if (!f[0]) continue;

      registros.push({
        placa:        (f[0]  || '').trim().toUpperCase(),
        calcomania:   (f[1]  || '').trim(),
        placaSale:    (f[2]  || '').trim(),
        concesionario:(f[3]  || '').trim(),
        telDueno:     (f[4]  || '').trim(),
        ruta:         (f[5]  || '').trim(),
        telPilotos:   (f[6]  || '').trim(),
        nombrePiloto: (f[7]  || '').trim(),
        dpi:          (f[8]  || '').trim(),
        documento:    (f[9]  || '').trim(),
        licencia:     (f[10] || '').trim().toUpperCase(),
        tipoLic:      (f[11] || '').trim()
      });
    }

    estado.textContent = 'Archivo cargado. Registros: ' + registros.length;
  } catch (err) {
    console.error(err);
    estado.textContent = 'Error: ' + err.message;
  }
}

// Normalizar números (quita espacios y guiones)
function normalizarNumero(txt) {
  return txt.toString()
            .replace(/\s+/g, '')
            .replace(/-/g, '')
            .trim()
            .toUpperCase();
}

// Render de tabla de un registro
function renderResultado(r) {
  const div = document.getElementById('resultado');
  if (!r) {
    div.innerHTML = '<p>Sin datos para mostrar.</p>';
    return;
  }

  div.innerHTML = `
    <table>
      <tr>
        <th>NO. PLACA</th>
        <th>NO. CALCOMANIA</th>
        <th>PLACA SALE</th>
        <th>CONCESIONARIO (A)</th>
        <th>TEL. DUEÑO</th>
        <th>RUTA</th>
        <th>TEL. PILOTOS</th>
        <th>NOMBRE DEL PILOTO</th>
        <th>DPI</th>
        <th>DOCUMENTO</th>
        <th>NUMERO DE LICENCIA</th>
        <th>TIPO LICENCIA</th>
      </tr>
      <tr>
        <td>${r.placa}</td>
        <td>${r.calcomania}</td>
        <td>${r.placaSale}</td>
        <td>${r.concesionario}</td>
        <td>${r.telDueno}</td>
        <td>${r.ruta}</td>
        <td>${r.telPilotos}</td>
        <td>${r.nombrePiloto}</td>
        <td>${r.dpi}</td>
        <td>${r.documento}</td>
        <td>${r.licencia}</td>
        <td>${r.tipoLic}</td>
      </tr>
    </table>
  `;
}

// Llenar select de similares
function llenarSimilares(grupo, principal) {
  const box = document.getElementById('similaresBox');
  const sel = document.getElementById('similaresSelect');

  grupoSimilares = grupo;

  if (!grupo || grupo.length <= 1) {
    box.classList.add('oculto');
    sel.innerHTML = '<option value="">-- seleccionar --</option>';
    return;
  }

  box.classList.remove('oculto');
  sel.innerHTML = '<option value="">-- seleccionar --</option>';

  grupo.forEach((r, idx) => {
    const etiqueta = `${r.calcomania} | ${r.placa} | ${r.ruta || 'SIN RUTA'} | ${r.concesionario}`;
    const opt = document.createElement('option');
    opt.value = String(idx);
    opt.textContent = etiqueta;
    if (principal && r.placa === principal.placa && r.ruta === principal.ruta) {
      opt.selected = true;
    }
    sel.appendChild(opt);
  });
}

// Buscar principal según texto
function buscar() {
  const input = document.getElementById('busquedaInput');
  const texto = input.value.trim();
  const div = document.getElementById('resultado');
  const selBox = document.getElementById('similaresBox');

  if (!texto) {
    div.innerHTML = '<p>Escribe placa, DPI, número de licencia, documento o No. de calcomanía.</p>';
    selBox.classList.add('oculto');
    return;
  }

  const valorMayus = texto.toUpperCase();
  const limpio = normalizarNumero(texto);

  // Si son solo dígitos -> buscar por calcomanía priorizando mototaxi
  if (/^\d+$/.test(texto)) {
    const grupo = registros.filter(r => r.calcomania === texto);
    if (grupo.length) {
      const principal =
        grupo.find(r => (r.ruta || '').toUpperCase().includes('CASCO')) ||
        grupo[0];
      renderResultado(principal);
      llenarSimilares(grupo, principal);
      return;
    }
  }

  // Búsqueda normal por placa / dpi / licencia / documento
  const encontrado = registros.find(reg =>
         reg.placa === valorMayus
      || normalizarNumero(reg.dpi) === limpio
      || normalizarNumero(reg.licencia) === limpio
      || normalizarNumero(reg.documento) === limpio
  );

  if (!encontrado) {
    div.innerHTML = `<p>No se encontró <strong>${texto}</strong>.</p>`;
    selBox.classList.add('oculto');
    return;
  }

  renderResultado(encontrado);

  // Similares por misma calcomanía
  const grupo = registros.filter(r => r.calcomania && r.calcomania === encontrado.calcomania);
  llenarSimilares(grupo, encontrado);
}

// Cambio en select de similares
function onCambioSimilar() {
  const sel = document.getElementById('similaresSelect');
  const idx = parseInt(sel.value, 10);
  if (isNaN(idx) || !grupoSimilares[idx]) return;
  renderResultado(grupoSimilares[idx]);
}

// Actualizar fecha/hora en pie
function actualizarFechaPie() {
  const elem = document.getElementById('pie-fecha');
  const ahora = new Date();
  const opciones = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };
  const texto = ahora.toLocaleDateString('es-ES', opciones);
  elem.textContent = texto.charAt(0).toUpperCase() + texto.slice(1);
}

document.addEventListener('DOMContentLoaded', () => {
  cargarExcel();
  document.getElementById('btnBuscar').addEventListener('click', buscar);
  document.getElementById('busquedaInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') buscar();
  });
  document.getElementById('similaresSelect').addEventListener('change', onCambioSimilar);
  actualizarFechaPie();
  setInterval(actualizarFechaPie, 1000);
});
