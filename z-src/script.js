const container = document.getElementById('button-container');
const dialog = document.getElementById('project-dialog');
const dialogContent = document.getElementById('dialog-content');
const viewButtons = document.querySelectorAll('.view-button');
const uiToggle = document.getElementById('ui-toggle');
let items = [];
let animationFrameId = null;
let animationPaused = false;
let bounceLabelsVisible = false;
let activeProjectIndex = 0;
let swipeStart = null;

window.__moenaigomi_loading.inc(5);
window.__moenaigomi_loading.log('作品データベースに接続しています…');

function additionalImages(item) {
  if (Array.isArray(item.additionalImages)) return item.additionalImages.filter(Boolean);
  return String(item.additionalImages || '').split(/\r?\n|,/).map((url) => url.trim()).filter(Boolean);
}

function projectCard(item, index) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'project-card';
  card.style.setProperty('--card-color', item.backgroundColor || '#cbc8bf');
  card.innerHTML = `
    <span class="card-image">
      <img src="${escapeAttribute(item.imageSrc)}" alt="" loading="lazy">
      <span class="card-index">${String(index + 1).padStart(2, '0')}</span>
      <span class="card-arrow" aria-hidden="true">↗</span>
    </span>
    <span class="card-meta"><h3>${escapeHtml(item.text)}</h3><p>${escapeHtml(item.description || '小さなアイデアから生まれたWeb作品です。')}</p></span>`;
  card.addEventListener('click', () => openProject(item, index));
  return card;
}

function renderCards() {
  stopAnimation();
  container.className = 'project-grid';
  container.innerHTML = '';
  items.forEach((item, index) => container.appendChild(projectCard(item, index)));
}

function openProject(item, index) {
  activeProjectIndex = index;
  const images = [item.imageSrc, ...additionalImages(item)].slice(0, 5);
  dialogContent.innerHTML = `<div class="dialog-layout">
    <div class="dialog-gallery" style="--card-color:${escapeAttribute(item.backgroundColor || '#cbc8bf')}">
      ${images.map((src) => `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(item.text)} の画面">`).join('')}
    </div>
    <div class="dialog-copy"><p class="eyebrow">PROJECT ${String(index + 1).padStart(2, '0')}</p>
      <h2>${escapeHtml(item.text)}</h2>
      <p class="dialog-description">${escapeHtml(item.description || '小さなアイデアから生まれたWeb作品です。')}</p>
      ${item.additionalInfo ? `<div class="additional-info">${escapeHtml(item.additionalInfo)}</div>` : ''}
      <a class="visit-link" href="${escapeAttribute(item.url)}" target="_blank" rel="noopener">作品をひらく <span>↗</span></a>
    </div></div>`;
  dialog.scrollTop = 0;
  if (!dialog.open) dialog.showModal();
}

function navigateProject(direction) {
  if (items.length < 2) return;
  const nextIndex = (activeProjectIndex + direction + items.length) % items.length;
  openProject(items[nextIndex], nextIndex);
}

function renderBouncing() {
  container.className = '';
  container.innerHTML = '';
  items.forEach((item, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'floating-button';
    button.style.backgroundColor = item.backgroundColor || '#cbc8bf';
    button.style.left = `${30 + Math.random() * Math.max(1, innerWidth - 170)}px`;
    button.style.top = `${80 + Math.random() * Math.max(1, innerHeight - 240)}px`;
    button.speedX = (Math.random() > .5 ? 1 : -1) * (1 + Math.random() * .7);
    button.speedY = (Math.random() > .5 ? 1 : -1) * (1 + Math.random() * .7);
    button.innerHTML = `<img src="${escapeAttribute(item.imageSrc)}" alt=""><p>${escapeHtml(item.text)}</p>`;
    button.title = item.text;
    button.addEventListener('click', () => openProject(item, index));
    container.appendChild(button);
  });
  startAnimation();
}

function animateButtons() {
  const buttons = Array.from(document.querySelectorAll('.floating-button'));
  buttons.forEach((button) => {
    let x = Number.parseFloat(button.style.left) + button.speedX;
    let y = Number.parseFloat(button.style.top) + button.speedY;
    if (x <= 0 || x >= innerWidth - button.offsetWidth) { button.speedX *= -1; x = Math.max(0, Math.min(x, innerWidth - button.offsetWidth)); }
    if (y <= 0 || y >= innerHeight - button.offsetHeight) { button.speedY *= -1; y = Math.max(0, Math.min(y, innerHeight - button.offsetHeight)); }
    button.style.left = `${x}px`; button.style.top = `${y}px`;
  });
  for (let i = 0; i < buttons.length; i++) {
    for (let j = i + 1; j < buttons.length; j++) resolveCollision(buttons[i], buttons[j]);
  }
  animationFrameId = requestAnimationFrame(animateButtons);
}

function resolveCollision(first, second) {
  const firstRect = first.getBoundingClientRect();
  const secondRect = second.getBoundingClientRect();
  const overlapX = Math.min(firstRect.right, secondRect.right) - Math.max(firstRect.left, secondRect.left);
  const overlapY = Math.min(firstRect.bottom, secondRect.bottom) - Math.max(firstRect.top, secondRect.top);
  if (overlapX <= 0 || overlapY <= 0) return;

  if (overlapX < overlapY) {
    const direction = firstRect.left < secondRect.left ? -1 : 1;
    first.style.left = `${Number.parseFloat(first.style.left) + direction * overlapX / 2}px`;
    second.style.left = `${Number.parseFloat(second.style.left) - direction * overlapX / 2}px`;
    [first.speedX, second.speedX] = [second.speedX, first.speedX];
  } else {
    const direction = firstRect.top < secondRect.top ? -1 : 1;
    first.style.top = `${Number.parseFloat(first.style.top) + direction * overlapY / 2}px`;
    second.style.top = `${Number.parseFloat(second.style.top) - direction * overlapY / 2}px`;
    [first.speedY, second.speedY] = [second.speedY, first.speedY];
  }
}
function startAnimation() { if (!animationFrameId) { animationPaused = false; animationFrameId = requestAnimationFrame(animateButtons); updatePauseButton(); } }
function stopAnimation() { if (animationFrameId) cancelAnimationFrame(animationFrameId); animationFrameId = null; updatePauseButton(); }
function updatePauseButton() { const button = document.getElementById('pause-btn'); if (button) button.textContent = animationFrameId ? 'Ⅱ' : '▶'; }
function toggleBounceLabels() {
  bounceLabelsVisible = !bounceLabelsVisible;
  document.body.classList.toggle('show-bounce-labels', bounceLabelsVisible);
  const button = document.getElementById('label-btn');
  button.classList.toggle('active', bounceLabelsVisible);
  button.setAttribute('aria-pressed', String(bounceLabelsVisible));
}

function setView(view) {
  const bounce = view === 'bounce';
  document.body.classList.toggle('bounce-view', bounce);
  viewButtons.forEach((button) => button.classList.toggle('active', button.dataset.view === view));
  uiToggle.querySelector('i').className = bounce ? 'fas fa-th-large' : 'fas fa-expand-arrows-alt';
  uiToggle.querySelector('strong').textContent = bounce ? 'カード表示へ' : '跳ねる表示へ';
  uiToggle.setAttribute('aria-label', bounce ? 'カード表示に切り替える' : '跳ねる表示に切り替える');
  localStorage.setItem('moenaigomi-view', view);
  bounce ? renderBouncing() : renderCards();
}

function escapeHtml(value) { const node = document.createElement('div'); node.textContent = String(value || ''); return node.innerHTML; }
function escapeAttribute(value) { return escapeHtml(value).replace(/`/g, '&#96;'); }

const bounceControls = document.createElement('div');
bounceControls.className = 'bounce-controls';
bounceControls.innerHTML = '<button type="button" id="label-btn" class="round-control" aria-label="作品タイトルを表示" aria-pressed="false">Aa</button><button type="button" id="pause-btn" class="round-control" aria-label="一時停止">Ⅱ</button><button type="button" id="back-to-cards" class="round-control primary">▦ カードに戻る</button>';
document.body.appendChild(bounceControls);
document.getElementById('label-btn').addEventListener('click', toggleBounceLabels);
document.getElementById('pause-btn').addEventListener('click', () => animationFrameId ? stopAnimation() : startAnimation());
document.getElementById('back-to-cards').addEventListener('click', () => setView('cards'));
viewButtons.forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));
uiToggle.addEventListener('click', () => setView(document.body.classList.contains('bounce-view') ? 'cards' : 'bounce'));
dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
dialogContent.addEventListener('touchstart', (event) => {
  if (event.touches.length !== 1) return;
  const touch = event.touches[0];
  swipeStart = { x: touch.clientX, y: touch.clientY };
}, { passive: true });
dialogContent.addEventListener('touchend', (event) => {
  if (!swipeStart || event.changedTouches.length !== 1) return;
  const touch = event.changedTouches[0];
  const distanceX = touch.clientX - swipeStart.x;
  const distanceY = touch.clientY - swipeStart.y;
  swipeStart = null;
  if (Math.abs(distanceX) < 50 || Math.abs(distanceX) <= Math.abs(distanceY)) return;
  navigateProject(distanceX < 0 ? 1 : -1);
}, { passive: true });
dialogContent.addEventListener('touchcancel', () => { swipeStart = null; }, { passive: true });
document.addEventListener('keydown', (event) => {
  if (!document.body.classList.contains('bounce-view')) return;
  if (event.code === 'Space') { event.preventDefault(); animationFrameId ? stopAnimation() : startAnimation(); }
  if (event.code === 'KeyC' && !event.repeat) toggleBounceLabels();
});

fetch('/api/items')
  .then((response) => { if (!response.ok) throw new Error('作品データの取得に失敗しました。'); return response.json(); })
  .then((data) => {
    if (data.some((item) => item.paused)) { location.href = '/error.html'; return; }
    items = data;
    document.getElementById('item-count').textContent = `${items.length} PROJECTS`;
    window.__moenaigomi_loading.log(`${items.length}件の作品を読み込みました。`);
    window.__moenaigomi_loading.set(100);
    setView(localStorage.getItem('moenaigomi-view') === 'bounce' ? 'bounce' : 'cards');
  })
  .catch((error) => {
    console.error(error);
    document.getElementById('item-count').textContent = '読み込めませんでした';
    window.__moenaigomi_loading.log('作品データベースに接続できませんでした。');
    window.__moenaigomi_loading.finish();
  });
