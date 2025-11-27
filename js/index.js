// ============================================
// CONFIGURACIÓN
// ============================================
const API_URL = 'http://localhost:3000';

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar Lucide Icons
    lucide.createIcons();

    // Mostrar fecha actual
    mostrarFechaActual();

    // Cargar datos del dashboard
    cargarDatos();

    // Auto-actualizar cada 5 minutos
    setInterval(cargarDatos, 300000);
});

// ============================================
// FUNCIÓN PARA MOSTRAR FECHA ACTUAL
// ============================================
function mostrarFechaActual() {
    const fechaElement = document.getElementById('currentDate');
    if (fechaElement) {
        fechaElement.textContent = new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// ============================================
// FUNCIÓN PRINCIPAL PARA CARGAR DATOS
// ============================================
async function cargarDatos() {
    try {
        await Promise.all([
            cargarEstadisticas(),
            cargarTopProductos(),
            cargarUltimasVentas(),
            cargarStockBajo()
        ]);
        console.log('✅ Datos del dashboard cargados correctamente');
    } catch (error) {
        console.error('❌ Error cargando datos del dashboard:', error);
        mostrarError('Error al cargar los datos. Por favor, verifica tu conexión.');
    }
}

// ============================================
// CARGAR ESTADÍSTICAS PRINCIPALES
// ============================================
async function cargarEstadisticas() {
    try {
        const [ventas, productos, inventario, clientes] = await Promise.all([
            fetch(`${API_URL}/ventas`).then(r => r.json()),
            fetch(`${API_URL}/productos`).then(r => r.json()),
            fetch(`${API_URL}/inventario`).then(r => r.json()),
            fetch(`${API_URL}/clientes`).then(r => r.json())
        ]);

        // ========== VENTAS DE HOY ==========
        const hoy = new Date().toDateString();
        const ventasHoy = ventas.filter(v => {
            const fechaVenta = new Date(v.fecha_venta).toDateString();
            return fechaVenta === hoy;
        });
        
        const totalHoy = ventasHoy.reduce((sum, v) => {
            return sum + parseFloat(v.total || 0);
        }, 0);
        
        document.getElementById('ventasHoy').textContent = `Bs. ${totalHoy.toFixed(2)}`;
        document.getElementById('cantidadVentasHoy').textContent = ventasHoy.length;

        // ========== TOTAL PRODUCTOS ==========
        document.getElementById('totalProductos').textContent = productos.length;

        // ========== STOCK BAJO ==========
        const stockBajo = inventario.filter(i => i.stock_actual <= i.stock_minimo);
        document.getElementById('stockBajo').textContent = stockBajo.length;

        // ========== TOTAL CLIENTES ==========
        document.getElementById('totalClientes').textContent = clientes.length;

    } catch (error) {
        console.error('Error cargando estadísticas:', error);
        mostrarErrorEnElemento('ventasHoy', 'Error');
        mostrarErrorEnElemento('totalProductos', 'Error');
        mostrarErrorEnElemento('stockBajo', 'Error');
        mostrarErrorEnElemento('totalClientes', 'Error');
    }
}

// ============================================
// CARGAR TOP 5 PRODUCTOS MÁS VENDIDOS
// ============================================
async function cargarTopProductos() {
    try {
        const detalles = await fetch(`${API_URL}/detalle-venta`).then(r => r.json());
        
        // Agrupar productos por id y sumar cantidades
        const productosVendidos = {};
        
        detalles.forEach(detalle => {
            const idProducto = detalle.id_producto;
            
            if (!productosVendidos[idProducto]) {
                productosVendidos[idProducto] = {
                    producto: detalle.productos.modelo,
                    marca: detalle.productos.marca,
                    cantidad: 0
                };
            }
            
            productosVendidos[idProducto].cantidad += detalle.cantidad;
        });

        // Ordenar por cantidad y obtener top 5
        const top5 = Object.values(productosVendidos)
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 5);

        const tbody = document.getElementById('topProductos');
        
        if (top5.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="2" class="px-4 py-8 text-center text-gray-500">
                        No hay ventas registradas
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = top5.map(producto => `
                <tr class="table-row-hover">
                    <td class="px-4 py-3">
                        <div class="font-medium text-gray-800">${producto.producto}</div>
                        <div class="text-xs text-gray-500">${producto.marca}</div>
                    </td>
                    <td class="px-4 py-3 text-right">
                        <span class="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-semibold">
                            ${producto.cantidad}
                        </span>
                    </td>
                </tr>
            `).join('');
        }

    } catch (error) {
        console.error('Error cargando top productos:', error);
        document.getElementById('topProductos').innerHTML = `
            <tr>
                <td colspan="2" class="px-4 py-4 text-center text-red-500">
                    Error al cargar datos
                </td>
            </tr>
        `;
    }
}

// ============================================
// CARGAR ÚLTIMAS 5 VENTAS
// ============================================
async function cargarUltimasVentas() {
    try {
        const ventas = await fetch(`${API_URL}/ventas`).then(r => r.json());
        
        // Ordenar por fecha (más reciente primero) y tomar las 5 últimas
        const ultimas5 = ventas
            .sort((a, b) => new Date(b.fecha_venta) - new Date(a.fecha_venta))
            .slice(0, 5);

        const tbody = document.getElementById('ultimasVentas');
        
        if (ultimas5.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="2" class="px-4 py-8 text-center text-gray-500">
                        No hay ventas registradas
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = ultimas5.map(venta => {
                const nombreCliente = venta.clientes?.nombre || 'Cliente sin registro';
                const fechaVenta = new Date(venta.fecha_venta).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                const total = parseFloat(venta.total).toFixed(2);

                return `
                    <tr class="table-row-hover">
                        <td class="px-4 py-3">
                            <div class="font-medium text-gray-800">${nombreCliente}</div>
                            <div class="text-xs text-gray-500">${fechaVenta}</div>
                        </td>
                        <td class="px-4 py-3 text-right">
                            <span class="font-semibold text-gray-800">Bs. ${total}</span>
                        </td>
                    </tr>
                `;
            }).join('');
        }

    } catch (error) {
        console.error('Error cargando últimas ventas:', error);
        document.getElementById('ultimasVentas').innerHTML = `
            <tr>
                <td colspan="2" class="px-4 py-4 text-center text-red-500">
                    Error al cargar datos
                </td>
            </tr>
        `;
    }
}

// ============================================
// CARGAR PRODUCTOS CON STOCK BAJO
// ============================================
async function cargarStockBajo() {
    try {
        const inventario = await fetch(`${API_URL}/inventario`).then(r => r.json());
        
        // Filtrar productos con stock bajo y ordenar por stock actual (menor a mayor)
        const stockBajo = inventario
            .filter(item => item.stock_actual <= item.stock_minimo)
            .sort((a, b) => a.stock_actual - b.stock_actual);

        const tbody = document.getElementById('stockBajoTabla');
        
        if (stockBajo.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="px-4 py-6 text-center text-green-600 font-medium">
                        ✓ Todos los productos tienen stock suficiente
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = stockBajo.map(item => {
                const producto = item.productos;
                return `
                    <tr class="table-row-hover">
                        <td class="px-4 py-3">
                            <div class="font-medium text-gray-800">${producto.modelo}</div>
                            <div class="text-xs text-gray-500">${producto.medida}</div>
                        </td>
                        <td class="px-4 py-3 text-gray-700">${producto.marca}</td>
                        <td class="px-4 py-3 text-right">
                            <span class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                                ${item.stock_actual}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-right text-gray-600">${item.stock_minimo}</td>
                    </tr>
                `;
            }).join('');
        }

    } catch (error) {
        console.error('Error cargando stock bajo:', error);
        document.getElementById('stockBajoTabla').innerHTML = `
            <tr>
                <td colspan="4" class="px-4 py-4 text-center text-red-500">
                    Error al cargar datos
                </td>
            </tr>
        `;
    }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function mostrarErrorEnElemento(elementId, mensaje) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = mensaje;
        element.classList.add('text-red-500');
    }
}

function mostrarError(mensaje) {
    // Puedes implementar un sistema de notificaciones más sofisticado aquí
    alert(mensaje);
}

// ============================================
// EXPORTAR FUNCIONES PARA USO GLOBAL
// ============================================
window.cargarDatos = cargarDatos;