// OAuth 2.0 トークン交換 / リフレッシュ
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
    const CLIENT_SEC   = process.env.TWITTER_CLIENT_SECRET;
    const REDIRECT_URI = process.env.TWITTER_REDIRECT_URI || 'https://issowriter.netlify.app/';

    const params = body.grant_type === 'refresh_token'
      ? new URLSearchParams({
          grant_type:    'refresh_token',
          refresh_token:  body.refresh_token,
          client_id:      CLIENT_ID,
        })
      : new URLSearchParams({
          grant_type:    'authorization_code',
          code:           body.code,
          redirect_uri:   REDIRECT_URI,
          client_id:      CLIENT_ID,
          code_verifier:  body.code_verifier,
        });

    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SEC}`).toString('base64');

    const res  = await fetch('https://api.twitter.com/2/oauth2/token', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: params.toString(),
    });
    const data = await res.json();

    return { statusCode: res.ok ? 200 : 400, headers: CORS, body: JSON.stringify(data) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
