const state = { password: sessionStorage.getItem('adminPassword') || '', items: [] };
const $ = (id) => document.getElementById(id);
const authPanel = $('auth-panel');
const editorPanel = $('editor-panel');
const listPanel = $('list-panel');
const status = $('status');

function authHeader() {
  return `Basic ${btoa(`admin:${state.password}`)}`;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      'content-type': 'application/json',
      authorization: authHeader(),
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.errors?.join('\n') || body.error || `HTTP ${response.status}`);
  }
  return response.json();
}

function showApp() {
  authPanel.classList.add('hidden');
  editorPanel.classList.remove('hidden');
  listPanel.classList.remove('hidden');
}

function resetForm() {
  $('form-title').textContent = '作品を追加';
  $('item-form').reset();
  $('item-id').value = '';
  $('backgroundColor').value = '#ffffff';
  $('size').value = '1';
  $('sortOrder').value = '0';
}

function renderItems() {
  const container = $('items');
  container.innerHTML = '';
  state.items.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'item-card';
    card.innerHTML = `
      <img src="${item.imageSrc}" alt="">
      <div>
        <h3>${item.text}${item.paused ? '（休止）' : ''}</h3>
        <p>${item.url}</p>
        <p>背景色: ${item.backgroundColor || '-'} / サイズ: ${item.size || '1'} / 表示順: ${item.sortOrder || 0}</p>
      </div>
      <div class="card-actions">
        <button type="button" class="secondary" data-action="edit" data-id="${item.id}">編集</button>
        <button type="button" class="danger" data-action="delete" data-id="${item.id}">削除</button>
      </div>`;
    container.appendChild(card);
  });
}

async function loadItems() {
  status.textContent = '読み込み中...';
  state.items = await api('/api/items');
  renderItems();
  status.textContent = `${state.items.length}件を読み込みました。`;
}

$('auth-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  state.password = $('password').value;
  sessionStorage.setItem('adminPassword', state.password);
  try {
    showApp();
    await loadItems();
  } catch (error) {
    sessionStorage.removeItem('adminPassword');
    authPanel.classList.remove('hidden');
    editorPanel.classList.add('hidden');
    listPanel.classList.add('hidden');
    alert(`ログインできませんでした: ${error.message}`);
  }
});

$('item-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = $('item-id').value;
  const payload = {
    text: $('text').value,
    imageSrc: $('imageSrc').value,
    url: $('url').value,
    backgroundColor: $('backgroundColor').value,
    size: $('size').value,
    sortOrder: $('sortOrder').value,
    paused: $('paused').checked,
  };
  await api(id ? `/api/items/${id}` : '/api/items', {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(payload),
  });
  resetForm();
  await loadItems();
});

$('items').addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const item = state.items.find((entry) => String(entry.id) === button.dataset.id);
  if (!item) return;

  if (button.dataset.action === 'edit') {
    $('form-title').textContent = `作品を編集: ${item.text}`;
    $('item-id').value = item.id;
    $('text').value = item.text;
    $('imageSrc').value = item.imageSrc;
    $('url').value = item.url;
    $('backgroundColor').value = item.backgroundColor || '';
    $('size').value = item.size || '1';
    $('sortOrder').value = item.sortOrder || 0;
    $('paused').checked = item.paused;
    window.scrollTo({ top: editorPanel.offsetTop - 12, behavior: 'smooth' });
    return;
  }

  if (confirm(`「${item.text}」を削除しますか？`)) {
    await api(`/api/items/${item.id}`, { method: 'DELETE' });
    await loadItems();
  }
});

$('reset-button').addEventListener('click', resetForm);
$('reload-button').addEventListener('click', loadItems);

if (state.password) {
  $('password').value = state.password;
  showApp();
  loadItems().catch(() => {
    sessionStorage.removeItem('adminPassword');
    authPanel.classList.remove('hidden');
    editorPanel.classList.add('hidden');
    listPanel.classList.add('hidden');
  });
}
