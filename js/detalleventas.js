let datos = [];

async function obtenerDetalleVentas() {
  try {
    const respuesta = await fetch('http://localhost:3000/detalle-venta');
    datos = await respuesta.json();
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
      <td class="px-4 py-2">${detalle.id_detalle}</td>
      <td class="px-4 py-2">${detalle.id_venta}</td>
      <td class="px-4 py-2">${detalle.id_producto}</td>
      <td class="px-4 py-2">${detalle.productos?.modelo || 'N/A'}</td>
      <td class="px-4 py-2">${detalle.ventas?.clientes?.nombre || 'N/A'}</td>
      <td class="px-4 py-2">${detalle.cantidad}</td>
      <td class="px-4 py-2">${detalle.precio_unitario}</td>
      <td class="px-4 py-2">${detalle.subtotal}</td>
    `;
    
    tablaBody.appendChild(fila);
  });

  document.getElementById('contador-filas').textContent = detalles.length + ' resultados encontrados';
}

function aplicarFiltro() {
  const idDetalle = document.getElementById('filtro-id-detalle').value;
  const idVenta = document.getElementById('filtro-id-venta').value;
  const idProducto = document.getElementById('filtro-id-producto').value;
  const precio = document.getElementById('filtro-precio').value;
  const cedula = document.getElementById('filtro-cliente-ci').value;
  const fechaInicio = document.getElementById('filtro-fecha-inicio').value;
  const fechaFin = document.getElementById('filtro-fecha-fin').value;

  let filtrados = datos;

  if (idDetalle) filtrados = filtrados.filter(d => d.id_detalle == idDetalle);
  if (idVenta) filtrados = filtrados.filter(d => d.id_venta == idVenta);
  if (idProducto) filtrados = filtrados.filter(d => d.id_producto == idProducto);
  if (precio) filtrados = filtrados.filter(d => parseFloat(d.precio_unitario) == parseFloat(precio));
  
  if (cedula) {
    filtrados = filtrados.filter(d => (d.ventas?.clientes?.ci || '').toString().includes(cedula));
  }

  if (fechaInicio) {
    const inicio = new Date(fechaInicio);
    filtrados = filtrados.filter(d => {
      const fecha = new Date(d.ventas?.fecha_venta);
      return fecha >= inicio;
    });
  }

  if (fechaFin) {
    const fin = new Date(fechaFin);
    fin.setHours(23, 59, 59, 999);
    filtrados = filtrados.filter(d => {
      const fecha = new Date(d.ventas?.fecha_venta);
      return fecha <= fin;
    });
  }

  dibujarTabla(filtrados);
}

function limpiarFiltros() {
  document.getElementById('filtro-id-detalle').value = '';
  document.getElementById('filtro-id-venta').value = '';
  document.getElementById('filtro-id-producto').value = '';
  document.getElementById('filtro-precio').value = '';
  document.getElementById('filtro-cliente-ci').value = '';
  document.getElementById('filtro-fecha-inicio').value = '';
  document.getElementById('filtro-fecha-fin').value = '';
  dibujarTabla(datos);
}

document.addEventListener('DOMContentLoaded', obtenerDetalleVentas);