const SEFARIA_TEXT_API_URL = 'https://www.sefaria.org/api/texts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ref = url.searchParams.get('ref');

  if (!ref) {
    return new Response(JSON.stringify({ error: 'Missing ref parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (typeof fetch !== 'function') {
    return new Response(JSON.stringify({ error: 'fetch is not available on this runtime. Use Node 18+.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  try {
    const response = await fetch(`${SEFARIA_TEXT_API_URL}/${encodeURIComponent(ref)}?context=0`);
    if (!response.ok) {
      const body = await response.text();
      return new Response(JSON.stringify({ error: 'Upstream error', status: response.status, body }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const payload = await response.json();
    return new Response(JSON.stringify(payload), {
      status: response.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: 'Failed to fetch Sefaria text', message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}
