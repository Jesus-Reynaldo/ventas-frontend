// ================================================================
// INVENTARIO.JS - Sistema de Gestión de Inventario
// ================================================================

// Configuración de la API
const API_URL = 'http://localhost:3000';

// Estado de la aplicación
let inventoryData = [];
let filteredData = [];
let isEditMode = false;
let currentEditId = null;

// Estado de filtros
let activeFilters = {
    stockStatus: ['high', 'medium', 'low', 'out'],
    precioMin: null,
    precioMax: null,
    categorias: [],
    marcas: [],
    medidas: []
};

// ================================================================
// INICIALIZACIÓN
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Iniciando aplicación de inventario...');
    initializeApp();
});

function initializeApp() {
    console.log('🔧 Configurando event listeners...');
    setupEventListeners();
    
    console.log('📦 Cargando inventario...');
    loadInventory();
    
    // Re-inicializar iconos
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
        console.log('✅ Iconos Lucide inicializados');
    }
}

// ================================================================
// EVENT LISTENERS
// ================================================================
function setupEventListeners() {
    // Búsqueda
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
        console.log('✅ Event listener: búsqueda');
    }

    // Botones principales
    const btnAddProduct = document.getElementById('btnAddProduct');
    if (btnAddProduct) {
        btnAddProduct.addEventListener('click', openAddModal);
        console.log('✅ Event listener: agregar producto');
    }

    const btnFilter = document.getElementById('btnFilter');
    if (btnFilter) {
        btnFilter.addEventListener('click', handleFilter);
        console.log('✅ Event listener: filtrar');
    }

    // Modal
    const btnCloseModal = document.getElementById('btnCloseModal');
    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', closeModal);
        console.log('✅ Event listener: cerrar modal');
    }

    const btnCancelModal = document.getElementById('btnCancelModal');
    if (btnCancelModal) {
        btnCancelModal.addEventListener('click', closeModal);
        console.log('✅ Event listener: cancelar modal');
    }

    const btnSaveProduct = document.getElementById('btnSaveProduct');
    if (btnSaveProduct) {
        btnSaveProduct.addEventListener('click', saveProduct);
        console.log('✅ Event listener: guardar producto');
    }

    // Click fuera del modal para cerrarlo
    const productModal = document.getElementById('productModal');
    if (productModal) {
        productModal.addEventListener('click', (e) => {
            if (e.target.id === 'productModal') {
                closeModal();
            }
        });
        console.log('✅ Event listener: cerrar modal por click fuera');
    }

    // Filtros - Event listeners
    const btnCloseFilter = document.getElementById('btnCloseFilter');
    if (btnCloseFilter) {
        btnCloseFilter.addEventListener('click', closeFilterModal);
    }

    const btnCancelFilter = document.getElementById('btnCancelFilter');
    if (btnCancelFilter) {
        btnCancelFilter.addEventListener('click', closeFilterModal);
    }

    const btnApplyFilters = document.getElementById('btnApplyFilters');
    if (btnApplyFilters) {
        btnApplyFilters.addEventListener('click', applyFilters);
    }

    const btnClearFilters = document.getElementById('btnClearFilters');
    if (btnClearFilters) {
        btnClearFilters.addEventListener('click', clearFilters);
    }

    // Click fuera del modal de filtros para cerrarlo
    const filterModal = document.getElementById('filterModal');
    if (filterModal) {
        filterModal.addEventListener('click', (e) => {
            if (e.target.id === 'filterModal') {
                closeFilterModal();
            }
        });
    }
}

// ================================================================
// CARGAR INVENTARIO
// ================================================================
async function loadInventory() {
    try {
        console.log('🌐 Haciendo petición a:', `${API_URL}/inventario`);
        showLoading();

        const response = await fetch(`${API_URL}/inventario`);
        console.log('📡 Respuesta recibida, status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log('📦 Datos recibidos:', data.length, 'productos');
        
        inventoryData = data;
        
        hideLoading();
        
        if (inventoryData.length === 0) {
            console.log('ℹ️ No hay productos en inventario');
            showEmptyState();
        } else {
            console.log('✅ Renderizando', inventoryData.length, 'productos');
            filteredData = inventoryData;
            renderInventory(filteredData);
            populateFilterOptions();
        }
        
        updateStatistics(inventoryData);

    } catch (error) {
        console.error('❌ Error al cargar inventario:', error);
        hideLoading();
        showToast('Error: ' + error.message + '. Verifica que el servidor esté activo en ' + API_URL, 'error');
        showEmptyState();
        updateStatistics([]);
    }
}

// ================================================================
// RENDERIZAR TABLA
// ================================================================
function renderInventory(data) {
    console.log('🎨 Renderizando tabla con', data.length, 'productos');
    
    const tbody = document.getElementById('inventoryTableBody');
    const tableContainer = document.getElementById('tableContainer');
    const emptyState = document.getElementById('emptyState');

    if (!tbody) {
        console.error('❌ Elemento inventoryTableBody no encontrado');
        return;
    }
    if (!tableContainer) {
        console.error('❌ Elemento tableContainer no encontrado');
        return;
    }
    if (!emptyState) {
        console.error('❌ Elemento emptyState no encontrado');
        return;
    }

    if (data.length === 0) {
        tableContainer.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    tableContainer.classList.remove('hidden');
    emptyState.classList.add('hidden');

    tbody.innerHTML = data.map((item, index) => {
        const producto = item.productos;
        
        if (!producto) {
            console.warn('⚠️ Producto', index, 'no tiene datos de productos');
            return '';
        }
        
        const stockStatus = getStockStatus(item.stock_actual, item.stock_minimo);
        
        return `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                    ${producto.imagen 
                        ? `<img src="${producto.imagen}" 
                             alt="${producto.modelo}" 
                             class="w-12 h-12 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity" 
                             onclick="openImageModal('${producto.imagen}', '${producto.modelo}')"
                             onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center\\'><svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'24\\' height=\\'24\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\' class=\\'w-6 h-6 text-gray-400\\'><line x1=\\'1\\' y1=\\'1\\' x2=\\'23\\' y2=\\'23\\'></line><path d=\\'m21.5 21.5-1.4-1.4\\'></path><path d=\\'M3.9 3.9 3 3\\'></path><path d=\\'M6 6v4c0 .5.2 1.2.5 1.5\\'></path><path d=\\'M8 11v5\\'></path><path d=\\'m12 12 8 8\\'></path><path d=\\'M16 16v1\\'></path><path d=\\'m21 21-1-1\\'></path><path d=\\'M9 9.5 5 5\\'></path></svg></div>';">`
                        : `<div class="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 text-gray-400">
                                <line x1="1" y1="1" x2="23" y2="23"></line>
                                <path d="m21.5 21.5-1.4-1.4"></path>
                                <path d="M3.9 3.9 3 3"></path>
                                <path d="M6 6v4c0 .5.2 1.2.5 1.5"></path>
                                <path d="M8 11v5"></path>
                                <path d="m12 12 8 8"></path>
                                <path d="M16 16v1"></path>
                                <path d="m21 21-1-1"></path>
                                <path d="M9 9.5 5 5"></path>
                             </svg>
                           </div>`
                    }
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="font-semibold text-gray-900">${producto.codigo_sku || 'N/A'}</span>
                </td>
                <td class="px-6 py-4">
                    <div class="font-medium text-gray-900">${producto.modelo || 'Sin modelo'}</div>
                    <div class="text-sm text-gray-500">${producto.descripcion || 'Sin descripción'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-gray-700">${producto.marca || 'Sin marca'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-gray-700">${producto.categoria || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-gray-700">${producto.medida || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-gray-700">${producto.color || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="font-semibold text-gray-900">Bs. ${parseFloat(producto.precio_actual || 0).toFixed(2)}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="stock-number ${stockStatus.class}">${item.stock_actual}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-gray-700">${item.stock_minimo}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="stock-badge ${stockStatus.class}">
                        <span class="stock-indicator ${stockStatus.class}"></span>
                        ${stockStatus.text}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formatDate(item.ultima_actualizacion)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-2">
                        <button class="btn-icon edit" onclick="editProduct(${item.id_inventario})" title="Editar">
                            <i data-lucide="edit-2" class="w-4 h-4"></i>
                        </button>
                        <button class="btn-icon delete" onclick="deleteProduct(${item.id_inventario})" title="Eliminar">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    console.log('✅ Tabla renderizada');

    // Re-inicializar iconos de Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// ================================================================
// ESTADÍSTICAS
// ================================================================
function updateStatistics(data) {
    console.log('📊 Actualizando estadísticas...');
    
    const total = data.length;
    const lowStock = data.filter(item => 
        item.stock_actual > 0 && item.stock_actual <= item.stock_minimo
    ).length;
    const outOfStock = data.filter(item => item.stock_actual === 0).length;
    
    const totalValue = data.reduce((sum, item) => {
        const precio = item.productos ? parseFloat(item.productos.precio_actual || 0) : 0;
        return sum + (item.stock_actual * precio);
    }, 0);

    const statTotal = document.getElementById('stat-total');
    const statLow = document.getElementById('stat-low');
    const statOut = document.getElementById('stat-out');
    const statValue = document.getElementById('stat-value');

    if (statTotal) {
        statTotal.textContent = total;
    } else {
        console.warn('⚠️ Elemento stat-total no encontrado');
    }
    
    if (statLow) {
        statLow.textContent = lowStock;
    } else {
        console.warn('⚠️ Elemento stat-low no encontrado');
    }
    
    if (statOut) {
        statOut.textContent = outOfStock;
    } else {
        console.warn('⚠️ Elemento stat-out no encontrado');
    }
    
    if (statValue) {
        statValue.textContent = `Bs. ${totalValue.toFixed(2)}`;
    } else {
        console.warn('⚠️ Elemento stat-value no encontrado');
    }
    
    console.log('✅ Estadísticas actualizadas:', { total, lowStock, outOfStock, totalValue });
}

// ================================================================
// BÚSQUEDA Y FILTRADO
// ================================================================
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    console.log('🔍 Buscando:', searchTerm);

    let dataToFilter = inventoryData;

    if (searchTerm !== '') {
        dataToFilter = inventoryData.filter(item => {
            const producto = item.productos;
            if (!producto) return false;
            
            return (
                (producto.marca && producto.marca.toLowerCase().includes(searchTerm)) ||
                (producto.modelo && producto.modelo.toLowerCase().includes(searchTerm)) ||
                (producto.codigo_sku && producto.codigo_sku.toLowerCase().includes(searchTerm)) ||
                (producto.color && producto.color.toLowerCase().includes(searchTerm))
            );
        });
    }

    console.log('✅ Resultados de búsqueda:', dataToFilter.length);
    
    // Aplicar filtros sobre los resultados de búsqueda
    filteredData = applyActiveFilters(dataToFilter);
    renderInventory(filteredData);
    updateStatistics(filteredData);
}

function handleFilter() {
    console.log('🎛️ Abriendo panel de filtros');
    openFilterModal();
}

// ================================================================
// MODAL - AGREGAR/EDITAR
// ================================================================
function openAddModal() {
    console.log('➕ Abriendo modal para agregar producto');
    
    isEditMode = false;
    currentEditId = null;
    
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('productForm');
    
    if (modalTitle) modalTitle.textContent = 'Agregar Nuevo Producto';
    if (form) form.reset();
    
    // Valores por defecto
    const stockActual = document.getElementById('stock_actual');
    const stockMinimo = document.getElementById('stock_minimo');
    
    if (stockActual) stockActual.value = '0';
    if (stockMinimo) stockMinimo.value = '5';
    
    document.getElementById('productId').value = '';
    document.getElementById('inventoryId').value = '';
    
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.classList.remove('hidden');
        console.log('✅ Modal abierto');
    } else {
        console.error('❌ Modal no encontrado');
    }

    // Re-inicializar iconos
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

async function editProduct(inventoryId) {
    try {
        console.log('✏️ Editando producto, ID inventario:', inventoryId);
        
        const response = await fetch(`${API_URL}/inventario/${inventoryId}`);
        
        if (!response.ok) {
            throw new Error('Error al cargar el producto');
        }

        const data = await response.json();
        const producto = data.productos;

        console.log('📦 Producto cargado:', producto);

        isEditMode = true;
        currentEditId = inventoryId;

        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) modalTitle.textContent = 'Editar Producto';
        
        document.getElementById('productId').value = producto.id_producto;
        document.getElementById('inventoryId').value = data.id_inventario;
        document.getElementById('codigo_sku').value = producto.codigo_sku || '';
        document.getElementById('marca').value = producto.marca || '';
        document.getElementById('modelo').value = producto.modelo || '';
        document.getElementById('categoria').value = producto.categoria || '';
        document.getElementById('color').value = producto.color || '';
        document.getElementById('medida').value = producto.medida || '';
        document.getElementById('precio_actual').value = producto.precio_actual || 0;
        document.getElementById('imagen').value = producto.imagen || '';
        document.getElementById('descripcion').value = producto.descripcion || '';
        document.getElementById('stock_actual').value = data.stock_actual || 0;
        document.getElementById('stock_minimo').value = data.stock_minimo || 5;

        const modal = document.getElementById('productModal');
        if (modal) {
            modal.classList.remove('hidden');
            console.log('✅ Modal de edición abierto');
        }

        // Re-inicializar iconos
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

    } catch (error) {
        console.error('❌ Error al editar:', error);
        showToast('Error al cargar el producto: ' + error.message, 'error');
    }
}

function closeModal() {
    console.log('❌ Cerrando modal');
    
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    
    if (modal) modal.classList.add('hidden');
    if (form) form.reset();
    
    isEditMode = false;
    currentEditId = null;
}

// ================================================================
// GUARDAR PRODUCTO
// ================================================================
async function saveProduct() {
    try {
        console.log('💾 Guardando producto...');
        
        // Validar campos requeridos
        const requiredFields = [
            { id: 'marca', name: 'Marca' },
            { id: 'modelo', name: 'Modelo' },
            { id: 'medida', name: 'Medida' },
            { id: 'precio_actual', name: 'Precio' },
            { id: 'stock_actual', name: 'Stock Actual' },
            { id: 'stock_minimo', name: 'Stock Mínimo' }
        ];

        for (const field of requiredFields) {
            const element = document.getElementById(field.id);
            const value = element ? element.value.trim() : '';
            if (!value) {
                showToast(`El campo ${field.name} es requerido`, 'error');
                if (element) element.focus();
                return;
            }
        }

        // Preparar datos del producto
        const productoData = {
            codigo_sku: document.getElementById('codigo_sku').value.trim() || null,
            marca: document.getElementById('marca').value.trim(),
            modelo: document.getElementById('modelo').value.trim(),
            categoria: document.getElementById('categoria').value.trim() || null,
            color: document.getElementById('color').value.trim() || null,
            medida: document.getElementById('medida').value.trim(),
            precio_actual: parseFloat(document.getElementById('precio_actual').value),
            imagen: document.getElementById('imagen').value.trim() || null,
            descripcion: document.getElementById('descripcion').value.trim() || null
        };

        const inventarioData = {
            stock_actual: parseInt(document.getElementById('stock_actual').value),
            stock_minimo: parseInt(document.getElementById('stock_minimo').value)
            // ultima_actualizacion se establece automáticamente en la BD
        };

        console.log('📦 Datos del producto:', productoData);
        console.log('📊 Datos del inventario:', inventarioData);

        if (isEditMode) {
            // EDITAR
            const productoId = document.getElementById('productId').value;
            const inventarioId = document.getElementById('inventoryId').value;

            console.log('✏️ Modo edición - Producto ID:', productoId, 'Inventario ID:', inventarioId);

            // Actualizar producto
            const prodResponse = await fetch(`${API_URL}/productos/${productoId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productoData)
            });
            
            if (!prodResponse.ok) {
                throw new Error('Error al actualizar producto');
            }

            // Actualizar inventario
            const invResponse = await fetch(`${API_URL}/inventario/${inventarioId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inventarioData)
            });
            
            if (!invResponse.ok) {
                throw new Error('Error al actualizar inventario');
            }

            console.log('✅ Producto actualizado');
            showToast('Producto actualizado exitosamente', 'success');

        } else {
            // CREAR NUEVO
            console.log('➕ Creando nuevo producto...');
            
            // Primero crear el producto
            const productoResponse = await fetch(`${API_URL}/productos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productoData)
            });

            if (!productoResponse.ok) {
                const errorData = await productoResponse.text();
                throw new Error('Error al crear producto: ' + errorData);
            }

            const newProducto = await productoResponse.json();
            console.log('✅ Producto creado con ID:', newProducto.id_producto);

            // Luego crear el registro de inventario
            const inventarioCompleto = {
                ...inventarioData,
                id_producto: newProducto.id_producto
            };

            const inventarioResponse = await fetch(`${API_URL}/inventario`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inventarioCompleto)
            });

            if (!inventarioResponse.ok) {
                const errorData = await inventarioResponse.text();
                throw new Error('Error al crear inventario: ' + errorData);
            }

            console.log('✅ Inventario creado');
            showToast('Producto agregado exitosamente', 'success');
        }

        closeModal();
        loadInventory();

    } catch (error) {
        console.error('❌ Error al guardar:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

// ================================================================
// ELIMINAR PRODUCTO
// ================================================================
async function deleteProduct(inventoryId) {
    console.log('🗑️ Solicitando eliminar inventario ID:', inventoryId);
    
    if (!confirm('¿Está seguro de eliminar este producto del inventario?\n\nEsta acción no se puede deshacer.')) {
        console.log('❌ Eliminación cancelada por el usuario');
        return;
    }

    try {
        console.log('🗑️ Eliminando...');
        
        const response = await fetch(`${API_URL}/inventario/${inventoryId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Error al eliminar (HTTP ' + response.status + ')');
        }

        console.log('✅ Producto eliminado');
        showToast('Producto eliminado exitosamente', 'success');
        loadInventory();

    } catch (error) {
        console.error('❌ Error al eliminar:', error);
        showToast('Error al eliminar. El producto puede estar asociado a ventas.', 'error');
    }
}

// ================================================================
// FILTROS AVANZADOS
// ================================================================
function openFilterModal() {
    populateFilterOptions();
    
    const modal = document.getElementById('filterModal');
    if (modal) {
        modal.classList.remove('hidden');
        console.log('✅ Modal de filtros abierto');
    }

    // Re-inicializar iconos
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function closeFilterModal() {
    const modal = document.getElementById('filterModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function populateFilterOptions() {
    console.log('📋 Generando opciones de filtros...');
    
    // Obtener categorías únicas
    const categorias = [...new Set(inventoryData.map(item => item.productos.categoria).filter(Boolean))].sort();
    const categoriasContainer = document.getElementById('filterCategoriasContainer');
    
    if (categoriasContainer) {
        categoriasContainer.innerHTML = categorias.length > 0 ? categorias.map(categoria => `
            <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" class="filter-categoria rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" value="${categoria}" ${activeFilters.categorias.length === 0 || activeFilters.categorias.includes(categoria) ? 'checked' : ''}>
                <span class="text-sm text-gray-700">${categoria}</span>
            </label>
        `).join('') : '<p class="text-sm text-gray-500">No hay categorías disponibles</p>';
    }
    
    // Obtener marcas únicas
    const marcas = [...new Set(inventoryData.map(item => item.productos.marca))].sort();
    const marcasContainer = document.getElementById('filterMarcasContainer');
    
    if (marcasContainer) {
        marcasContainer.innerHTML = marcas.map(marca => `
            <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" class="filter-marca rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" value="${marca}" ${activeFilters.marcas.length === 0 || activeFilters.marcas.includes(marca) ? 'checked' : ''}>
                <span class="text-sm text-gray-700">${marca}</span>
            </label>
        `).join('');
    }

    // Obtener medidas únicas
    const medidas = [...new Set(inventoryData.map(item => item.productos.medida))].sort();
    const medidasContainer = document.getElementById('filterMedidasContainer');
    
    if (medidasContainer) {
        medidasContainer.innerHTML = medidas.map(medida => `
            <button class="talla-filter-btn ${activeFilters.medidas.length === 0 || activeFilters.medidas.includes(medida) ? 'active' : ''}" data-medida="${medida}">
                ${medida}
            </button>
        `).join('');

        // Event listeners para botones de medida
        medidasContainer.querySelectorAll('.talla-filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                this.classList.toggle('active');
            });
        });
    }

    // Establecer valores actuales de precio
    const precioMin = document.getElementById('precioMin');
    const precioMax = document.getElementById('precioMax');
    
    if (precioMin && activeFilters.precioMin) {
        precioMin.value = activeFilters.precioMin;
    }
    if (precioMax && activeFilters.precioMax) {
        precioMax.value = activeFilters.precioMax;
    }

    console.log('✅ Opciones de filtros generadas');
}

function applyFilters() {
    console.log('🎯 Aplicando filtros...');
    
    // Obtener estados de stock seleccionados
    const stockCheckboxes = document.querySelectorAll('.filter-stock:checked');
    activeFilters.stockStatus = Array.from(stockCheckboxes).map(cb => cb.value);

    // Obtener rango de precio
    const precioMin = document.getElementById('precioMin');
    const precioMax = document.getElementById('precioMax');
    activeFilters.precioMin = precioMin && precioMin.value ? parseFloat(precioMin.value) : null;
    activeFilters.precioMax = precioMax && precioMax.value ? parseFloat(precioMax.value) : null;

    // Obtener categorías seleccionadas
    const categoriaCheckboxes = document.querySelectorAll('.filter-categoria:checked');
    activeFilters.categorias = Array.from(categoriaCheckboxes).map(cb => cb.value);

    // Obtener marcas seleccionadas
    const marcaCheckboxes = document.querySelectorAll('.filter-marca:checked');
    activeFilters.marcas = Array.from(marcaCheckboxes).map(cb => cb.value);

    // Obtener medidas seleccionadas
    const medidasButtons = document.querySelectorAll('.talla-filter-btn.active');
    activeFilters.medidas = Array.from(medidasButtons).map(btn => btn.dataset.medida);

    console.log('📊 Filtros activos:', activeFilters);

    // Aplicar filtros
    filteredData = applyActiveFilters(inventoryData);
    renderInventory(filteredData);
    updateStatistics(filteredData);

    // Actualizar badge de filtros
    updateFilterBadge();

    closeFilterModal();
    showToast(`Filtros aplicados: ${filteredData.length} productos encontrados`, 'success');
}

function applyActiveFilters(data) {
    return data.filter(item => {
        const producto = item.productos;
        if (!producto) return false;

        // Filtrar por estado de stock
        const stockStatus = getStockStatus(item.stock_actual, item.stock_minimo);
        if (!activeFilters.stockStatus.includes(stockStatus.class)) {
            return false;
        }

        // Filtrar por precio
        const precio = parseFloat(producto.precio_actual);
        if (activeFilters.precioMin !== null && precio < activeFilters.precioMin) {
            return false;
        }
        if (activeFilters.precioMax !== null && precio > activeFilters.precioMax) {
            return false;
        }

        // Filtrar por categoría
        if (activeFilters.categorias.length > 0 && !activeFilters.categorias.includes(producto.categoria)) {
            return false;
        }

        // Filtrar por marca
        if (activeFilters.marcas.length > 0 && !activeFilters.marcas.includes(producto.marca)) {
            return false;
        }

        // Filtrar por medida
        if (activeFilters.medidas.length > 0 && !activeFilters.medidas.includes(producto.medida)) {
            return false;
        }

        return true;
    });
}

function clearFilters() {
    console.log('🧹 Limpiando filtros...');
    
    // Resetear filtros
    activeFilters = {
        stockStatus: ['high', 'medium', 'low', 'out'],
        precioMin: null,
        precioMax: null,
        categorias: [],
        marcas: [],
        medidas: []
    };

    // Limpiar inputs
    const precioMin = document.getElementById('precioMin');
    const precioMax = document.getElementById('precioMax');
    if (precioMin) precioMin.value = '';
    if (precioMax) precioMax.value = '';

    // Marcar todos los checkboxes
    document.querySelectorAll('.filter-stock').forEach(cb => cb.checked = true);
    document.querySelectorAll('.filter-categoria').forEach(cb => cb.checked = true);
    document.querySelectorAll('.filter-marca').forEach(cb => cb.checked = true);
    document.querySelectorAll('.talla-filter-btn').forEach(btn => btn.classList.add('active'));

    // Aplicar (mostrar todos)
    filteredData = inventoryData;
    renderInventory(filteredData);
    updateStatistics(filteredData);
    updateFilterBadge();

    showToast('Filtros limpiados', 'info');
}

function updateFilterBadge() {
    const btnFilter = document.getElementById('btnFilter');
    if (!btnFilter) return;

    // Contar filtros activos
    let activeCount = 0;
    
    if (activeFilters.stockStatus.length < 4) activeCount++;
    if (activeFilters.precioMin !== null || activeFilters.precioMax !== null) activeCount++;
    if (activeFilters.categorias.length > 0) activeCount++;
    if (activeFilters.marcas.length > 0) activeCount++;
    if (activeFilters.medidas.length > 0) activeCount++;

    // Remover badge existente
    const existingBadge = btnFilter.querySelector('.filter-badge');
    if (existingBadge) {
        existingBadge.remove();
    }

    // Agregar nuevo badge si hay filtros activos
    if (activeCount > 0) {
        const badge = document.createElement('span');
        badge.className = 'filter-badge';
        badge.textContent = activeCount;
        btnFilter.appendChild(badge);
    }
}

// ================================================================
// UTILIDADES
// ================================================================
function getStockStatus(stockActual, stockMinimo) {
    if (stockActual === 0) {
        return { class: 'out', text: 'Agotado' };
    } else if (stockActual <= stockMinimo) {
        return { class: 'low', text: 'Bajo' };
    } else if (stockActual <= stockMinimo * 2) {
        return { class: 'medium', text: 'Medio' };
    } else {
        return { class: 'high', text: 'Disponible' };
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-BO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        console.warn('⚠️ Error al formatear fecha:', error);
        return 'N/A';
    }
}

function showLoading() {
    const loading = document.getElementById('loadingState');
    const table = document.getElementById('tableContainer');
    const empty = document.getElementById('emptyState');
    
    if (loading) loading.classList.remove('hidden');
    if (table) table.classList.add('hidden');
    if (empty) empty.classList.add('hidden');
}

function hideLoading() {
    const loading = document.getElementById('loadingState');
    if (loading) loading.classList.add('hidden');
}

function showEmptyState() {
    const empty = document.getElementById('emptyState');
    const table = document.getElementById('tableContainer');
    
    if (empty) empty.classList.remove('hidden');
    if (table) table.classList.add('hidden');
    
    // Re-inicializar iconos
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// ================================================================
// TOAST NOTIFICATIONS
// ================================================================
function showToast(message, type = 'info') {
    console.log(`📢 Toast [${type}]:`, message);
    
    const container = document.getElementById('toastContainer');
    if (!container) {
        console.warn('⚠️ Toast container no encontrado');
        return;
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'check-circle',
        error: 'x-circle',
        warning: 'alert-triangle',
        info: 'info'
    };

    const titles = {
        success: 'Éxito',
        error: 'Error',
        warning: 'Advertencia',
        info: 'Información'
    };

    toast.innerHTML = `
        <div class="toast-icon">
            <i data-lucide="${icons[type]}" class="w-5 h-5"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${titles[type]}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;

    container.appendChild(toast);
    
    // Re-inicializar iconos
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Auto-eliminar después de 4 segundos
    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ================================================================
// MODAL DE IMAGEN
// ================================================================
function openImageModal(imageUrl, productName) {
    console.log('🖼️ Abriendo modal de imagen:', productName);
    
    // Crear modal si no existe
    let modal = document.getElementById('imageModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'imageModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-75 hidden items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
                <button onclick="closeImageModal()" class="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <div class="p-4">
                    <h3 id="imageModalTitle" class="text-lg font-semibold text-gray-900 mb-4"></h3>
                    <img id="imageModalImg" src="" alt="" class="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg">
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Cerrar al hacer click fuera de la imagen
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'imageModal') {
                closeImageModal();
            }
        });
    }
    
    // Actualizar contenido
    document.getElementById('imageModalTitle').textContent = productName;
    document.getElementById('imageModalImg').src = imageUrl;
    document.getElementById('imageModalImg').alt = productName;
    
    // Mostrar modal
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

// Cerrar modal con tecla Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeImageModal();
    }
});

// ================================================================
// EXPORTAR FUNCIONES GLOBALES
// ================================================================
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;

console.log('✅ inventario.js cargado correctamente');