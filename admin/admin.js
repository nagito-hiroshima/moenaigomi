const state = { items: [] };
const $ = (id) => document.getElementById(id);
const editorPanel = $('editor-panel');
const status = $('status');

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.errors?.join('\n') || body.error || `HTTP ${response.status}`);
  }
  return response.json();
}

async function exportCsv() {
  status.textContent = 'CSVを作成中...';
  const response = await fetch('/api/items/csv');
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${response.status}`);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'moenaigomi-items.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  status.textContent = 'CSVをエクスポートしました。';
}

async function importCsv(file) {
  if (!file) return;
  if (!confirm('CSVの内容で現在の登録データを置き換えます。よろしいですか？')) return;

  status.textContent = 'CSVをインポート中...';
  const response = await fetch('/api/items/csv', {
    method: 'POST',
    headers: {
      'content-type': file.type || 'text/csv; charset=utf-8',
    },
    body: await file.text(),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.errors?.join('\n') || body.error || `HTTP ${response.status}`);
  }
  status.textContent = `${body.imported}件をインポートしました。`;
  await loadItems();
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
$('export-button').addEventListener('click', () => exportCsv().catch((error) => alert(`エクスポートできませんでした: ${error.message}`)));
$('import-file').addEventListener('change', (event) => importCsv(event.target.files[0]).catch((error) => alert(`インポートできませんでした: ${error.message}`)).finally(() => { event.target.value = ''; }));
$('reload-button').addEventListener('click', loadItems);
loadItems().catch((error) => alert(`読み込みできませんでした: ${error.message}`));
