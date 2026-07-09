const HEADERS = ['作品名', '画像', '掲載先リンク', '背景色', 'サイズ'];

const json = (body, init = {}) => new Response(JSON.stringify(body), {
  ...init,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    ...(init.headers || {}),
  },
});

const escapeCsv = (value) => {
  const text = String(value ?? '');
  if (!/[",\r\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
};

const detectDelimiter = (text) => {
  const firstLine = text.split(/\r?\n/, 1)[0] || '';
  return firstLine.includes('\t') ? '\t' : ',';
};

const parseDelimited = (text) => {
  const delimiter = detectDelimiter(text);
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === delimiter) {
      row.push(field);
      field = '';
      continue;
    }

    if (!inQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && next === '\n') i++;
      row.push(field);
      if (row.some((cell) => cell.trim() !== '')) rows.push(row);
      row = [];
      field = '';
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some((cell) => cell.trim() !== '')) rows.push(row);
  return rows;
};

const normalizeHeader = (header) => String(header || '').trim();

const toItem = (headers, row, index) => {
  const values = Object.fromEntries(headers.map((header, columnIndex) => [normalizeHeader(header), row[columnIndex] || '']));
  const item = {
    text: String(values['作品名'] || values.text || '').trim(),
    imageSrc: String(values['画像'] || values.imageSrc || '').trim(),
    url: String(values['掲載先リンク'] || values.url || '').trim(),
    backgroundColor: String(values['背景色'] || values.backgroundColor || '').trim(),
    size: String(values['サイズ'] || values.size || '1').trim() || '1',
    paused: values['休止'] === 'true' || values.paused === 'true' ? 1 : 0,
    sortOrder: Number.parseInt(values['表示順'] || values.sortOrder || index, 10),
  };
  if (!Number.isFinite(item.sortOrder)) item.sortOrder = index;
  return item;
};

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    'SELECT text, imageSrc, url, backgroundColor, size FROM items ORDER BY sortOrder ASC, id ASC'
  ).all();

  const rows = [HEADERS, ...results.map((item) => [
    item.text,
    item.imageSrc,
    item.url,
    item.backgroundColor || '',
    item.size || '1',
  ])];
  const csv = `\uFEFF${rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n')}\r\n`;

  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="moenaigomi-items.csv"',
    },
  });
}

export async function onRequestPost({ request, env }) {
  const text = (await request.text()).replace(/^\uFEFF/, '').trim();
  if (!text) return json({ errors: ['CSVが空です。'] }, { status: 400 });

  const rows = parseDelimited(text);
  if (rows.length < 2) return json({ errors: ['ヘッダー行とデータ行が必要です。'] }, { status: 400 });

  const headers = rows[0].map(normalizeHeader);
  const items = rows.slice(1).map((row, index) => toItem(headers, row, index));
  const errors = [];
  items.forEach((item, index) => {
    if (!item.text) errors.push(`${index + 2}行目: 作品名は必須です。`);
    if (!item.imageSrc) errors.push(`${index + 2}行目: 画像は必須です。`);
    if (!item.url) errors.push(`${index + 2}行目: 掲載先リンクは必須です。`);
  });
  if (errors.length) return json({ errors }, { status: 400 });

  const statements = [env.DB.prepare('DELETE FROM items')];
  items.forEach((item) => {
    statements.push(env.DB.prepare(
      'INSERT INTO items (text, imageSrc, backgroundColor, url, size, paused, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(item.text, item.imageSrc, item.backgroundColor, item.url, item.size, item.paused, item.sortOrder));
  });
  await env.DB.batch(statements);

  return json({ ok: true, imported: items.length });
}
