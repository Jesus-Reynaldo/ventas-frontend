// login.js - Sistema de autenticación
const API_URL = 'http://localhost:3000';

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ login.js cargado');
    
    // Inicializar Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Obtener elementos
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    if (!loginForm) {
        console.error('❌ Formulario no encontrado');
        return;
    }
    
    console.log('✅ Formulario encontrado, agregando listener');
    
    // Event listener del formulario
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        console.log('🚀 Formulario enviado');
        
        const button = document.getElementById('loginButton');
        const buttonText = document.getElementById('buttonText');
        const nombre_usuario = document.getElementById('nombre_usuario').value.trim();
        const password = document.getElementById('password').value;
        const recordarme = document.getElementById('recordarme').checked;
        
        // Validar campos
        if (!nombre_usuario || !password) {
            mostrarError('Por favor completa todos los campos');
            return;
        }
        
        // Loading state
        button.disabled = true;
        buttonText.textContent = 'Iniciando sesión...';
        
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ nombre_usuario, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                console.log('✅ Login exitoso');
                
                // Guardar datos
                const storage = recordarme ? localStorage : sessionStorage;
                storage.setItem('access_token', data.access_token);
                storage.setItem('usuario', JSON.stringify(data.usuario));
                
                // Mostrar éxito
                mostrarExito('¡Bienvenido!');
                
                // Redirigir
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1000);
            } else {
                mostrarError(data.message || 'Credenciales incorrectas');
                button.disabled = false;
                buttonText.textContent = 'Iniciar Sesión';
            }
        } catch (error) {
            console.error('❌ Error:', error);
            mostrarError('Error al conectar con el servidor');
            button.disabled = false;
            buttonText.textContent = 'Iniciar Sesión';
        }
    });
    
    // Toggle password visibility
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            togglePassword.innerHTML = `<i data-lucide="${type === 'password' ? 'eye' : 'eye-off'}" class="w-5 h-5"></i>`;
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        });
    }
    
    // Ocultar error al escribir
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            ocultarError();
        });
    });
});

// Función para mostrar error
function mostrarError(mensaje) {
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    if (errorDiv && errorText) {
        errorText.textContent = mensaje;
        errorDiv.classList.remove('hidden', 'bg-green-50', 'border-green-200', 'text-green-700');
        errorDiv.classList.add('bg-red-50', 'border-red-200', 'text-red-700');
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

// Función para ocultar error
function ocultarError() {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.classList.add('hidden');
    }
}

// Función para mostrar éxito
function mostrarExito(mensaje) {
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    if (errorDiv && errorText) {
        errorText.textContent = mensaje;
        errorDiv.classList.remove('hidden', 'bg-red-50', 'border-red-200', 'text-red-700');
        errorDiv.classList.add('bg-green-50', 'border-green-200', 'text-green-700');
        
        const iconContainer = errorDiv.querySelector('i');
        if (iconContainer) {
            iconContainer.parentElement.innerHTML = '<i data-lucide="check-circle" class="w-5 h-5 flex-shrink-0"></i>';
        }
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}
