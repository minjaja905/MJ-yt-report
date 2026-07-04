export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const token = process.env.NOTION_TOKEN;
  const dbId  = '2faf470c09f78100913ee533e7cdc4e4';

  if (!token) {
    return res.status(500).json({ error: 'NOTION_TOKEN not set' });
  }

  try {
    const results = [];
    let cursor;

    do {
      const body = {
        filter: {
          property: '특수 카테고리(작성)',
          multi_select: { contains: '일정' }
        },
        sorts: [{ property: '업로드일(작성)', direction: 'ascending' }],
        page_size: 100,
        ...(cursor ? { start_cursor: cursor } : {})
      };

      const r = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!r.ok) {
        const err = await r.text();
        return res.status(r.status).json({ error: err });
      }

      const data = await r.json();
      cursor = data.has_more ? data.next_cursor : null;

      for (const page of data.results) {
        const props = page.properties;
        const title = props['콘텐츠명']?.title?.[0]?.plain_text ?? '';
        const result = props['경기 승패 유무']?.select?.name ?? null;
        const dateStart = props['업로드일(작성)']?.date?.start ?? null;
        const cats = (props['특수 카테고리(작성)']?.multi_select ?? []).map(o => o.name);

        if (!dateStart || !result) continue;

        results.push({ title, result, date: dateStart, home: cats.includes('홈') });
      }
    } while (cursor);

    res.setHeader('Cache-Control', 's-maxage=300');
    res.status(200).json({ games: results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
