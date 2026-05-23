// OAuth 2.0 トークン交換 — Public Client (Native App) 方式
// client_id をボディに含め、Authorization ヘッダーは不要
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
    const body         = JSON.parse(event.body);
    const CLIENT_ID    = process.env.TWITTER_CLIENT_ID;
    const REDIRECT_URI = process.env.TWITTER_REDIRECT_URI || 'https://issowriter.netlify.app/';

    if (!CLIENT_ID) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'TWITTER_CLIENT_ID が未設定です' }) };
    }

    console.log('[twitter-auth] grant_type:', body.grant_type);

    let params;
    if (body.grant_type === 'refresh_token') {
      params = new URLSearchParams({
        grant_type:    'refresh_token',
        refresh_token:  body.refresh_token,
        client_id:      CLIENT_ID,
      });
    } else {
      params = new URLSearchParams({
        grant_type:    'authorization_code',
        code:           body.code,
        redirect_uri:   REDIRECT_URI,
        client_id:      CLIENT_ID,
        code_verifier:  body.code_verifier,
      });
    }

    const res = await fetch('https://api.x.com/2/oauth2/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    params.toString(),
    });

    const rawText = await res.text();
    console.log('[twitter-auth] status:', res.status, 'body:', rawText);

    let data;
    try { data = JSON.parse(rawText); }
    catch { data = { error: 'invalid_response', raw: rawText }; }

    return { statusCode: res.ok ? 200 : res.status, headers: CORS, body: JSON.stringify(data) };
  } catch (e) {
    console.error('[twitter-auth] Exception:', e.message);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
