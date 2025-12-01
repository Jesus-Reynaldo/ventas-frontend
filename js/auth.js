// auth.js - Middleware de autenticación para proteger páginas

const API_URL = 'http://localhost:3000';

/**
 * Verificar autenticación al cargar la página
 * Agregar este script al inicio de cada página protegida
 */
(function verificarAutenticacion() {
    // No ejecutar verificación en la página de login
    const currentPath = window.location.pathname;
    if (currentPath.includes('login.html')) {
        return; // Salir si estamos en login
    }
    
    // Obtener token de localStorage o sessionStorage
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    
    // Si no hay token, redirigir al login
    if (!token) {
        redirigirALogin();
        return;
    }
    
    // Verificar si el token es válido
    fetch(`${API_URL}/auth/verify`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            // Token inválido o expirado
            console.warn('Token inválido o expirado');
            limpiarSesion();
            redirigirALogin();
        } else {
            // Token válido, cargar datos del usuario
            return response.json();
        }
    })
    .then(usuario => {
        if (usuario) {
            cargarDatosUsuario(usuario);
        }
    })
    .catch(error => {
        console.error('Error al verificar autenticación:', error);
        redirigirALogin();
    });
})();

/**
 * Redirigir a la página de login
 */
function redirigirALogin() {
    const currentPath = window.location.pathname;
    
    // Evitar loop infinito si ya estamos en login
    if (!currentPath.includes('login.html')) {
        // Si estamos en /pages/, ir a login.html en la misma carpeta
        // Si estamos en la raíz, ir a pages/login.html
        if (currentPath.includes('/pages/')) {
            window.location.href = 'login.html';
        } else {
            window.location.href = 'pages/login.html';
        }
    }
}

/**
 * Limpiar sesión
 */
function limpiarSesion() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('usuario');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('usuario');
}

/**
 * Obtener token actual
 */
function obtenerToken() {
    return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
}

/**
 * Obtener datos del usuario actual
 */
function obtenerUsuario() {
    const usuarioJSON = localStorage.getItem('usuario') || sessionStorage.getItem('usuario');
    return usuarioJSON ? JSON.parse(usuarioJSON) : null;
}

/**
 * Cargar datos del usuario en la interfaz
 */
function cargarDatosUsuario(usuario) {
    // Actualizar nombre y email en el sidebar (si existe)
    const nombreUsuarioElements = document.querySelectorAll('[data-usuario-nombre]');
    const emailUsuarioElements = document.querySelectorAll('[data-usuario-email]');
    const inicialesElements = document.querySelectorAll('[data-usuario-iniciales]');
    
    nombreUsuarioElements.forEach(el => {
        el.textContent = usuario.nombre_completo || usuario.nombre_usuario;
    });
    
    emailUsuarioElements.forEach(el => {
        el.textContent = usuario.email;
    });
    
    inicialesElements.forEach(el => {
        const iniciales = usuario.nombre_completo 
            ? usuario.nombre_completo.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            : usuario.nombre_usuario.substring(0, 2).toUpperCase();
        el.textContent = iniciales;
    });
    
    // Guardar usuario actualizado
    const storage = localStorage.getItem('access_token') ? localStorage : sessionStorage;
    storage.setItem('usuario', JSON.stringify(usuario));
}

/**
 * Cerrar sesión
 */
function cerrarSesion() {
    limpiarSesion();
    redirigirALogin();
}

/**
 * Realizar petición autenticada a la API
 */
async function fetchAutenticado(url, options = {}) {
    const token = obtenerToken();
    
    if (!token) {
        redirigirALogin();
        throw new Error('No hay token de autenticación');
    }
    
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
    
    const response = await fetch(url, {
        ...options,
        headers
    });
    
    // Si el token expiró (401), redirigir al login
    if (response.status === 401) {
        limpiarSesion();
        redirigirALogin();
        throw new Error('Sesión expirada');
    }
    
    return response;
}