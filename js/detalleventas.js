let datos = [];
let datosFiltrados = [];

async function obtenerDetalleVentas() {
  try {
    const respuesta = await fetch('http://localhost:3000/detalle-venta');
    datos = await respuesta.json();
    datosFiltrados = [...datos];
    dibujarTabla(datos);
  } catch (error) {
    console.error('Error al obtener detalle de ventas:', error);
  }
}

function dibujarTabla(detalles) {
  const tablaBody = document.getElementById('tabla-detalle-body');
  tablaBody.innerHTML = '';

  detalles.forEach(detalle => {
    const fila = document.createElement('tr');
    fila.classList.add('border-b');

    fila.innerHTML = `
      <td class="px-4 py-2">${detalle.productos?.modelo || 'N/A'}</td>
      <td class="px-4 py-2">${detalle.ventas?.clientes?.nombre || 'N/A'}</td>
      <td class="px-4 py-2">${detalle.cantidad}</td>
      <td class="px-4 py-2">${detalle.precio_unitario} Bs.</td>
      <td class="px-4 py-2">${detalle.subtotal} Bs.</td>
      <td class="px-4 py-2 text-center celda-acciones hidden">
        <button 
          class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs font-medium"
          onclick="eliminarDetalleIndividual(${detalle.id_detalle})"
          title="Eliminar este detalle">
          <i data-lucide="trash" class="w-4 h-4 inline"></i>
          Eliminar
        </button>
      </td>
    `;
    
    tablaBody.appendChild(fila);
  });

  document.getElementById('contador-filas').textContent = detalles.length + ' resultados encontrados';
  
  // Reinicializar los iconos de Lucide
  lucide.createIcons();
}

function aplicarFiltro() {
  const idDetalle = document.getElementById('filtro-id-detalle').value;
  const idVenta = document.getElementById('filtro-id-venta').value;
  const idProducto = document.getElementById('filtro-id-producto').value;
  const precio = document.getElementById('filtro-precio').value;
  const cedula = document.getElementById('filtro-cliente-ci').value;
  const fechaInicio = document.getElementById('filtro-fecha-inicio').value;
  const fechaFin = document.getElementById('filtro-fecha-fin').value;

  datosFiltrados = [...datos];

  if (idDetalle) datosFiltrados = datosFiltrados.filter(d => d.id_detalle == idDetalle);
  if (idVenta) datosFiltrados = datosFiltrados.filter(d => d.id_venta == idVenta);
  if (idProducto) datosFiltrados = datosFiltrados.filter(d => d.id_producto == idProducto);
  if (precio) datosFiltrados = datosFiltrados.filter(d => parseFloat(d.precio_unitario) == parseFloat(precio));
  
  if (cedula) {
    datosFiltrados = datosFiltrados.filter(d => (d.ventas?.clientes?.ci || '').toString().includes(cedula));
  }

  if (fechaInicio) {
    const inicio = new Date(fechaInicio);
    datosFiltrados = datosFiltrados.filter(d => {
      const fecha = new Date(d.ventas?.fecha_venta);
      return fecha >= inicio;
    });
  }

  if (fechaFin) {
    const fin = new Date(fechaFin);
    fin.setHours(23, 59, 59, 999);
    datosFiltrados = datosFiltrados.filter(d => {
      const fecha = new Date(d.ventas?.fecha_venta);
      return fecha <= fin;
    });
  }

  dibujarTabla(datosFiltrados);
  mostrarOcultarAcciones();
}

function limpiarFiltros() {
  document.getElementById('filtro-id-detalle').value = '';
  document.getElementById('filtro-id-venta').value = '';
  document.getElementById('filtro-id-producto').value = '';
  document.getElementById('filtro-precio').value = '';
  document.getElementById('filtro-cliente-ci').value = '';
  document.getElementById('filtro-fecha-inicio').value = '';
  document.getElementById('filtro-fecha-fin').value = '';
  datosFiltrados = [...datos];
  dibujarTabla(datos);
  mostrarOcultarAcciones();
}

function mostrarOcultarAcciones() {
  const encabezadoAcciones = document.getElementById('encabezado-acciones');
  const celdasAcciones = document.querySelectorAll('.celda-acciones');
  const btnEliminarLote = document.getElementById('btnEliminarLote');
  const hayFiltro = datosFiltrados.length < datos.length;

  if (hayFiltro && datosFiltrados.length > 0) {
    encabezadoAcciones.classList.remove('hidden');
    celdasAcciones.forEach(celda => celda.classList.remove('hidden'));
    btnEliminarLote.classList.remove('hidden');
  } else {
    encabezadoAcciones.classList.add('hidden');
    celdasAcciones.forEach(celda => celda.classList.add('hidden'));
    btnEliminarLote.classList.add('hidden');
  }
}

function mostrarAlertaConfirmacion(titulo, mensaje) {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.id = 'modal-confirmacion';

    const contenido = document.createElement('div');

    const iconoContenedor = document.createElement('div');
    iconoContenedor.className = 'modal-icono';
    iconoContenedor.innerHTML = '<i data-lucide="alert-circle"></i>';

    const tituloElem = document.createElement('h3');
    tituloElem.className = 'modal-titulo';
    tituloElem.textContent = titulo;

    const mensajeElem = document.createElement('p');
    mensajeElem.className = 'modal-mensaje';
    mensajeElem.textContent = mensaje;

    const botonesContenedor = document.createElement('div');
    botonesContenedor.className = 'modal-botones';

    const btnCancelar = document.createElement('button');
    btnCancelar.className = 'modal-btn-cancelar';
    btnCancelar.textContent = 'Cancelar';
    btnCancelar.onclick = () => {
      modal.remove();
      resolve(false);
    };

    const btnEliminar = document.createElement('button');
    btnEliminar.className = 'modal-btn-eliminar';
    btnEliminar.textContent = 'Eliminar';
    btnEliminar.onclick = () => {
      modal.remove();
      resolve(true);
    };

    botonesContenedor.appendChild(btnCancelar);
    botonesContenedor.appendChild(btnEliminar);

    contenido.appendChild(iconoContenedor);
    contenido.appendChild(tituloElem);
    contenido.appendChild(mensajeElem);
    contenido.appendChild(botonesContenedor);

    modal.appendChild(contenido);
    document.body.appendChild(modal);

    lucide.createIcons();
  });
}

async function eliminarDetalleIndividual(idDetalle) {
  if (!await mostrarAlertaConfirmacion('Eliminar Detalle de Venta', '¿Estás seguro de que deseas eliminar este detalle de venta?\n\nNota: Se eliminará de ambas tablas (Detalle de Ventas y Ventas).')) {
    return;
  }

  try {
    const detalleAEliminar = datos.find(d => d.id_detalle === idDetalle);
    const idVenta = detalleAEliminar?.id_venta;

    const respuesta = await fetch(`http://localhost:3000/detalle-venta/${idDetalle}`, {
      method: 'DELETE'
    });

    if (respuesta.ok) {
      datos = datos.filter(d => d.id_detalle !== idDetalle);
      datosFiltrados = datosFiltrados.filter(d => d.id_detalle !== idDetalle);
      
      if (idVenta) {
        try {
          await fetch(`http://localhost:3000/ventas/${idVenta}`, {
            method: 'DELETE'
          });
        } catch (error) {
          console.error('Error al eliminar venta asociada:', error);
        }
      }
      
      dibujarTabla(datosFiltrados);
      mostrarAlertaExito('Detalle eliminado correctamente', 'El detalle de venta y su venta asociada han sido eliminados.');
    } else {
      mostrarAlertaError('Error', 'No se pudo eliminar el detalle de venta.');
    }
  } catch (error) {
    console.error('Error al eliminar detalle:', error);
    mostrarAlertaError('Error', 'Ocurrió un error al eliminar el detalle.');
  }
}

async function eliminarEnLote() {
  if (!await mostrarAlertaConfirmacion('Eliminar Lote de Detalles', `¿Estás seguro de que deseas eliminar los ${datosFiltrados.length} detalles de venta seleccionados?\n\nNota: Se eliminarán también las ventas asociadas.`)) {
    return;
  }

  try {
    const idsAEliminar = datosFiltrados.map(d => d.id_detalle);
    const idsVentasAEliminar = [...new Set(datosFiltrados.map(d => d.id_venta).filter(id => id))];

    const respuesta = await fetch('http://localhost:3000/detalle-venta/eliminar-lote', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: idsAEliminar })
    });

    if (respuesta.ok) {
      if (idsVentasAEliminar.length > 0) {
        try {
          await fetch('http://localhost:3000/ventas/eliminar-lote', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: idsVentasAEliminar })
          });
        } catch (error) {
          console.error('Error al eliminar ventas asociadas:', error);
        }
      }

      datos = datos.filter(d => !idsAEliminar.includes(d.id_detalle));
      datosFiltrados = [];
      
      limpiarFiltros();
      mostrarAlertaExito('Registros eliminados', `Se han eliminado ${idsAEliminar.length} detalles de venta y sus ventas asociadas.`);
    } else {
      mostrarAlertaError('Error', 'No se pudieron eliminar los registros.');
    }
  } catch (error) {
    console.error('Error al eliminar en lote:', error);
    mostrarAlertaError('Error', 'Ocurrió un error al eliminar los registros.');
  }
}

function mostrarAlertaExito(titulo, mensaje) {
  const modal = document.createElement('div');
  modal.id = 'modal-confirmacion';

  const contenido = document.createElement('div');

  const iconoContenedor = document.createElement('div');
  iconoContenedor.className = 'modal-icono modal-icono-exito';
  iconoContenedor.innerHTML = '<i data-lucide="check-circle"></i>';

  const tituloElem = document.createElement('h3');
  tituloElem.className = 'modal-titulo';
  tituloElem.textContent = titulo;

  const mensajeElem = document.createElement('p');
  mensajeElem.className = 'modal-mensaje';
  mensajeElem.textContent = mensaje;

  const btnOk = document.createElement('button');
  btnOk.className = 'modal-btn-eliminar';
  btnOk.textContent = 'Aceptar';
  btnOk.style.width = '100%';
  btnOk.onclick = () => modal.remove();

  contenido.appendChild(iconoContenedor);
  contenido.appendChild(tituloElem);
  contenido.appendChild(mensajeElem);
  contenido.appendChild(btnOk);

  modal.appendChild(contenido);
  document.body.appendChild(modal);

  lucide.createIcons();
}

function mostrarAlertaError(titulo, mensaje) {
  const modal = document.createElement('div');
  modal.id = 'modal-confirmacion';

  const contenido = document.createElement('div');

  const iconoContenedor = document.createElement('div');
  iconoContenedor.className = 'modal-icono';
  iconoContenedor.innerHTML = '<i data-lucide="x-circle"></i>';

  const tituloElem = document.createElement('h3');
  tituloElem.className = 'modal-titulo';
  tituloElem.textContent = titulo;

  const mensajeElem = document.createElement('p');
  mensajeElem.className = 'modal-mensaje';
  mensajeElem.textContent = mensaje;

  const btnOk = document.createElement('button');
  btnOk.className = 'modal-btn-eliminar';
  btnOk.textContent = 'Aceptar';
  btnOk.style.width = '100%';
  btnOk.onclick = () => modal.remove();

  contenido.appendChild(iconoContenedor);
  contenido.appendChild(tituloElem);
  contenido.appendChild(mensajeElem);
  contenido.appendChild(btnOk);

  modal.appendChild(contenido);
  document.body.appendChild(modal);

  lucide.createIcons();
}

function exportarPDF() {
  const idDetalle = document.getElementById('filtro-id-detalle').value;
  const idVenta = document.getElementById('filtro-id-venta').value;
  const idProducto = document.getElementById('filtro-id-producto').value;
  const precio = document.getElementById('filtro-precio').value;
  const cedula = document.getElementById('filtro-cliente-ci').value;
  const fechaInicio = document.getElementById('filtro-fecha-inicio').value;
  const fechaFin = document.getElementById('filtro-fecha-fin').value;

  let datosExportar = [...datos];

  if (idDetalle) datosExportar = datosExportar.filter(d => d.id_detalle == idDetalle);
  if (idVenta) datosExportar = datosExportar.filter(d => d.id_venta == idVenta);
  if (idProducto) datosExportar = datosExportar.filter(d => d.id_producto == idProducto);
  if (precio) datosExportar = datosExportar.filter(d => parseFloat(d.precio_unitario) == parseFloat(precio));
  if (cedula) datosExportar = datosExportar.filter(d => (d.ventas?.clientes?.ci || '').toString().includes(cedula));
  
  if (fechaInicio) {
    const inicio = new Date(fechaInicio);
    datosExportar = datosExportar.filter(d => new Date(d.ventas?.fecha_venta) >= inicio);
  }

  if (fechaFin) {
    const fin = new Date(fechaFin);
    fin.setHours(23, 59, 59, 999);
    datosExportar = datosExportar.filter(d => new Date(d.ventas?.fecha_venta) <= fin);
  }

  fetch('http://localhost:3000/detalle-venta/export/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: datosExportar })
  })
  .then(res => res.blob())
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'detalle-ventas.pdf';
    a.click();
    window.URL.revokeObjectURL(url);
  })
  .catch(error => console.error('Error al exportar PDF:', error));
}

document.addEventListener('DOMContentLoaded', () => {
  obtenerDetalleVentas();
  const btnExportPDF = document.getElementById('btnExportPDF');
  if (btnExportPDF) {
    btnExportPDF.addEventListener('click', exportarPDF);
  }
});