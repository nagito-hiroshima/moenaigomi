const json = (body, init = {}) => new Response(JSON.stringify(body), {
  ...init,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    ...(init.headers || {}),
  },
});

const isAuthorized = (request, env) => {
  const expected = env.ADMIN_PASSWORD || env.ADMIN_TOKEN;
  if (!expected) return false;
  const header = request.headers.get('authorization') || '';
  const match = header.match(/^Basic\s+(.+)$/i);
  if (!match) return false;

  try {
    const decoded = atob(match[1]);
    const index = decoded.indexOf(':');
    const password = index >= 0 ? decoded.slice(index + 1) : decoded;
    return password === expected;
  } catch (_error) {
    return false;
  }
};

const requireAdmin = (request, env) => {
  if (isAuthorized(request, env)) return null;
  return json({ error: 'Unauthorized' }, {
    status: 401,
    headers: { 'www-authenticate': 'Basic realm="moenaigomi admin", charset="UTF-8"' },
  });
};

const normalizeItem = (item) => ({
  id: item.id,
  text: item.text,
  imageSrc: item.imageSrc,
  backgroundColor: item.backgroundColor || '',
  url: item.url,
  size: item.size || '1',
  paused: Boolean(item.paused),
  sortOrder: item.sortOrder || 0,
});

const validateItem = (input) => {
  const item = {
    text: String(input.text || '').trim(),
    imageSrc: String(input.imageSrc || '').trim(),
    backgroundColor: String(input.backgroundColor || '').trim(),
    url: String(input.url || '').trim(),
    size: String(input.size || '1').trim(),
    paused: input.paused ? 1 : 0,
    sortOrder: Number.parseInt(input.sortOrder || '0', 10),
  };

  const errors = [];
  if (!item.text) errors.push('作品名は必須です。');
  if (!item.imageSrc) errors.push('画像URLは必須です。');
  if (!item.url) errors.push('掲載先リンクは必須です。');
  if (!Number.isFinite(item.sortOrder)) item.sortOrder = 0;

  return { item, errors };
};

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    'SELECT id, text, imageSrc, backgroundColor, url, size, paused, sortOrder FROM items ORDER BY sortOrder ASC, id ASC'
  ).all();
  return json(results.map(normalizeItem));
}

export async function onRequestPost({ request, env }) {
  const unauthorized = requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  const input = await request.json().catch(() => ({}));
  const { item, errors } = validateItem(input);
  if (errors.length) return json({ errors }, { status: 400 });

  const result = await env.DB.prepare(
    'INSERT INTO items (text, imageSrc, backgroundColor, url, size, paused, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id, text, imageSrc, backgroundColor, url, size, paused, sortOrder'
  ).bind(item.text, item.imageSrc, item.backgroundColor, item.url, item.size, item.paused, item.sortOrder).first();

  return json(normalizeItem(result), { status: 201 });
}
