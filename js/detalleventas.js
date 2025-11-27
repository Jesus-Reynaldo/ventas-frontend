async function obtenerDetalleVentas() {
  try {
    const respuesta = await fetch('http://localhost:3000/detalle-venta');
    const datos = await respuesta.json();
    console.log(datos); // Aquí puedes renderizar los datos en tu HTML
  } catch (error) {
    console.error('Error al obtener detalle de ventas:', error);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const tablaBody = document.getElementById('tabla-detalle-body');

  try {
    const respuesta = await fetch('http://localhost:3000/detalle-venta');
    const detalles = await respuesta.json();

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
  } catch (error) {
    console.error('Error al cargar los detalles de venta:', error);
  }
});
