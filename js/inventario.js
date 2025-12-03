//Esteconst API_URL = window.API_URL || 'http://localhost:3000';

// Estado global
let inventoryData = [];
let filteredData = [];
let isEditMode = false;
let currentEditId = null;

let activeFilters = {
    stockStatus: ['high', 'medium', 'low', 'out'],
    precioMin: null,
    precioMax: null,
    categorias: [],
    marcas: [],
    medidas: []
};

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadInventory();
    lucide.createIcons();
});

// EVENT LISTENERS
function setupEventListeners() {
    document.getElementById('searchInput')?.addEventListener('input', handleSearch);
    document.getElementById('btnAddProduct')?.addEventListener('click', openAddModal);
    document.getElementById('btnFilter')?.addEventListener('click', openFilterModal);
    document.getElementById('btnExportPDF')?.addEventListener('click', exportInventoryToPDF);
    
    // Modales
    document.getElementById('btnCloseModal')?.addEventListener('click', closeModal);
    document.getElementById('btnCancelModal')?.addEventListener('click', closeModal);
    document.getElementById('btnSaveProduct')?.addEventListener('click', saveProduct);
    document.getElementById('productModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'productModal') closeModal();
    });

    // Filtros
    document.getElementById('btnCloseFilter')?.addEventListener('click', closeFilterModal);
    document.getElementById('btnCancelFilter')?.addEventListener('click', closeFilterModal);
    document.getElementById('btnApplyFilters')?.addEventListener('click', applyFilters);
    document.getElementById('btnClearFilters')?.addEventListener('click', clearFilters);
    document.getElementById('filterModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'filterModal') closeFilterModal();
    });

    // Cerrar modales con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeFilterModal();
            closeImageModal();
        }
    });
}

// CARGAR INVENTARIO
async function loadInventory() {
    try {
        showLoading();
        const response = await fetch(`${API_URL}/inventario`);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        
        inventoryData = await response.json();
        hideLoading();
        
        if (inventoryData.length === 0) {
            showEmptyState();
        } else {
            filteredData = inventoryData;
            renderInventory(filteredData);
            populateFilterOptions();
        }
        
        updateStatistics(inventoryData);
    } catch (error) {
        hideLoading();
        showToast('Error al cargar inventario: ' + error.message, 'error');
        showEmptyState();
        updateStatistics([]);
    }
}

// RENDERIZAR TABLA
function renderInventory(data) {
    const tbody = document.getElementById('inventoryTableBody');
    const tableContainer = document.getElementById('tableContainer');
    const emptyState = document.getElementById('emptyState');

    if (!tbody || !tableContainer || !emptyState) return;

    if (data.length === 0) {
        tableContainer.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    tableContainer.classList.remove('hidden');
    emptyState.classList.add('hidden');

    tbody.innerHTML = data.map(item => {
        const producto = item.productos;
        if (!producto) return '';
        
        const stockStatus = getStockStatus(item.stock_actual, item.stock_minimo);
        const imagenHTML = producto.imagen 
            ? `<img src="${producto.imagen}" alt="${producto.modelo}" 
                 class="w-12 h-12 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity" 
                 onclick="openImageModal('${producto.imagen}', '${producto.modelo}')"
                 onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center\\'><i data-lucide=\\'image-off\\' class=\\'w-6 h-6 text-gray-400\\'></i></div>'; lucide.createIcons();">`
            : `<div class="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                 <i data-lucide="image-off" class="w-6 h-6 text-gray-400"></i>
               </div>`;
        
        return `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">${imagenHTML}</td>
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

    lucide.createIcons();
}

// ESTADÍSTICAS
function updateStatistics(data) {
    const total = data.length;
    const lowStock = data.filter(item => item.stock_actual > 0 && item.stock_actual <= item.stock_minimo).length;
    const outOfStock = data.filter(item => item.stock_actual === 0).length;
    const totalValue = data.reduce((sum, item) => {
        const precio = item.productos ? parseFloat(item.productos.precio_actual || 0) : 0;
        return sum + (item.stock_actual * precio);
    }, 0);

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-low').textContent = lowStock;
    document.getElementById('stat-out').textContent = outOfStock;
    document.getElementById('stat-value').textContent = `Bs. ${totalValue.toFixed(2)}`;
}

// BÚSQUEDA
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
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

    filteredData = applyActiveFilters(dataToFilter);
    renderInventory(filteredData);
    updateStatistics(filteredData);
}

// MODALES - PRODUCTO
function openAddModal() {
    isEditMode = false;
    currentEditId = null;
    
    document.getElementById('modalTitle').textContent = 'Agregar Nuevo Producto';
    document.getElementById('productForm').reset();
    document.getElementById('stock_actual').value = '0';
    document.getElementById('stock_minimo').value = '5';
    document.getElementById('productId').value = '';
    document.getElementById('inventoryId').value = '';
    
    document.getElementById('productModal').classList.remove('hidden');
    lucide.createIcons();
}

async function editProduct(inventoryId) {
    try {
        const response = await fetch(`${API_URL}/inventario/${inventoryId}`);
        if (!response.ok) throw new Error('Error al cargar el producto');

        const data = await response.json();
        const producto = data.productos;

        isEditMode = true;
        currentEditId = inventoryId;

        document.getElementById('modalTitle').textContent = 'Editar Producto';
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

        document.getElementById('productModal').classList.remove('hidden');
        lucide.createIcons();
    } catch (error) {
        showToast('Error al cargar el producto: ' + error.message, 'error');
    }
}

function closeModal() {
    document.getElementById('productModal').classList.add('hidden');
    document.getElementById('productForm').reset();
    isEditMode = false;
    currentEditId = null;
}

// GUARDAR PRODUCTO
async function saveProduct() {
    try {
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
            if (!element || !element.value.trim()) {
                showToast(`El campo ${field.name} es requerido`, 'error');
                element?.focus();
                return;
            }
        }

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
        };

        if (isEditMode) {
            const productoId = document.getElementById('productId').value;
            const inventarioId = document.getElementById('inventoryId').value;

            await fetch(`${API_URL}/productos/${productoId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productoData)
            });

            await fetch(`${API_URL}/inventario/${inventarioId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inventarioData)
            });

            showToast('Producto actualizado exitosamente', 'success');
        } else {
            const productoResponse = await fetch(`${API_URL}/productos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productoData)
            });

            if (!productoResponse.ok) throw new Error('Error al crear producto');

            const newProducto = await productoResponse.json();

            await fetch(`${API_URL}/inventario`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...inventarioData,
                    id_producto: newProducto.id_producto
                })
            });

            showToast('Producto agregado exitosamente', 'success');
        }

        closeModal();
        loadInventory();
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

// ELIMINAR PRODUCTO
async function deleteProduct(inventoryId) {
    if (!confirm('¿Está seguro de eliminar este producto del inventario?\n\nEsta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/inventario/${inventoryId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Error al eliminar');

        showToast('Producto eliminado exitosamente', 'success');
        loadInventory();
    } catch (error) {
        showToast('Error al eliminar. El producto puede estar asociado a ventas.', 'error');
    }
}

// FILTROS
function openFilterModal() {
    populateFilterOptions();
    document.getElementById('filterModal').classList.remove('hidden');
    lucide.createIcons();
}

function closeFilterModal() {
    document.getElementById('filterModal').classList.add('hidden');
}

function populateFilterOptions() {
    const categorias = [...new Set(inventoryData.map(item => item.productos.categoria).filter(Boolean))].sort();
    const marcas = [...new Set(inventoryData.map(item => item.productos.marca))].sort();
    const medidas = [...new Set(inventoryData.map(item => item.productos.medida))].sort();

    const categoriasContainer = document.getElementById('filterCategoriasContainer');
    categoriasContainer.innerHTML = categorias.length > 0 ? categorias.map(categoria => `
        <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" class="filter-categoria rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                   value="${categoria}" ${activeFilters.categorias.length === 0 || activeFilters.categorias.includes(categoria) ? 'checked' : ''}>
            <span class="text-sm text-gray-700">${categoria}</span>
        </label>
    `).join('') : '<p class="text-sm text-gray-500">No hay categorías disponibles</p>';

    const marcasContainer = document.getElementById('filterMarcasContainer');
    marcasContainer.innerHTML = marcas.map(marca => `
        <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" class="filter-marca rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                   value="${marca}" ${activeFilters.marcas.length === 0 || activeFilters.marcas.includes(marca) ? 'checked' : ''}>
            <span class="text-sm text-gray-700">${marca}</span>
        </label>
    `).join('');

    const medidasContainer = document.getElementById('filterMedidasContainer');
    medidasContainer.innerHTML = medidas.map(medida => `
        <button class="talla-filter-btn ${activeFilters.medidas.length === 0 || activeFilters.medidas.includes(medida) ? 'active' : ''}" 
                data-medida="${medida}">
            ${medida}
        </button>
    `).join('');

    medidasContainer.querySelectorAll('.talla-filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.toggle('active');
        });
    });

    if (activeFilters.precioMin) document.getElementById('precioMin').value = activeFilters.precioMin;
    if (activeFilters.precioMax) document.getElementById('precioMax').value = activeFilters.precioMax;
}

function applyFilters() {
    activeFilters.stockStatus = Array.from(document.querySelectorAll('.filter-stock:checked')).map(cb => cb.value);
    activeFilters.precioMin = document.getElementById('precioMin').value ? parseFloat(document.getElementById('precioMin').value) : null;
    activeFilters.precioMax = document.getElementById('precioMax').value ? parseFloat(document.getElementById('precioMax').value) : null;
    activeFilters.categorias = Array.from(document.querySelectorAll('.filter-categoria:checked')).map(cb => cb.value);
    activeFilters.marcas = Array.from(document.querySelectorAll('.filter-marca:checked')).map(cb => cb.value);
    activeFilters.medidas = Array.from(document.querySelectorAll('.talla-filter-btn.active')).map(btn => btn.dataset.medida);

    filteredData = applyActiveFilters(inventoryData);
    renderInventory(filteredData);
    updateStatistics(filteredData);
    updateFilterBadge();
    closeFilterModal();
    showToast(`Filtros aplicados: ${filteredData.length} productos encontrados`, 'success');
}

function applyActiveFilters(data) {
    return data.filter(item => {
        const producto = item.productos;
        if (!producto) return false;

        const stockStatus = getStockStatus(item.stock_actual, item.stock_minimo);
        if (!activeFilters.stockStatus.includes(stockStatus.class)) return false;

        const precio = parseFloat(producto.precio_actual);
        if (activeFilters.precioMin !== null && precio < activeFilters.precioMin) return false;
        if (activeFilters.precioMax !== null && precio > activeFilters.precioMax) return false;

        if (activeFilters.categorias.length > 0 && !activeFilters.categorias.includes(producto.categoria)) return false;
        if (activeFilters.marcas.length > 0 && !activeFilters.marcas.includes(producto.marca)) return false;
        if (activeFilters.medidas.length > 0 && !activeFilters.medidas.includes(producto.medida)) return false;

        return true;
    });
}

function clearFilters() {
    activeFilters = {
        stockStatus: ['high', 'medium', 'low', 'out'],
        precioMin: null,
        precioMax: null,
        categorias: [],
        marcas: [],
        medidas: []
    };

    document.getElementById('precioMin').value = '';
    document.getElementById('precioMax').value = '';
    document.querySelectorAll('.filter-stock').forEach(cb => cb.checked = true);
    document.querySelectorAll('.filter-categoria').forEach(cb => cb.checked = true);
    document.querySelectorAll('.filter-marca').forEach(cb => cb.checked = true);
    document.querySelectorAll('.talla-filter-btn').forEach(btn => btn.classList.add('active'));

    filteredData = inventoryData;
    renderInventory(filteredData);
    updateStatistics(filteredData);
    updateFilterBadge();
    showToast('Filtros limpiados', 'info');
}

function updateFilterBadge() {
    const btnFilter = document.getElementById('btnFilter');
    if (!btnFilter) return;

    let activeCount = 0;
    if (activeFilters.stockStatus.length < 4) activeCount++;
    if (activeFilters.precioMin !== null || activeFilters.precioMax !== null) activeCount++;
    if (activeFilters.categorias.length > 0) activeCount++;
    if (activeFilters.marcas.length > 0) activeCount++;
    if (activeFilters.medidas.length > 0) activeCount++;

    const existingBadge = btnFilter.querySelector('.filter-badge');
    if (existingBadge) existingBadge.remove();

    if (activeCount > 0) {
        const badge = document.createElement('span');
        badge.className = 'filter-badge';
        badge.textContent = activeCount;
        btnFilter.appendChild(badge);
    }
}

// EXPORTAR PDF
async function exportInventoryToPDF() {
    const btnExport = document.getElementById('btnExportPDF');
    
    try {
        btnExport.disabled = true;
        btnExport.innerHTML = `
            <svg class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generando PDF...
        `;

        const dataToExport = filteredData.length > 0 ? filteredData : inventoryData;
        const response = await fetch(`${API_URL}/inventario/export/pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: dataToExport })
        });
        
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        const fecha = new Date().toISOString().split('T')[0];
        const tieneFiltros = dataToExport.length < inventoryData.length;
        a.download = tieneFiltros ? `inventario_filtrado_${fecha}.pdf` : `inventario_${fecha}.pdf`;
        
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        const mensaje = tieneFiltros 
            ? `PDF generado con ${dataToExport.length} productos filtrados` 
            : 'PDF generado con todos los productos';
        
        showToast(mensaje, 'success');
    } catch (error) {
        showToast('Error al generar el PDF: ' + error.message, 'error');
    } finally {
        btnExport.disabled = false;
        btnExport.innerHTML = `<i data-lucide="download" class="w-4 h-4"></i>Exportar PDF`;
        lucide.createIcons();
    }
}

// MODAL DE IMAGEN
function openImageModal(imageUrl, productName) {
    let modal = document.getElementById('imageModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'imageModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-75 hidden items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
                <button onclick="closeImageModal()" class="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>
                <div class="p-4">
                    <h3 id="imageModalTitle" class="text-lg font-semibold text-gray-900 mb-4"></h3>
                    <img id="imageModalImg" src="" alt="" class="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg">
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'imageModal') closeImageModal();
        });
    }
    
    document.getElementById('imageModalTitle').textContent = productName;
    document.getElementById('imageModalImg').src = imageUrl;
    document.getElementById('imageModalImg').alt = productName;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    lucide.createIcons();
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

// UTILIDADES
function getStockStatus(stockActual, stockMinimo) {
    if (stockActual === 0) return { class: 'out', text: 'Agotado' };
    if (stockActual <= stockMinimo) return { class: 'low', text: 'Bajo' };
    if (stockActual <= stockMinimo * 2) return { class: 'medium', text: 'Medio' };
    return { class: 'high', text: 'Disponible' };
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('es-BO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        return 'N/A';
    }
}

function showLoading() {
    document.getElementById('loadingState')?.classList.remove('hidden');
    document.getElementById('tableContainer')?.classList.add('hidden');
    document.getElementById('emptyState')?.classList.add('hidden');
}

function hideLoading() {
    document.getElementById('loadingState')?.classList.add('hidden');
}

function showEmptyState() {
    document.getElementById('emptyState')?.classList.remove('hidden');
    document.getElementById('tableContainer')?.classList.add('hidden');
    lucide.createIcons();
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = { success: 'check-circle', error: 'x-circle', warning: 'alert-triangle', info: 'info' };
    const titles = { success: 'Éxito', error: 'Error', warning: 'Advertencia', info: 'Información' };

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
    lucide.createIcons();

    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// EXPORTAR FUNCIONES GLOBALES
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;