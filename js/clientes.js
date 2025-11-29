// CONFIGURACIÓN
const API_URL = 'http://localhost:3000';

// Variables globales
let modoEdicion = false;
let ciOriginal = null;
let clientesData = [];
let clienteAEliminar = null;

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar Lucide Icons
    lucide.createIcons();

    // Cargar clientes al iniciar
    cargarClientes();

    // Event listener para el formulario
    document.getElementById('formCliente').addEventListener('submit', handleSubmit);

    // Cerrar modal al hacer clic fuera
    document.getElementById('modalCliente').addEventListener('click', (e) => {
        if (e.target.id === 'modalCliente') {
            cerrarModal();
        }
    });

    // Cerrar modal de eliminar al hacer clic fuera
    document.getElementById('modalConfirmarEliminar').addEventListener('click', (e) => {
        if (e.target.id === 'modalConfirmarEliminar') {
            cerrarModalEliminar();
        }
    });
});

// CARGAR CLIENTES DESDE LA API
async function cargarClientes() {
    try {
        const response = await fetch(`${API_URL}/clientes`);
        
        if (!response.ok) {
            throw new Error('Error al cargar clientes');
        }

        clientesData = await response.json();
        renderizarClientes(clientesData);
        
        console.log('✅ Clientes cargados:', clientesData.length);

    } catch (error) {
        console.error('❌ Error:', error);
        mostrarError('No se pudieron cargar los clientes. Verifica tu conexión con el servidor.');
        
        document.getElementById('tablaClientes').innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-8 text-center">
                    <div class="empty-state">
                        <i data-lucide="alert-circle" class="w-16 h-16 mx-auto mb-4 text-red-400"></i>
                        <p class="text-gray-700 font-semibold mb-2">Error al cargar clientes</p>
                        <p class="text-gray-500 text-sm">Verifica que el servidor esté funcionando</p>
                        <button onclick="cargarClientes()" class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                            Reintentar
                        </button>
                    </div>
                </td>
            </tr>
        `;
        lucide.createIcons();
    }
}

// RENDERIZAR CLIENTES EN LA TABLA
function renderizarClientes(clientes) {
    const tbody = document.getElementById('tablaClientes');
    
    if (clientes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-8 text-center">
                    <div class="empty-state">
                        <i data-lucide="users" class="w-16 h-16 mx-auto mb-4 text-gray-300"></i>
                        <p class="text-gray-700 font-semibold mb-2">No hay clientes registrados</p>
                        <p class="text-gray-500 text-sm">Comienza agregando tu primer cliente</p>
                        <button onclick="abrirModal()" class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 mx-auto">
                            <i data-lucide="user-plus" class="w-4 h-4"></i>
                            Nuevo Cliente
                        </button>
                    </div>
                </td>
            </tr>
        `;
        lucide.createIcons();
        return;
    }

    tbody.innerHTML = clientes.map(cliente => `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="font-semibold text-gray-800">${cliente.ci}</span>
            </td>
            <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                        ${cliente.nombre.charAt(0).toUpperCase()}
                    </div>
                    <span class="font-medium text-gray-800">${cliente.nombre}</span>
                </div>
            </td>
            <td class="px-6 py-4">
                <span class="text-gray-600">${cliente.email || '<span class="text-gray-400 italic">No registrado</span>'}</span>
            </td>
            <td class="px-6 py-4">
                <span class="text-gray-600">${cliente.telefono || '<span class="text-gray-400 italic">No registrado</span>'}</span>
            </td>
            <td class="px-6 py-4">
                <span class="text-gray-600 text-sm">${cliente.direccion ? (cliente.direccion.length > 40 ? cliente.direccion.substring(0, 40) + '...' : cliente.direccion) : '<span class="text-gray-400 italic">No registrada</span>'}</span>
            </td>
            <td class="px-6 py-4">
                <div class="flex items-center justify-center gap-2">
                    <button onclick="editarCliente(${cliente.ci})" class="btn-action btn-editar" title="Editar">
                        <i data-lucide="edit" class="w-4 h-4"></i>
                    </button>
                    <button onclick="confirmarEliminar(${cliente.ci}, '${cliente.nombre.replace(/'/g, "\\'")}', '${cliente.email || ''}')" class="btn-action btn-eliminar" title="Eliminar">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    lucide.createIcons();
}

// FILTRAR CLIENTES (BÚSQUEDA)
function filtrarClientes() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    if (searchTerm === '') {
        renderizarClientes(clientesData);
        return;
    }

    const clientesFiltrados = clientesData.filter(cliente => {
        return (
            cliente.ci.toString().includes(searchTerm) ||
            cliente.nombre.toLowerCase().includes(searchTerm) ||
            (cliente.email && cliente.email.toLowerCase().includes(searchTerm)) ||
            (cliente.telefono && cliente.telefono.includes(searchTerm))
        );
    });

    renderizarClientes(clientesFiltrados);
}

// ABRIR MODAL (NUEVO CLIENTE)
function abrirModal() {
    modoEdicion = false;
    ciOriginal = null;
    
    document.getElementById('modalTitulo').innerHTML = `
        <i data-lucide="user-plus" class="w-6 h-6"></i>
        Nuevo Cliente
    `;
    
    // Cambiar texto del botón guardar
    const btnSubmit = document.querySelector('#formCliente button[type="submit"]');
    btnSubmit.innerHTML = `
        <i data-lucide="save" class="w-5 h-5"></i>
        Guardar Cliente
    `;
    
    document.getElementById('formCliente').reset();
    document.getElementById('ci').disabled = false;
    document.getElementById('ci').readOnly = false;
    
    document.getElementById('modalCliente').classList.remove('hidden');
    document.getElementById('modalCliente').classList.add('show');
    
    lucide.createIcons();
}

// CERRAR MODAL
function cerrarModal() {
    document.getElementById('modalCliente').classList.add('hidden');
    document.getElementById('modalCliente').classList.remove('show');
    document.getElementById('formCliente').reset();
    
    // Limpiar errores si existen
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
}

// MANEJAR ENVÍO DEL FORMULARIO
async function handleSubmit(e) {
    e.preventDefault();

    const formData = {
        ci: parseInt(document.getElementById('ci').value),
        nombre: document.getElementById('nombre').value.trim(),
        email: document.getElementById('email').value.trim() || null,
        telefono: document.getElementById('telefono').value.trim() || null,
        direccion: document.getElementById('direccion').value.trim() || null
    };

    // Validación básica
    if (!formData.ci || formData.ci <= 0) {
        mostrarError('El CI debe ser un número válido');
        document.getElementById('ci').classList.add('error');
        return;
    }

    if (!formData.nombre) {
        mostrarError('El nombre es obligatorio');
        document.getElementById('nombre').classList.add('error');
        return;
    }

    try {
        let response;

        if (modoEdicion) {
            // ACTUALIZAR cliente existente
            response = await fetch(`${API_URL}/clientes/${ciOriginal}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
        } else {
            // CREAR nuevo cliente
            response = await fetch(`${API_URL}/clientes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error en la operación');
        }

        const resultado = await response.json();
        console.log('✅ Operación exitosa:', resultado);

        // Mostrar mensaje de éxito
        mostrarExito(modoEdicion ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente');

        // Cerrar modal y recargar datos
        cerrarModal();
        await cargarClientes();

    } catch (error) {
        console.error('❌ Error:', error);
        mostrarError(error.message || 'Error al guardar el cliente');
    }
}

// EDITAR CLIENTE
async function editarCliente(ci) {
    try {
        const response = await fetch(`${API_URL}/clientes/${ci}`);
        
        if (!response.ok) {
            throw new Error('Cliente no encontrado');
        }

        const cliente = await response.json();
        
        modoEdicion = true;
        ciOriginal = ci;

        // Llenar formulario con datos del cliente
        document.getElementById('ci').value = cliente.ci;
        document.getElementById('nombre').value = cliente.nombre;
        document.getElementById('email').value = cliente.email || '';
        document.getElementById('telefono').value = cliente.telefono || '';
        document.getElementById('direccion').value = cliente.direccion || '';

        // En modo edición, permitir editar el CI también
        document.getElementById('ci').disabled = false;
        document.getElementById('ci').readOnly = false;

        // Cambiar título del modal
        document.getElementById('modalTitulo').innerHTML = `
            <i data-lucide="edit" class="w-6 h-6"></i>
            Editar Cliente - CI: ${ci}
        `;

        // Cambiar texto del botón guardar
        const btnSubmit = document.querySelector('#formCliente button[type="submit"]');
        btnSubmit.innerHTML = `
            <i data-lucide="save" class="w-5 h-5"></i>
            Actualizar Cliente
        `;

        // Abrir modal
        document.getElementById('modalCliente').classList.remove('hidden');
        document.getElementById('modalCliente').classList.add('show');
        
        lucide.createIcons();

    } catch (error) {
        console.error('❌ Error:', error);
        mostrarError('No se pudo cargar la información del cliente');
    }
}

// CONFIRMAR ELIMINACIÓN (ABRIR MODAL)
function confirmarEliminar(ci, nombre, email) {
    clienteAEliminar = ci;
    
    // Mostrar información del cliente en el modal
    document.getElementById('clienteEliminarInfo').innerHTML = `
        <strong>Cliente:</strong> ${nombre}<br>
        <strong>CI:</strong> ${ci}${email ? `<br><strong>Email:</strong> ${email}` : ''}
    `;
    
    // Abrir modal
    document.getElementById('modalConfirmarEliminar').classList.remove('hidden');
    document.getElementById('modalConfirmarEliminar').classList.add('show');
    
    lucide.createIcons();
}

// CERRAR MODAL DE CONFIRMACIÓN
function cerrarModalEliminar() {
    document.getElementById('modalConfirmarEliminar').classList.add('hidden');
    document.getElementById('modalConfirmarEliminar').classList.remove('show');
    clienteAEliminar = null;
}

// EJECUTAR ELIMINACIÓN
async function ejecutarEliminar() {
    if (!clienteAEliminar) return;
    
    try {
        const response = await fetch(`${API_URL}/clientes/${clienteAEliminar}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Error al eliminar el cliente');
        }

        console.log('✅ Cliente eliminado:', clienteAEliminar);
        
        // Cerrar modal
        cerrarModalEliminar();
        
        // Mostrar mensaje de éxito
        mostrarExito('Cliente eliminado correctamente');
        
        // Recargar lista
        await cargarClientes();

    } catch (error) {
        console.error('❌ Error:', error);
        cerrarModalEliminar();
        mostrarError('No se pudo eliminar el cliente. Puede tener ventas asociadas.');
    }
}

// SISTEMA DE NOTIFICACIONES (TOAST)
function mostrarToast(mensaje, tipo = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');

    // Configurar ícono y color según el tipo
    let iconHtml = '';
    toast.className = 'fixed top-4 right-4 z-50';

    if (tipo === 'success') {
        iconHtml = '<i data-lucide="check-circle" class="w-6 h-6 text-green-500"></i>';
        toast.querySelector('.bg-white').classList.add('border-green-500');
    } else if (tipo === 'error') {
        iconHtml = '<i data-lucide="alert-circle" class="w-6 h-6 text-red-500"></i>';
        toast.querySelector('.bg-white').classList.add('border-red-500');
    } else if (tipo === 'warning') {
        iconHtml = '<i data-lucide="alert-triangle" class="w-6 h-6 text-amber-500"></i>';
        toast.querySelector('.bg-white').classList.add('border-amber-500');
    }

    toastIcon.innerHTML = iconHtml;
    toastMessage.textContent = mensaje;

    toast.classList.remove('hidden');
    lucide.createIcons();

    // Auto-cerrar después de 4 segundos
    setTimeout(() => {
        cerrarToast();
    }, 4000);
}

function cerrarToast() {
    const toast = document.getElementById('toast');
    toast.classList.add('hide');
    
    setTimeout(() => {
        toast.classList.add('hidden');
        toast.classList.remove('hide');
        // Limpiar clases de borde
        toast.querySelector('.bg-white').className = 'bg-white rounded-lg shadow-xl border-l-4 p-4 min-w-[300px]';
    }, 300);
}

function mostrarExito(mensaje) {
    mostrarToast(mensaje, 'success');
}

function mostrarError(mensaje) {
    mostrarToast(mensaje, 'error');
}

function mostrarAdvertencia(mensaje) {
    mostrarToast(mensaje, 'warning');
}

// EXPORTAR FUNCIONES GLOBALES
window.cargarClientes = cargarClientes;
window.filtrarClientes = filtrarClientes;
window.abrirModal = abrirModal;
window.cerrarModal = cerrarModal;
window.editarCliente = editarCliente;
window.confirmarEliminar = confirmarEliminar;
window.cerrarModalEliminar = cerrarModalEliminar;
window.ejecutarEliminar = ejecutarEliminar;
window.cerrarToast = cerrarToast;