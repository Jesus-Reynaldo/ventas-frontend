const PERMISOS = {
    admin: {
        dashboard: { view: true },
        inventario: { view: true, create: true, edit: true, delete: true, export: true },
        ventas: { view: true, create: true, edit: true, delete: true, export: true },
        detalleVentas: { view: true, export: true },
        clientes: { view: true, create: true, edit: true, delete: true },
        usuarios: { view: true, create: true, edit: true, delete: true }
    },
    vendedor: {
        dashboard: { view: true },
        inventario: { view: true, create: false, edit: false, delete: false, export: false },
        ventas: { view: true, create: true, edit: false, delete: false, export: false },
        detalleVentas: { view: true, export: true },
        clientes: { view: true, create: true, edit: true, delete: false },
        usuarios: { view: false, create: false, edit: false, delete: false }
    }
};

//Mapeo de páginas a módulos de permisos
const PAGINA_A_MODULO = {
    'index.html': 'dashboard',
    'inventario.html': 'inventario',
    'ventas.html': 'ventas',
    'detalleventas.html': 'detalleVentas',
    'clientes.html': 'clientes',
    'usuarios.html': 'usuarios'
};

//Obtener el usuario actual desde el storage
function obtenerUsuarioActual() {
    const usuarioJSON = localStorage.getItem('usuario') || sessionStorage.getItem('usuario');
    return usuarioJSON ? JSON.parse(usuarioJSON) : null;
}

//Verificar si el usuario tiene un permiso específico
function tienePermiso(modulo, accion) {
    const usuario = obtenerUsuarioActual();
    
    if (!usuario || !usuario.rol) {
        return false;
    }
    
    const permisosRol = PERMISOS[usuario.rol];
    
    if (!permisosRol) {
        return false;
    }
    
    const permisosModulo = permisosRol[modulo];
    
    if (!permisosModulo) {
        return false;
    }
    
    return permisosModulo[accion] === true;
}

//Verificar acceso a la página actual
function verificarAccesoPagina() {
    const currentPath = window.location.pathname;
    const fileName = currentPath.split('/').pop();
    
    if (fileName.includes('login.html')) {
        return;
    }
    
    const modulo = PAGINA_A_MODULO[fileName];
    
    if (!modulo) {
        return;
    }
    
    if (!tienePermiso(modulo, 'view')) {
        if (currentPath.includes('/pages/')) {
            window.location.href = '../index.html';
        } else {
            window.location.href = 'index.html';
        }
    }
}

//Ocultar elementos del menú según permisos
function configurarMenuSegunPermisos() {
    const usuario = obtenerUsuarioActual();
    
    if (!usuario || !usuario.rol) {
        return;
    }
    
    const menuItems = {
        'inventario.html': 'inventario',
        'ventas.html': 'ventas',
        'detalleventas.html': 'detalleVentas',
        'clientes.html': 'clientes',
        'usuarios.html': 'usuarios'
    };
    
    const enlaces = document.querySelectorAll('aside a[href*=".html"]');
    
    enlaces.forEach(enlace => {
        const href = enlace.getAttribute('href');
        
        for (const [archivo, modulo] of Object.entries(menuItems)) {
            if (href.includes(archivo)) {
                if (!tienePermiso(modulo, 'view')) {
                    enlace.style.display = 'none';
                }
                break;
            }
        }
    });
}

//Deshabilitar botones de acción según permisos
function configurarBotonesSegunPermisos(modulo) {
    const usuario = obtenerUsuarioActual();
    
    if (!usuario || !usuario.rol) {
        return;
    }
    
    // Botones de CREAR/AGREGAR
    if (!tienePermiso(modulo, 'create')) {
        const botonesCrear = document.querySelectorAll(
            '#btnAddProduct, [onclick*="abrirModal"], [onclick*="abrirModalCrear"], button:has(i[data-lucide="plus"]), button:has(i[data-lucide="user-plus"])'
        );
        botonesCrear.forEach(btn => {
            btn.style.display = 'none';
        });
    }
    
    // Botones de EDITAR
    if (!tienePermiso(modulo, 'edit')) {
        const botonesEditar = document.querySelectorAll(
            '[onclick*="editar"], button.btn-editar, .btn-action.edit, button:has(i[data-lucide="edit"]), button:has(i[data-lucide="edit-2"])'
        );
        botonesEditar.forEach(btn => {
            btn.style.display = 'none';
        });
    }
    
    // Botones de ELIMINAR
    if (!tienePermiso(modulo, 'delete')) {
        const botonesEliminar = document.querySelectorAll(
            '[onclick*="eliminar"], [onclick*="confirmarEliminar"], button.btn-eliminar, .btn-action.delete, button:has(i[data-lucide="trash"]), button:has(i[data-lucide="trash-2"])'
        );
        botonesEliminar.forEach(btn => {
            btn.style.display = 'none';
        });
    }
    
    // Botones de EXPORTAR
    if (!tienePermiso(modulo, 'export')) {
        const botonesExportar = document.querySelectorAll(
            '#btnExportPDF, [onclick*="exportar"], button:has(i[data-lucide="download"])'
        );
        botonesExportar.forEach(btn => {
            btn.style.display = 'none';
        });
    }
    
    // ESPECIAL: Ocultar tarjeta de Valor Total en inventario si NO es admin
    if (modulo === 'inventario' && usuario.rol !== 'admin') {
        const tarjetaValorTotal = document.getElementById('stat-value');
        if (tarjetaValorTotal) {
            const tarjetaPadre = tarjetaValorTotal.closest('.stat-card');
            if (tarjetaPadre) {
                tarjetaPadre.style.display = 'none';
            }
        }
        
        // Ocultar completamente la columna de ACCIONES en inventario
        ocultarColumnaAcciones();
    }
}

//Ocultar columna de acciones en tablas
function ocultarColumnaAcciones() {
    // Ocultar header de Acciones
    const headers = document.querySelectorAll('thead th');
    headers.forEach((th, index) => {
        if (th.textContent.trim().toUpperCase() === 'ACCIONES') {
            th.style.display = 'none';
            
            // Ocultar todas las celdas de esa columna
            const rows = document.querySelectorAll('tbody tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells[index]) {
                    cells[index].style.display = 'none';
                }
            });
        }
    });
}

//Interceptar funciones globales para verificar permisos
function protegerFuncionesGlobales(modulo) {
    // Proteger función editar
    if (!tienePermiso(modulo, 'edit')) {
        const editarFunctions = ['editarCliente', 'editarProducto', 'editProduct', 'editarUsuario'];
        editarFunctions.forEach(fnName => {
            if (typeof window[fnName] === 'function') {
                window[fnName] = function(...args) {
                    alert('No tienes permisos para realizar esta acción');
                    return;
                };
            }
        });
    }
    
    // Proteger función eliminar
    if (!tienePermiso(modulo, 'delete')) {
        const eliminarFunctions = ['eliminarCliente', 'eliminarProducto', 'deleteProduct', 'eliminarUsuario', 'confirmarEliminar', 'ejecutarEliminar'];
        eliminarFunctions.forEach(fnName => {
            if (typeof window[fnName] === 'function') {
                window[fnName] = function(...args) {
                    alert('No tienes permisos para realizar esta acción');
                    return;
                };
            }
        });
    }
    
    // Proteger función crear
    if (!tienePermiso(modulo, 'create')) {
        const crearFunctions = ['abrirModal', 'abrirModalCrear'];
        crearFunctions.forEach(fnName => {
            if (typeof window[fnName] === 'function') {
                window[fnName] = function(...args) {
                    alert('No tienes permisos para realizar esta acción');
                    return;
                };
            }
        });
    }
}

//Aplicar restricciones de campos en formularios
function aplicarRestriccionesCampos(modulo) {
    const usuario = obtenerUsuarioActual();
    
    if (!usuario) return;
    
    // Si es vendedor en inventario, deshabilitar precio
    if (modulo === 'inventario' && usuario.rol === 'vendedor') {
        const campoPrecio = document.getElementById('precio_actual');
        if (campoPrecio) {
            campoPrecio.disabled = true;
            campoPrecio.style.backgroundColor = '#f3f4f6';
            campoPrecio.title = 'Solo administradores pueden modificar precios';
        }
    }
}

//Inicialización automática del sistema de permisos
(function inicializarSistemaPermisos() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    function init() {
        const currentPath = window.location.pathname;
        const fileName = currentPath.split('/').pop();
        
        if (fileName.includes('login.html')) {
            return;
        }
        
        verificarAccesoPagina();
        configurarMenuSegunPermisos();
        
        const modulo = PAGINA_A_MODULO[fileName];
        
        if (modulo) {
            configurarBotonesSegunPermisos(modulo);
            protegerFuncionesGlobales(modulo);
            aplicarRestriccionesCampos(modulo);
            
            // Re-aplicar después de que la tabla se renderice
            setTimeout(() => {
                configurarBotonesSegunPermisos(modulo);
                aplicarRestriccionesCampos(modulo);
            }, 500);
            
            // Observar cambios en la tabla (para cuando se carga dinámicamente)
            const observer = new MutationObserver(() => {
                if (modulo === 'inventario') {
                    const usuario = obtenerUsuarioActual();
                    if (usuario && usuario.rol !== 'admin') {
                        ocultarColumnaAcciones();
                    }
                }
            });
            
            const tbody = document.querySelector('tbody');
            if (tbody) {
                observer.observe(tbody, { childList: true, subtree: true });
            }
        }
    }
})();

window.tienePermiso = tienePermiso;
window.configurarBotonesSegunPermisos = configurarBotonesSegunPermisos;