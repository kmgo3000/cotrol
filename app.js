/**
 * Admin Panadería - JS principal
 * - Registro automático de fecha y turno
 * - Almacenamiento en localStorage
 * - Cálculo de ganancias diarias/mensuales
 * - Gastos fijos mensuales
 * - Reportes y gráficos con Chart.js
 */

// Utilidades de fecha
function getTodayStr() {
    const d = new Date();
    return d.toISOString().slice(0, 10); // 'YYYY-MM-DD'
}
function getMonthStr(dateStr) {
    return dateStr.slice(0, 7); // 'YYYY-MM'
}
function getMonthName(dateStr) {
    const [year, month] = dateStr.split('-');
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    return `${meses[parseInt(month)-1]} ${year}`;
}
function formatearFechaAmigable(fechaISO) {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-PE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// LocalStorage helpers
function loadData() {
    return {
        ventas: JSON.parse(localStorage.getItem('ventas') || '[]'),
        gastos: JSON.parse(localStorage.getItem('gastos') || '[]'),
        gastosFijos: JSON.parse(localStorage.getItem('gastosFijos') || '{}')
    };
}
function saveData({ventas, gastos, gastosFijos}) {
    localStorage.setItem('ventas', JSON.stringify(ventas));
    localStorage.setItem('gastos', JSON.stringify(gastos));
    localStorage.setItem('gastosFijos', JSON.stringify(gastosFijos));
}

// Estado global
let ventas = [];
let gastos = [];
let gastosFijos = {};

// Inicializar datos
function initData() {
    const data = loadData();
    ventas = data.ventas;
    gastos = data.gastos;
    gastosFijos = data.gastosFijos;
}
initData();

// Registro de ventas
document.getElementById('form-venta').addEventListener('submit', function(e) {
    e.preventDefault();
    const monto = parseFloat(document.getElementById('venta-monto').value);
    const turno = document.getElementById('venta-turno').value;
    if (isNaN(monto) || monto <= 0 || !turno) return;
    ventas.push({
        monto,
        turno,
        fecha: getTodayStr(),
        hora: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    });
    saveData({ventas, gastos, gastosFijos});
    document.getElementById('venta-monto').value = '';
    document.getElementById('venta-turno').value = '';
    actualizarResumen();
    actualizarHistorial();
    actualizarReportes();
});

// Registro de gastos
document.getElementById('form-gasto').addEventListener('submit', function(e) {
    e.preventDefault();
    const monto = parseFloat(document.getElementById('gasto-monto').value);
    const tipo = document.getElementById('gasto-tipo').value;
    const turno = document.getElementById('gasto-turno').value;
    const desc = document.getElementById('gasto-desc').value.trim();
    if (isNaN(monto) || monto <= 0 || !tipo || !turno) return;
    gastos.push({
        monto,
        tipo,
        turno,
        desc,
        fecha: getTodayStr(),
        hora: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    });
    saveData({ventas, gastos, gastosFijos});
    document.getElementById('gasto-monto').value = '';
    document.getElementById('gasto-tipo').value = '';
    document.getElementById('gasto-turno').value = '';
    document.getElementById('gasto-desc').value = '';
    actualizarResumen();
    actualizarHistorial();
    actualizarReportes();
});

// Registro de gastos fijos
document.getElementById('form-fijos').addEventListener('submit', function(e) {
    e.preventDefault();
    gastosFijos = {
        alquiler: parseFloat(document.getElementById('fijo-alquiler').value) || 0,
        luz: parseFloat(document.getElementById('fijo-luz').value) || 0,
        agua: parseFloat(document.getElementById('fijo-agua').value) || 0,
        gas: parseFloat(document.getElementById('fijo-gas').value) || 0,
        personal: parseFloat(document.getElementById('fijo-personal').value) || 0
    };
    saveData({ventas, gastos, gastosFijos});
    alert('¡Gastos fijos guardados!');
    actualizarReportes();
});

// Resumen del día
function actualizarResumen() {
    const hoy = getTodayStr();
    const ventasHoy = ventas.filter(v => v.fecha === hoy).reduce((sum, v) => sum + v.monto, 0);
    const gastosHoy = gastos.filter(g => g.fecha === hoy).reduce((sum, g) => sum + g.monto, 0);
    const gananciaHoy = ventasHoy - gastosHoy;
    document.getElementById('ventas-dia').textContent = `S/ ${ventasHoy.toFixed(2)}`;
    document.getElementById('gastos-dia').textContent = `S/ ${gastosHoy.toFixed(2)}`;
    document.getElementById('ganancia-dia').textContent = `S/ ${gananciaHoy.toFixed(2)}`;
}

// Historial con formato amigable y badges
function actualizarHistorial() {
    const listaVentas = document.getElementById('lista-ventas');
    listaVentas.innerHTML = '';
    ventas.slice().reverse().forEach((v) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="badge badge-venta">Venta</span>
            <strong>${formatearFechaAmigable(v.fecha)}</strong>
            <span>Turno: ${v.turno}</span>
            <span>Monto: <b>S/ ${v.monto.toFixed(2)}</b></span>
            <span style="font-size:0.9em;color:#888;">${v.hora ? `[${v.hora}]` : ''}</span>
        `;
        listaVentas.appendChild(li);
    });
    const listaGastos = document.getElementById('lista-gastos');
    listaGastos.innerHTML = '';
    gastos.slice().reverse().forEach((g) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="badge badge-gasto">Gasto</span>
            <strong>${formatearFechaAmigable(g.fecha)}</strong>
            <span>Turno: ${g.turno}</span>
            <span>Tipo: ${g.tipo}</span>
            <span>Monto: <b>S/ ${g.monto.toFixed(2)}</b></span>
            ${g.desc ? `<span>(${g.desc})</span>` : ''}
            <span style="font-size:0.9em;color:#888;">${g.hora ? `[${g.hora}]` : ''}</span>
        `;
        listaGastos.appendChild(li);
    });
}

// Reportes y gráficos
let graficoVentas, graficoGanancias, graficoComparativa;

function actualizarReportes() {
    // Agrupar ventas/gastos por día del mes actual
    const hoy = getTodayStr();
    const mesActual = getMonthStr(hoy);
    const diasMes = {};
    ventas.forEach(v => {
        if (getMonthStr(v.fecha) === mesActual) {
            if (!diasMes[v.fecha]) diasMes[v.fecha] = {ventas: 0, gastos: 0};
            diasMes[v.fecha].ventas += v.monto;
        }
    });
    gastos.forEach(g => {
        if (getMonthStr(g.fecha) === mesActual) {
            if (!diasMes[g.fecha]) diasMes[g.fecha] = {ventas: 0, gastos: 0};
            diasMes[g.fecha].gastos += g.monto;
        }
    });

    // Datos para gráfico de ventas y ganancias diarias
    const labelsDias = Object.keys(diasMes).sort();
    const dataVentas = labelsDias.map(d => diasMes[d].ventas);
    const dataGanancias = labelsDias.map(d => diasMes[d].ventas - diasMes[d].gastos);

    // Gráfico de ventas diarias
    if (graficoVentas) graficoVentas.destroy();
    graficoVentas = new Chart(document.getElementById('grafico-ventas'), {
        type: 'bar',
        data: {
            labels: labelsDias,
            datasets: [{
                label: 'Ventas diarias (S/)',
                data: dataVentas,
                backgroundColor: '#2b6cb0'
            }]
        },
        options: {
            responsive: true,
            plugins: {legend: {display: false}},
            scales: {y: {beginAtZero: true}}
        }
    });

    // Gráfico de ganancias diarias
    if (graficoGanancias) graficoGanancias.destroy();
    graficoGanancias = new Chart(document.getElementById('grafico-ganancias'), {
        type: 'line',
        data: {
            labels: labelsDias,
            datasets: [{
                label: 'Ganancia diaria (S/)',
                data: dataGanancias,
                borderColor: '#38a169',
                backgroundColor: 'rgba(56,161,105,0.2)',
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {legend: {display: false}},
            scales: {y: {beginAtZero: true}}
        }
    });

    // Resumen mensual y comparativa de meses
    const resumenMeses = {};
    ventas.forEach(v => {
        const mes = getMonthStr(v.fecha);
        if (!resumenMeses[mes]) resumenMeses[mes] = {ventas: 0, gastos: 0};
        resumenMeses[mes].ventas += v.monto;
    });
    gastos.forEach(g => {
        const mes = getMonthStr(g.fecha);
        if (!resumenMeses[mes]) resumenMeses[mes] = {ventas: 0, gastos: 0};
        resumenMeses[mes].gastos += g.monto;
    });

    // Aplicar gastos fijos
    Object.keys(resumenMeses).forEach(mes => {
        resumenMeses[mes].gastosFijos = Object.values(gastosFijos).reduce((a,b)=>a+b,0);
        resumenMeses[mes].gananciaNeta = resumenMeses[mes].ventas - resumenMeses[mes].gastos - resumenMeses[mes].gastosFijos;
    });

    // Tabla resumen mensual
    const tbody = document.querySelector('#tabla-mensual tbody');
    tbody.innerHTML = '';
    Object.keys(resumenMeses).sort().reverse().forEach(mes => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${getMonthName(mes)}</td>
            <td>S/ ${resumenMeses[mes].ventas.toFixed(2)}</td>
            <td>S/ ${(resumenMeses[mes].gastos + resumenMeses[mes].gastosFijos).toFixed(2)}</td>
            <td>S/ ${resumenMeses[mes].gananciaNeta.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
    });

    // Gráfico comparativa de meses
    const labelsMeses = Object.keys(resumenMeses).sort();
    const dataGananciaMes = labelsMeses.map(m => resumenMeses[m].gananciaNeta);
    if (graficoComparativa) graficoComparativa.destroy();
    graficoComparativa = new Chart(document.getElementById('grafico-comparativa'), {
        type: 'bar',
        data: {
            labels: labelsMeses.map(getMonthName),
            datasets: [{
                label: 'Ganancia Neta Mensual (S/)',
                data: dataGananciaMes,
                backgroundColor: '#ed8936'
            }]
        },
        options: {
            responsive: true,
            plugins: {legend: {display: false}},
            scales: {y: {beginAtZero: true}}
        }
    });

    // Mostrar gastos fijos en formulario
    document.getElementById('fijo-alquiler').value = gastosFijos.alquiler || '';
    document.getElementById('fijo-luz').value = gastosFijos.luz || '';
    document.getElementById('fijo-agua').value = gastosFijos.agua || '';
    document.getElementById('fijo-gas').value = gastosFijos.gas || '';
    document.getElementById('fijo-personal').value = gastosFijos.personal || '';
}

// Inicializar todo
actualizarResumen();
actualizarHistorial();
actualizarReportes();
// Descargar el resumen mensual como PDF
document.getElementById('descargar-pdf').addEventListener('click', function() {
    const tabla = document.getElementById('tabla-mensual');
    html2canvas(tabla).then(function(canvas) {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new window.jspdf.jsPDF({
            orientation: 'landscape',
            unit: 'pt',
            format: 'a4'
        });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const imgWidth = pageWidth - 40;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        pdf.text('Reporte Mensual - Panadería', 40, 40);
        pdf.addImage(imgData, 'PNG', 20, 60, imgWidth, imgHeight);
        pdf.save('reporte-mensual.pdf');
    });
});
/* --- Lógica para ventas de días anteriores --- */

// Establecer el máximo de fecha al día de hoy en el input de fecha
document.getElementById('venta-anterior-fecha').max = (new Date()).toISOString().slice(0,10);

document.getElementById('form-venta-anterior').addEventListener('submit', function(e) {
    e.preventDefault();
    const monto = parseFloat(document.getElementById('venta-anterior-monto').value);
    const turno = document.getElementById('venta-anterior-turno').value;
    const fecha = document.getElementById('venta-anterior-fecha').value;
    if (isNaN(monto) || monto <= 0 || !turno || !fecha) return;
    ventas.push({
        monto,
        turno,
        fecha,
        hora: "Registro manual"
    });
    saveData({ventas, gastos, gastosFijos});
    document.getElementById('venta-anterior-monto').value = '';
    document.getElementById('venta-anterior-turno').value = '';
    document.getElementById('venta-anterior-fecha').value = '';
    actualizarResumen();
    actualizarHistorial();
    actualizarReportes();
    alert('¡Venta anterior registrada!');
});
// Mostrar/ocultar la sección de venta anterior
document.getElementById('toggle-venta-anterior').addEventListener('click', function() {
    const seccion = document.getElementById('seccion-venta-anterior');
    if (seccion.style.display === 'none' || seccion.style.display === '') {
        seccion.style.display = 'block';
    } else {
        seccion.style.display = 'none';
    }
});
