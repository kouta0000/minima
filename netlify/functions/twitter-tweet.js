// POST /2/tweets — OAuth 2.0 User Context (Bearer token)
exports.handler = async (event) => {
  const CORS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST')
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method Not Allowed' }) };

  try {
    const { text, access_token } = JSON.parse(event.body);
    if (!text)         return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing: text' }) };
    if (!access_token) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing: access_token' }) };

    console.log('[twitter-tweet] length:', text.length, 'token:', access_token.slice(0,8) + '...');

    const res = await fetch('https://api.x.com/2/tweets', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${access_token}`,
      },
      body: JSON.stringify({ text }),
    });

    const rawText = await res.text();
    console.log('[twitter-tweet] status:', res.status, 'body:', rawText);

    let data;
    try { data = JSON.parse(rawText); } catch { data = { raw: rawText }; }

    if (!res.ok) {
      const detail = data?.detail || data?.errors?.[0]?.message || data?.error || rawText;
      return { statusCode: res.status, headers: CORS, body: JSON.stringify({ error: detail }) };
    }

    return { statusCode: 201, headers: CORS, body: JSON.stringify(data) };
  } catch (e) {
    console.error('[twitter-tweet] Exception:', e.message);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
