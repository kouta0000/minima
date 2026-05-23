// OAuth 2.0 トークン交換 / リフレッシュ
// X API v2 - Confidential Client (Web App) with PKCE
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
    const body        = JSON.parse(event.body);
    const CLIENT_ID   = process.env.TWITTER_CLIENT_ID;
    const CLIENT_SEC  = process.env.TWITTER_CLIENT_SECRET;
    const REDIRECT_URI = process.env.TWITTER_REDIRECT_URI || 'https://issowriter.netlify.app/';

    console.log('[twitter-auth] grant_type:', body.grant_type);
    console.log('[twitter-auth] CLIENT_ID present:', !!CLIENT_ID);
    console.log('[twitter-auth] CLIENT_SEC present:', !!CLIENT_SEC);
    console.log('[twitter-auth] REDIRECT_URI:', REDIRECT_URI);

    if (!CLIENT_ID || !CLIENT_SEC) {
      console.error('[twitter-auth] Missing env vars');
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Server misconfigured: missing credentials' }) };
    }

    // Confidential client: Basic auth ヘッダーで認証、bodyにclient_idは含めない
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SEC}`).toString('base64');

    let params;
    if (body.grant_type === 'refresh_token') {
      params = new URLSearchParams({
        grant_type:    'refresh_token',
        refresh_token:  body.refresh_token,
      });
    } else {
      params = new URLSearchParams({
        grant_type:   'authorization_code',
        code:          body.code,
        redirect_uri:  REDIRECT_URI,
        code_verifier: body.code_verifier,
      });
    }

    console.log('[twitter-auth] Calling token endpoint...');

    const res = await fetch('https://api.x.com/2/oauth2/token', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: params.toString(),
    });

    console.log('[twitter-auth] Token endpoint status:', res.status);

    // レスポンスがJSONでない場合に備えてテキストで取得してからパース
    const rawText = await res.text();
    console.log('[twitter-auth] Raw response:', rawText);

    let data;
    try { data = JSON.parse(rawText); }
    catch { data = { error: 'invalid_response', raw: rawText }; }

    return {
      statusCode: res.ok ? 200 : res.status,
      headers: CORS,
      body: JSON.stringify(data),
    };
  } catch (e) {
    console.error('[twitter-auth] Exception:', e.message);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
