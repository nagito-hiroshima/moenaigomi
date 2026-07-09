import { onRequestGet as listItems } from './index.js';

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

export async function onRequestPut({ request, env, params }) {
  const id = Number.parseInt(params.id, 10);
  if (!Number.isFinite(id)) return json({ error: 'Invalid id' }, { status: 400 });

  const input = await request.json().catch(() => ({}));
  const { item, errors } = validateItem(input);
  if (errors.length) return json({ errors }, { status: 400 });

  const result = await env.DB.prepare(
    `UPDATE items
       SET text = ?, imageSrc = ?, backgroundColor = ?, url = ?, size = ?, paused = ?, sortOrder = ?, updatedAt = CURRENT_TIMESTAMP
     WHERE id = ?
     RETURNING id, text, imageSrc, backgroundColor, url, size, paused, sortOrder`
  ).bind(item.text, item.imageSrc, item.backgroundColor, item.url, item.size, item.paused, item.sortOrder, id).first();

  if (!result) return json({ error: 'Not found' }, { status: 404 });
  return json(normalizeItem(result));
}

export async function onRequestDelete({ env, params }) {
  const id = Number.parseInt(params.id, 10);
  if (!Number.isFinite(id)) return json({ error: 'Invalid id' }, { status: 400 });

  const result = await env.DB.prepare('DELETE FROM items WHERE id = ?').bind(id).run();
  if (!result.meta.changes) return json({ error: 'Not found' }, { status: 404 });
  return json({ ok: true });
}

export const onRequestGet = listItems;
