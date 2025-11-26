// JS para conectar la UI de ventas con el CRUD de clientes del backend
// Ajusta `API_BASE` si tu backend corre en otra URL/puerto
const API_BASE = 'http://localhost:3000';

let clientesCache = [];
let detalles = [];

async function fetchClients() {
	try {
		const res = await fetch(`${API_BASE}/clientes`);
		if (!res.ok) throw new Error(`Error ${res.status}`);
		const data = await res.json();
		clientesCache = data;
		return data;
	} catch (err) {
		console.error('No se pudieron cargar clientes:', err);
		return [];
	}
}

function renderClientOptions(selectEl, clientes) {
	selectEl.innerHTML = '';
	const empty = document.createElement('option');
	empty.value = '';
	empty.textContent = '-- Seleccione cliente --';
	selectEl.appendChild(empty);
	clientes.forEach(c => {
		const opt = document.createElement('option');
		opt.value = c.ci; // backend usa `ci` como identificador
		opt.textContent = `${c.ci} — ${c.nombre}`;
		selectEl.appendChild(opt);
	});
}

function showClientInfo(containerEl, cliente) {
	if (!cliente) {
		containerEl.textContent = 'Selecciona un cliente para ver datos.';
		return;
	}
	containerEl.innerHTML = `
		<div><strong>Nombre:</strong> ${cliente.nombre}</div>
		<div><strong>CI:</strong> ${cliente.ci}</div>
		<div><strong>Email:</strong> ${cliente.email ?? '-'} </div>
		<div><strong>Teléfono:</strong> ${cliente.telefono ?? '-'} </div>
		<div><strong>Dirección:</strong> ${cliente.direccion ?? '-'} </div>
	`;
}

function addDetailFromInputs() {
	const prod = document.getElementById('productInput').value.trim();
	const qty = Number(document.getElementById('qtyInput').value) || 0;
	const price = Number(document.getElementById('priceInput').value) || 0;
	if (!prod || qty <= 0 || price < 0) return;
	detalles.push({ producto: prod, cantidad: qty, precio: price });
	renderDetalles();
}

function renderDetalles() {
	const tbody = document.querySelector('#detallesTable tbody');
	tbody.innerHTML = '';
	detalles.forEach((d, i) => {
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td>${d.producto}</td>
			<td>${d.cantidad}</td>
			<td>${d.precio.toFixed(2)}</td>
			<td>${(d.cantidad * d.precio).toFixed(2)}</td>
			<td><button data-i="${i}" class="removeDetailBtn">Eliminar</button></td>
		`;
		tbody.appendChild(tr);
	});
	Array.from(document.getElementsByClassName('removeDetailBtn')).forEach(btn => {
		btn.addEventListener('click', (e) => {
			const idx = Number(e.target.getAttribute('data-i'));
			detalles.splice(idx, 1);
			renderDetalles();
		});
	});
	document.getElementById('totalAmount').textContent = calculateTotal().toFixed(2);
}

function calculateTotal() {
	return detalles.reduce((s, d) => s + d.cantidad * d.precio, 0);
}

async function createVenta(payload) {
	try {
		const res = await fetch(`${API_BASE}/ventas`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});
		if (!res.ok) {
			const text = await res.text();
			throw new Error(`HTTP ${res.status} — ${text}`);
		}
		return await res.json();
	} catch (err) {
		console.error('Error creando venta:', err);
		throw err;
	}
}

// Helpers CRUD clientes (opcionales)
async function createCliente(data) {
	const res = await fetch(`${API_BASE}/clientes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
	if (!res.ok) throw new Error(`Create cliente failed ${res.status}`);
	const json = await res.json();
	// notify other pages that clientes changed
	window.dispatchEvent(new CustomEvent('clientes:updated', { detail: { action: 'create', cliente: json } }));
	return json;
}

async function updateCliente(ci, data) {
	const res = await fetch(`${API_BASE}/clientes/${ci}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
	if (!res.ok) throw new Error(`Update cliente failed ${res.status}`);
	const json = await res.json();
	window.dispatchEvent(new CustomEvent('clientes:updated', { detail: { action: 'update', cliente: json } }));
	return json;
}

async function deleteCliente(ci) {
	const res = await fetch(`${API_BASE}/clientes/${ci}`, { method: 'DELETE' });
	if (!res.ok) throw new Error(`Delete cliente failed ${res.status}`);
	const json = await res.json();
	window.dispatchEvent(new CustomEvent('clientes:updated', { detail: { action: 'delete', ci } }));
	return json;
}

// Inicialización para la página de ventas
window.initVentasPage = async function initVentasPage() {
	const clientSelect = document.getElementById('clientSelect');
	const clientInfo = document.getElementById('clientInfo');
	const refreshBtn = document.getElementById('refreshClientsBtn');
	const newSaleBtn = document.getElementById('newSaleBtn');
	const addDetailBtn = document.getElementById('addDetailBtn');
	const submitSaleBtn = document.getElementById('submitSaleBtn');

	async function loadClientsToSelect() {
		clientSelect.disabled = true;
		const lista = await fetchClients();
		renderClientOptions(clientSelect, lista);
		clientSelect.disabled = false;
	}

	clientSelect.addEventListener('change', (e) => {
		const ci = e.target.value;
		const cliente = clientesCache.find(c => String(c.ci) === String(ci));
		showClientInfo(clientInfo, cliente);
	});

	refreshBtn.addEventListener('click', async () => { await loadClientsToSelect(); });

	newSaleBtn.addEventListener('click', () => {
		detalles = [];
		renderDetalles();
		document.getElementById('saleStatus').textContent = 'Nueva venta iniciada. Agrega detalles y guarda.';
	});

	addDetailBtn.addEventListener('click', () => { addDetailFromInputs(); });

	submitSaleBtn.addEventListener('click', async () => {
		const ci = clientSelect.value;
		if (!ci) { alert('Seleccione un cliente antes de guardar la venta.'); return; }
		if (detalles.length === 0) { alert('Agregue al menos un detalle a la venta.'); return; }

		const payload = {
			clienteCi: Number(ci),
			fecha: new Date().toISOString(),
			total: calculateTotal(),
			detalles: detalles.map(d => ({ producto: d.producto, cantidad: d.cantidad, precio: d.precio }))
		};

		document.getElementById('saleStatus').textContent = 'Guardando venta...';
		try {
			const resp = await createVenta(payload);
			document.getElementById('saleStatus').textContent = 'Venta guardada correctamente.';
			detalles = [];
			renderDetalles();
			console.log('Venta guardada:', resp);
		} catch (err) {
			document.getElementById('saleStatus').textContent = 'Error guardando la venta. Revisa consola.';
		}
	});

	// carga inicial
	await loadClientsToSelect();
	document.getElementById('saleStatus').textContent = 'Listo. Selecciona un cliente para comenzar.';
	// Escucha cambios realizados desde la página de clientes y refresca la lista automáticamente
	window.addEventListener('clientes:updated', async () => {
		await loadClientsToSelect();
		document.getElementById('saleStatus').textContent = 'Clientes actualizados.';
	});
};

// Exponer funciones útiles en window para pruebas manuales desde consola
window.apiClientes = { fetchClients, createCliente, updateCliente, deleteCliente };
window.apiVentas = { createVenta };
