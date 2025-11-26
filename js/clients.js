// Script para gestionar la página de clientes (CRUD)
const CLIENTS_API_BASE = 'http://localhost:3000';

async function fetchClientsList() {
  try {
    const res = await fetch(`${CLIENTS_API_BASE}/clientes`);
    if (!res.ok) throw new Error('Error fetching clientes');
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

function showMsg(text, type = 'info') {
  const el = document.getElementById('msg');
  el.textContent = text;
  el.className = type === 'success' ? 'text-green-700' : (type === 'error' ? 'text-red-700' : 'text-gray-700');
  setTimeout(() => { el.textContent = ''; }, 4000);
}

function renderClientsTable(clients) {
  const tbody = document.querySelector('#clientsTable tbody');
  tbody.innerHTML = '';
  clients.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.ci}</td>
      <td>${c.nombre}</td>
      <td>${c.email ?? '-'}</td>
      <td>${c.telefono ?? '-'}</td>
      <td>${c.direccion ?? '-'}</td>
      <td>
        <button data-ci="${c.ci}" class="editBtn px-2 py-1 bg-yellow-400 rounded">Editar</button>
        <button data-ci="${c.ci}" class="delBtn px-2 py-1 bg-red-500 text-white rounded">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  Array.from(document.getElementsByClassName('editBtn')).forEach(b => b.addEventListener('click', onEditClient));
  Array.from(document.getElementsByClassName('delBtn')).forEach(b => b.addEventListener('click', onDeleteClient));
}

function showForm(show, cliente = null) {
  document.getElementById('formSection').classList.toggle('hidden', !show);
  if (!show) return;
  if (cliente) {
    document.getElementById('formTitle').textContent = 'Editar Cliente';
    document.getElementById('ciInput').value = cliente.ci; document.getElementById('ciInput').disabled = true;
    document.getElementById('nameInput').value = cliente.nombre || '';
    document.getElementById('emailInput').value = cliente.email || '';
    document.getElementById('phoneInput').value = cliente.telefono || '';
    document.getElementById('addrInput').value = cliente.direccion || '';
  } else {
    document.getElementById('formTitle').textContent = 'Nuevo Cliente';
    document.getElementById('ciInput').disabled = false;
    document.getElementById('ciInput').value = '';
    document.getElementById('nameInput').value = '';
    document.getElementById('emailInput').value = '';
    document.getElementById('phoneInput').value = '';
    document.getElementById('addrInput').value = '';
  }
}

async function onEditClient(e) {
  const ci = e.target.getAttribute('data-ci');
  try {
    const res = await fetch(`${CLIENTS_API_BASE}/clientes/${ci}`);
    if (!res.ok) throw new Error('No encontrado');
    const cliente = await res.json();
    showForm(true, cliente);
  } catch (err) {
    showMsg('No se pudo cargar cliente', 'error');
  }
}

async function onDeleteClient(e) {
  const ci = e.target.getAttribute('data-ci');
  if (!confirm(`Eliminar cliente con CI ${ci}?`)) return;
  try {
    const res = await fetch(`${CLIENTS_API_BASE}/clientes/${ci}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    await res.json();
    showMsg('Cliente eliminado correctamente', 'success');
    // notificar a otras páginas
    window.dispatchEvent(new CustomEvent('clientes:updated', { detail: { action: 'delete', ci } }));
    await loadAndRender();
  } catch (err) {
    console.error(err);
    showMsg('Error al eliminar cliente', 'error');
  }
}

async function onSaveClient() {
  const ci = document.getElementById('ciInput').value.trim();
  const nombre = document.getElementById('nameInput').value.trim();
  const email = document.getElementById('emailInput').value.trim();
  const telefono = document.getElementById('phoneInput').value.trim();
  const direccion = document.getElementById('addrInput').value.trim();
  if (!ci || !nombre) { showMsg('CI y Nombre son requeridos', 'error'); return; }

  const payload = { ci: Number(ci), nombre, email: email || null, telefono: telefono || null, direccion: direccion || null };
  try {
    // decide si crear o actualizar
    const isEdit = document.getElementById('ciInput').disabled;
    if (isEdit) {
      const res = await fetch(`${CLIENTS_API_BASE}/clientes/${ci}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Update failed');
      await res.json();
      showMsg('Se ha actualizado correctamente cliente', 'success');
      window.dispatchEvent(new CustomEvent('clientes:updated', { detail: { action: 'update', cliente: payload } }));
    } else {
      const res = await fetch(`${CLIENTS_API_BASE}/clientes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Create failed');
      }
      await res.json();
      showMsg('Se ha guardado exitosamente cliente', 'success');
      window.dispatchEvent(new CustomEvent('clientes:updated', { detail: { action: 'create', cliente: payload } }));
    }
    showForm(false);
    await loadAndRender();
  } catch (err) {
    console.error(err);
    showMsg('Error guardando cliente: ' + (err.message || ''), 'error');
  }
}

async function loadAndRender() {
  const list = await fetchClientsList();
  renderClientsTable(list);
}

window.initClientsPage = async function initClientsPage() {
  document.getElementById('newClientBtn').addEventListener('click', () => showForm(true, null));
  document.getElementById('cancelClientBtn').addEventListener('click', () => showForm(false));
  document.getElementById('saveClientBtn').addEventListener('click', onSaveClient);
  await loadAndRender();
  // si otra página actualiza clientes, recargar lista
  window.addEventListener('clientes:updated', () => { loadAndRender(); showMsg('Clientes sincronizados', 'info'); });
};
