const SEFARIA_INDEX_API_URL = 'https://www.sefaria.org/api/v2/index';

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
  const title = url.searchParams.get('title');

  if (!title) {
    return new Response(JSON.stringify({ error: 'Missing title parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  try {
    const response = await fetch(`${SEFARIA_INDEX_API_URL}/${encodeURIComponent(title)}`);
    const payload = await response.json();
    return new Response(JSON.stringify(payload), {
      status: response.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch Sefaria index' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}
