const SEFARIA_TOPIC_API_URL = 'https://www.sefaria.org/api/v2/topics';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');

  if (!slug) {
    return new Response(JSON.stringify({ error: 'Missing slug parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const response = await fetch(`${SEFARIA_TOPIC_API_URL}/${encodeURIComponent(slug)}?with_refs=1`);
    const payload = await response.json();
    return new Response(JSON.stringify(payload), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch Sefaria topic' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
