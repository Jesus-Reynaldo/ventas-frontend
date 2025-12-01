// usuarios.js - CRUD de usuarios
//const API_URL = window.API_URL || 'http://localhost:3000';

let usuarios = [];
let usuarioEditando = null;

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    cargarUsuarios();
    
    // Event listener del formulario
    document.getElementById('formUsuario').addEventListener('submit', guardarUsuario);
});

/**
 * Cargar todos los usuarios
 */
async function cargarUsuarios() {
    try {
        const response = await fetch(`${API_URL}/usuarios`);
        usuarios = await response.json();
        
        renderizarTabla(usuarios);
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        mostrarError('Error al cargar usuarios');
    }
}

/**
 * Renderizar tabla de usuarios
 */
function renderizarTabla(usuariosArray) {
    const tbody = document.getElementById('tablaUsuarios');
    
    if (usuariosArray.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                    <i data-lucide="users" class="w-12 h-12 mx-auto mb-2 text-gray-400"></i>
                    <p>No hay usuarios registrados</p>
                </td>
            </tr>
        `;
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        return;
    }
    
    tbody.innerHTML = usuariosArray.map(usuario => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                        ${usuario.nombre_usuario.substring(0, 2).toUpperCase()}
                    </div>
                    <span class="font-medium text-gray-800">${usuario.nombre_usuario}</span>
                </div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-600">${usuario.nombre_completo}</td>
            <td class="px-6 py-4 text-sm text-gray-600">${usuario.email}</td>
            <td class="px-6 py-4 text-sm text-gray-600">${usuario.telefono}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 text-xs font-semibold rounded-full ${
                    usuario.rol === 'admin' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                }">
                    ${usuario.rol === 'admin' ? 'Administrador' : 'Vendedor'}
                </span>
            </td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 text-xs font-semibold rounded-full ${
                    usuario.estado === 'activo' 
                        ? 'bg-green-100 text-green-700' 
                        : usuario.estado === 'suspendido'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                }">
                    ${usuario.estado.charAt(0).toUpperCase() + usuario.estado.slice(1)}
                </span>
            </td>
            <td class="px-6 py-4">
                <div class="flex items-center justify-center gap-2">
                    <button 
                        onclick="editarUsuario(${usuario.id_usuario})"
                        class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="Editar"
                    >
                        <i data-lucide="edit" class="w-4 h-4"></i>
                    </button>
                    <button 
                        onclick="eliminarUsuario(${usuario.id_usuario})"
                        class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Eliminar"
                    >
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

/**
 * Filtrar usuarios
 */
function filtrarUsuarios() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const rolFilter = document.getElementById('filterRol').value;
    const estadoFilter = document.getElementById('filterEstado').value;
    
    const filtrados = usuarios.filter(usuario => {
        const matchSearch = 
            usuario.nombre_usuario.toLowerCase().includes(search) ||
            usuario.nombre_completo.toLowerCase().includes(search) ||
            usuario.email.toLowerCase().includes(search);
        
        const matchRol = !rolFilter || usuario.rol === rolFilter;
        const matchEstado = !estadoFilter || usuario.estado === estadoFilter;
        
        return matchSearch && matchRol && matchEstado;
    });
    
    renderizarTabla(filtrados);
}

/**
 * Abrir modal para crear usuario
 */
function abrirModalCrear() {
    usuarioEditando = null;
    document.getElementById('modalTitle').textContent = 'Nuevo Usuario';
    document.getElementById('formUsuario').reset();
    document.getElementById('usuarioId').value = '';
    document.getElementById('password').required = true;
    document.getElementById('modalUsuario').classList.remove('hidden');
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

/**
 * Editar usuario
 */
async function editarUsuario(id) {
    try {
        const response = await fetch(`${API_URL}/usuarios/${id}`);
        const usuario = await response.json();
        
        usuarioEditando = usuario;
        
        document.getElementById('modalTitle').textContent = 'Editar Usuario';
        document.getElementById('usuarioId').value = usuario.id_usuario;
        document.getElementById('nombre_usuario').value = usuario.nombre_usuario;
        document.getElementById('password').value = '';
        document.getElementById('password').required = false;
        document.getElementById('nombre_completo').value = usuario.nombre_completo;
        document.getElementById('email').value = usuario.email;
        document.getElementById('telefono').value = usuario.telefono || '';
        document.getElementById('rol').value = usuario.rol;
        document.getElementById('estado').value = usuario.estado;
        
        document.getElementById('modalUsuario').classList.remove('hidden');
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } catch (error) {
        console.error('Error al cargar usuario:', error);
        alert('Error al cargar usuario');
    }
}

/**
 * Guardar usuario (crear o actualizar)
 */
async function guardarUsuario(event) {
    event.preventDefault();
    
    const id = document.getElementById('usuarioId').value;
    const datos = {
        nombre_usuario: document.getElementById('nombre_usuario').value,
        nombre_completo: document.getElementById('nombre_completo').value,
        email: document.getElementById('email').value,
        telefono: document.getElementById('telefono').value || null,
        rol: document.getElementById('rol').value,
        estado: document.getElementById('estado').value
    };
    
    const password = document.getElementById('password').value;
    if (password) {
        datos.password = password;
    }
    
    try {
        let response;
        
        if (id) {
            // Actualizar
            response = await fetch(`${API_URL}/usuarios/${id}`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(datos)
            });
        } else {
            // Crear
            if (!password) {
                alert('La contraseña es obligatoria para nuevos usuarios');
                return;
            }
            
            response = await fetch(`${API_URL}/usuarios`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(datos)
            });
        }
        
        if (response.ok) {
            cerrarModal();
            cargarUsuarios();
            alert(id ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente');
        } else {
            const error = await response.json();
            alert(error.message || 'Error al guardar usuario');
        }
    } catch (error) {
        console.error('Error al guardar usuario:', error);
        alert('Error al guardar usuario');
    }
}

/**
 * Eliminar usuario
 */
async function eliminarUsuario(id) {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/usuarios/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            cargarUsuarios();
            alert('Usuario eliminado correctamente');
        } else {
            alert('Error al eliminar usuario');
        }
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        alert('Error al eliminar usuario');
    }
}

/**
 * Cerrar modal
 */
function cerrarModal() {
    document.getElementById('modalUsuario').classList.add('hidden');
    document.getElementById('formUsuario').reset();
    usuarioEditando = null;
}

/**
 * Mostrar error
 */
function mostrarError(mensaje) {
    console.error(mensaje);
    alert(mensaje);
}