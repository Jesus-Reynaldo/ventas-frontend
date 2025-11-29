// CONFIGURACIÓN 
const API_URL = 'http://localhost:3000';

let productosDisponibles = [];
let inventarioDisponible = [];
let carrito = [];
let clienteSeleccionado = null;

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
    cargarProductosYStock();
    cargarFiltros();
    lucide.createIcons();
    
    // Enter key en búsqueda de cliente
    document.getElementById('clienteCI').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            buscarCliente();
        }
    });
});

// FUNCIONES DE CARGA INICIAL
async function cargarProductosYStock() {
    try {
        // Cargar productos e inventario en paralelo
        const [productosRes, inventarioRes] = await Promise.all([
            fetch(`${API_URL}/productos`),
            fetch(`${API_URL}/inventario`)
        ]);

        if (!productosRes.ok || !inventarioRes.ok) {
            throw new Error('Error al cargar datos');
        }

        productosDisponibles = await productosRes.json();
        inventarioDisponible = await inventarioRes.json();

        // Combinar productos con su stock
        productosDisponibles = productosDisponibles.map(producto => {
            const inventario = inventarioDisponible.find(
                inv => inv.id_producto === producto.id_producto
            );
            return {
                ...producto,
                stock_actual: inventario?.stock_actual || 0,
                stock_minimo: inventario?.stock_minimo || 0,
                id_inventario: inventario?.id_inventario || null
            };
        });

        mostrarProductos(productosDisponibles);
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al cargar productos', 'error');
    }
}

async function cargarFiltros() {
    try {
        const response = await fetch(`${API_URL}/productos`);
        const productos = await response.json();

        // Extraer marcas únicas
        const marcas = [...new Set(productos.map(p => p.marca))].sort();
        const selectMarca = document.getElementById('busquedaMarca');
        marcas.forEach(marca => {
            const option = document.createElement('option');
            option.value = marca;
            option.textContent = marca;
            selectMarca.appendChild(option);
        });

        // Extraer medidas únicas
        const medidas = [...new Set(productos.map(p => p.medida))].sort();
        const selectMedida = document.getElementById('busquedaMedida');
        medidas.forEach(medida => {
            const option = document.createElement('option');
            option.value = medida;
            option.textContent = medida;
            selectMedida.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar filtros:', error);
    }
}

// BÚSQUEDA DE CLIENTE
async function buscarCliente() {
    const ci = document.getElementById('clienteCI').value.trim();

    if (!ci) {
        mostrarToast('Ingrese un CI válido', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/clientes/${ci}`);

        if (!response.ok) {
            if (response.status === 404) {
                mostrarToast('Cliente no encontrado', 'warning');
                limpiarCliente();
                return;
            }
            throw new Error('Error al buscar cliente');
        }

        const cliente = await response.json();
        clienteSeleccionado = cliente;

        // Mostrar información del cliente
        document.getElementById('clienteNombre').textContent = cliente.nombre;
        document.getElementById('clienteEmail').textContent = cliente.email || 'Sin email';
        document.getElementById('clienteTelefono').textContent = cliente.telefono || 'Sin teléfono';
        document.getElementById('clienteInfo').classList.remove('hidden');
        document.getElementById('sinClienteInfo').classList.add('hidden');

        mostrarToast(`Cliente encontrado: ${cliente.nombre}`, 'success');
        lucide.createIcons();
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al buscar cliente', 'error');
    }
}

function limpiarCliente() {
    clienteSeleccionado = null;
    document.getElementById('clienteCI').value = '';
    document.getElementById('clienteInfo').classList.add('hidden');
    document.getElementById('sinClienteInfo').classList.remove('hidden');
    lucide.createIcons();
}

// BÚSQUEDA Y VISUALIZACIÓN DE PRODUCTOS
function buscarProductos() {
    const modelo = document.getElementById('busquedaModelo').value.toLowerCase();
    const marca = document.getElementById('busquedaMarca').value;
    const medida = document.getElementById('busquedaMedida').value;

    const productosFiltrados = productosDisponibles.filter(producto => {
        const cumpleModelo = !modelo || producto.modelo.toLowerCase().includes(modelo);
        const cumpleMarca = !marca || producto.marca === marca;
        const cumpleMedida = !medida || producto.medida === medida;
        return cumpleModelo && cumpleMarca && cumpleMedida;
    });

    mostrarProductos(productosFiltrados);
}

function mostrarProductos(productos) {
    const tbody = document.getElementById('productosTabla');

    if (productos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="px-4 py-8 text-center text-gray-500">
                    No se encontraron productos
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = productos.map(producto => {
        const stockDisponible = producto.stock_actual || 0;
        const tieneStock = stockDisponible > 0;
        const stockBajo = stockDisponible <= producto.stock_minimo;

        return `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3">
                    <div>
                        <p class="font-semibold text-gray-800">${producto.modelo}</p>
                        <p class="text-xs text-gray-500">${producto.marca} - ${producto.medida}</p>
                        ${producto.color ? `<p class="text-xs text-gray-400">${producto.color}</p>` : ''}
                    </div>
                </td>
                <td class="px-4 py-3 text-center">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tieneStock 
                            ? (stockBajo ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800')
                            : 'bg-red-100 text-red-800'
                    }">
                        ${stockDisponible}
                    </span>
                </td>
                <td class="px-4 py-3 text-right">
                    <span class="font-semibold text-gray-800">Bs. ${Number(producto.precio_actual).toFixed(2)}</span>
                </td>
                <td class="px-4 py-3 text-center">
                    <button 
                        onclick="agregarAlCarrito(${producto.id_producto})"
                        ${!tieneStock ? 'disabled' : ''}
                        class="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1 mx-auto">
                        <i data-lucide="plus" class="w-4 h-4"></i>
                        Agregar
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    lucide.createIcons();
}

// GESTIÓN DEL CARRITO
function agregarAlCarrito(idProducto) {
    const producto = productosDisponibles.find(p => p.id_producto === idProducto);

    if (!producto) {
        mostrarToast('Producto no encontrado', 'error');
        return;
    }

    // Verificar stock disponible
    if (producto.stock_actual <= 0) {
        mostrarToast('Producto sin stock disponible', 'warning');
        return;
    }

    // Verificar si ya está en el carrito
    const itemExistente = carrito.find(item => item.id_producto === idProducto);

    if (itemExistente) {
        // Verificar stock antes de incrementar
        if (itemExistente.cantidad >= producto.stock_actual) {
            mostrarToast('No hay suficiente stock disponible', 'warning');
            return;
        }
        itemExistente.cantidad++;
    } else {
        // Agregar nuevo item
        carrito.push({
            id_producto: producto.id_producto,
            modelo: producto.modelo,
            marca: producto.marca,
            precio_unitario: Number(producto.precio_actual),
            cantidad: 1,
            stock_disponible: producto.stock_actual
        });
    }

    actualizarCarrito();
    mostrarToast(`${producto.modelo} agregado al carrito`, 'success');
}

function actualizarCantidad(idProducto, cambio) {
    const item = carrito.find(i => i.id_producto === idProducto);
    
    if (!item) return;

    const nuevaCantidad = item.cantidad + cambio;

    // Validar cantidad mínima
    if (nuevaCantidad < 1) {
        eliminarDelCarrito(idProducto);
        return;
    }

    // Validar stock disponible
    if (nuevaCantidad > item.stock_disponible) {
        mostrarToast('No hay suficiente stock disponible', 'warning');
        return;
    }

    item.cantidad = nuevaCantidad;
    actualizarCarrito();
}

function eliminarDelCarrito(idProducto) {
    carrito = carrito.filter(item => item.id_producto !== idProducto);
    actualizarCarrito();
    mostrarToast('Producto eliminado del carrito', 'info');
}

function limpiarCarrito() {
    if (carrito.length === 0) return;

    if (confirm('¿Está seguro de limpiar el carrito?')) {
        carrito = [];
        actualizarCarrito();
        mostrarToast('Carrito limpiado', 'info');
    }
}

function actualizarCarrito() {
    const carritoContainer = document.getElementById('carritoItems');

    if (carrito.length === 0) {
        carritoContainer.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <i data-lucide="shopping-bag" class="w-12 h-12 mx-auto mb-2 opacity-50"></i>
                <p class="text-sm">No hay productos en el carrito</p>
            </div>
        `;
        document.getElementById('btnProcesarVenta').disabled = true;
    } else {
        carritoContainer.innerHTML = carrito.map(item => {
            const subtotal = item.cantidad * item.precio_unitario;
            return `
                <div class="bg-gray-50 rounded-lg p-3">
                    <div class="flex justify-between items-start mb-2">
                        <div class="flex-1">
                            <p class="font-semibold text-sm text-gray-800">${item.modelo}</p>
                            <p class="text-xs text-gray-500">${item.marca}</p>
                        </div>
                        <button 
                            onclick="eliminarDelCarrito(${item.id_producto})"
                            class="text-red-500 hover:text-red-700">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <button 
                                onclick="actualizarCantidad(${item.id_producto}, -1)"
                                class="w-6 h-6 flex items-center justify-center bg-white border border-gray-300 rounded hover:bg-gray-100">
                                <i data-lucide="minus" class="w-3 h-3"></i>
                            </button>
                            <span class="font-semibold text-sm w-8 text-center">${item.cantidad}</span>
                            <button 
                                onclick="actualizarCantidad(${item.id_producto}, 1)"
                                class="w-6 h-6 flex items-center justify-center bg-white border border-gray-300 rounded hover:bg-gray-100">
                                <i data-lucide="plus" class="w-3 h-3"></i>
                            </button>
                        </div>
                        <span class="font-semibold text-sm text-indigo-600">Bs. ${subtotal.toFixed(2)}</span>
                    </div>
                </div>
            `;
        }).join('');
        document.getElementById('btnProcesarVenta').disabled = false;
    }

    // Actualizar totales
    const total = carrito.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);
    const cantidadTotal = carrito.reduce((sum, item) => sum + item.cantidad, 0);

    document.getElementById('subtotalCarrito').textContent = `Bs. ${total.toFixed(2)}`;
    document.getElementById('totalCarrito').textContent = `Bs. ${total.toFixed(2)}`;
    document.getElementById('cantidadProductos').textContent = cantidadTotal;

    lucide.createIcons();
}

// PROCESAR VENTA
async function procesarVenta() {
    if (carrito.length === 0) {
        mostrarToast('El carrito está vacío', 'warning');
        return;
    }

    const metodoPago = document.getElementById('metodoPago').value;

    // Preparar datos de la venta
    const ventaData = {
        ci: clienteSeleccionado ? clienteSeleccionado.ci : null,
        metodo_pago: metodoPago,
        detalle: carrito.map(item => ({
            id_producto: item.id_producto,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario
        }))
    };

    try {
        // Mostrar loading
        const btnProcesar = document.getElementById('btnProcesarVenta');
        btnProcesar.disabled = true;
        btnProcesar.innerHTML = `
            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Procesando...
        `;

        // Crear venta
        const response = await fetch(`${API_URL}/ventas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ventaData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al procesar la venta');
        }

        const venta = await response.json();

        // Actualizar inventario
        await actualizarInventario(carrito);

        // Mostrar éxito
        mostrarToast(`¡Venta procesada exitosamente! ID: ${venta.id_venta}`, 'success');

        // Limpiar formulario
        carrito = [];
        limpiarCliente();
        actualizarCarrito();
        await cargarProductosYStock();

        // Mostrar resumen
        mostrarResumenVenta(venta);

    } catch (error) {
        console.error('Error:', error);
        mostrarToast(error.message || 'Error al procesar la venta', 'error');
    } finally {
        // Restaurar botón
        const btnProcesar = document.getElementById('btnProcesarVenta');
        btnProcesar.disabled = false;
        btnProcesar.innerHTML = `
            <i data-lucide="check-circle" class="w-5 h-5"></i>
            Procesar Venta
        `;
        lucide.createIcons();
    }
}

async function actualizarInventario(items) {
    const promesas = items.map(async item => {
        const producto = productosDisponibles.find(p => p.id_producto === item.id_producto);
        
        if (!producto || !producto.id_inventario) return;

        const nuevoStock = producto.stock_actual - item.cantidad;

        return fetch(`${API_URL}/inventario/${producto.id_inventario}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                stock_actual: nuevoStock
            })
        });
    });

    await Promise.all(promesas);
}

function mostrarResumenVenta(venta) {
    const total = Number(venta.total).toFixed(2);
    const cliente = clienteSeleccionado ? clienteSeleccionado.nombre : 'Sin cliente';
    const fecha = new Date().toLocaleString('es-BO');

    const resumen = `
╔════════════════════════════════════╗
║     ✅ VENTA COMPLETADA           ║
╠════════════════════════════════════╣
║ ID Venta: ${venta.id_venta.toString().padEnd(24)}║
║ Cliente:  ${cliente.substring(0, 24).padEnd(24)}║
║ Total:    Bs. ${total.padEnd(20)}║
║ Método:   ${venta.metodo_pago.padEnd(24)}║
║ Fecha:    ${fecha.substring(0, 24).padEnd(24)}║
╠════════════════════════════════════╣
║    ¡Gracias por su compra!        ║
╚════════════════════════════════════╝
    `;

    alert(resumen);
}

// UTILIDADES
function mostrarToast(mensaje, tipo = 'info') {
    const container = document.getElementById('toastContainer');
    
    const colores = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-amber-500',
        info: 'bg-blue-500'
    };

    const iconos = {
        success: 'check-circle',
        error: 'x-circle',
        warning: 'alert-triangle',
        info: 'info'
    };

    const toast = document.createElement('div');
    toast.className = `${colores[tipo]} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 toast-enter`;
    toast.innerHTML = `
        <i data-lucide="${iconos[tipo]}" class="w-5 h-5"></i>
        <span>${mensaje}</span>
    `;

    container.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// UTILIDADES ADICIONALES

// Formatear moneda
function formatearMoneda(valor) {
    return `Bs. ${Number(valor).toFixed(2)}`;
}

// Validar número positivo
function esNumeroPositivo(valor) {
    return !isNaN(valor) && Number(valor) > 0;
}