const json = (body, init = {}) => new Response(JSON.stringify(body), {
  ...init,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    ...(init.headers || {}),
  },
});

const normalizeItem = (item) => ({
  id: item.id,
  text: item.text,
  imageSrc: item.imageSrc,
  description: item.description || '',
  additionalImages: item.additionalImages || '',
  additionalInfo: item.additionalInfo || '',
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
    description: String(input.description || '').trim(),
    additionalImages: String(input.additionalImages || '').trim(),
    additionalInfo: String(input.additionalInfo || '').trim(),
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
    'SELECT id, text, imageSrc, description, additionalImages, additionalInfo, backgroundColor, url, size, paused, sortOrder FROM items ORDER BY sortOrder ASC, id ASC'
  ).all();
  return json(results.map(normalizeItem));
}

export async function onRequestPost({ request, env }) {
  const input = await request.json().catch(() => ({}));
  const { item, errors } = validateItem(input);
  if (errors.length) return json({ errors }, { status: 400 });

  const result = await env.DB.prepare(
    'INSERT INTO items (text, imageSrc, description, additionalImages, additionalInfo, backgroundColor, url, size, paused, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id, text, imageSrc, description, additionalImages, additionalInfo, backgroundColor, url, size, paused, sortOrder'
  ).bind(item.text, item.imageSrc, item.description, item.additionalImages, item.additionalInfo, item.backgroundColor, item.url, item.size, item.paused, item.sortOrder).first();

  return json(normalizeItem(result), { status: 201 });
}
