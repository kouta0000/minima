// トークンの有効性・スコープを検証
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
    const { access_token } = JSON.parse(event.body);
    if (!access_token) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing access_token' }) };

    // GET /2/users/me でトークンが有効かつ users.read スコープがあるか確認
    const res = await fetch('https://api.x.com/2/users/me', {
      headers: { 'Authorization': `Bearer ${access_token.trim()}` },
    });

    const rawText = await res.text();
    console.log('[twitter-verify] status:', res.status, 'body:', rawText);

    let data;
    try { data = JSON.parse(rawText); } catch { data = { raw: rawText }; }

    return { statusCode: res.status, headers: CORS, body: JSON.stringify(data) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
