// POST /2/tweets — OAuth 1.0a User Context (個人アプリ固定トークン方式)
const crypto = require('crypto');

function buildOAuthHeader(method, url, bodyParams, env) {
  const oauthParams = {
    oauth_consumer_key:     env.apiKey,
    oauth_nonce:            crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp:        String(Math.floor(Date.now() / 1000)),
    oauth_token:            env.accessToken,
    oauth_version:          '1.0',
  };

  // Signature base string — OAuth params only (bodyは JSON なので含めない)
  const sigParams = { ...oauthParams };
  const paramStr = Object.keys(sigParams).sort()
    .map(k => `${pct(k)}=${pct(sigParams[k])}`)
    .join('&');

  const baseStr = [method.toUpperCase(), pct(url), pct(paramStr)].join('&');
  const signingKey = `${pct(env.apiSecret)}&${pct(env.accessSecret)}`;
  const signature = crypto.createHmac('sha1', signingKey).update(baseStr).digest('base64');

  const headerParams = { ...oauthParams, oauth_signature: signature };
  const headerStr = 'OAuth ' + Object.keys(headerParams).sort()
    .map(k => `${pct(k)}="${pct(headerParams[k])}"`)
    .join(', ');

  return headerStr;
}

function pct(s) { return encodeURIComponent(s); }

exports.handler = async (event) => {
  const CORS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST')
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method Not Allowed' }) };

  const env = {
    apiKey:      process.env.TW_API_KEY,
    apiSecret:   process.env.TW_API_SECRET,
    accessToken: process.env.TW_ACCESS_TOKEN,
    accessSecret:process.env.TW_ACCESS_SECRET,
  };

  if (!env.apiKey || !env.apiSecret || !env.accessToken || !env.accessSecret) {
    console.error('[twitter-tweet] Missing env vars');
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Server misconfigured: set TW_API_KEY / TW_API_SECRET / TW_ACCESS_TOKEN / TW_ACCESS_SECRET' }) };
  }

  try {
    const { text } = JSON.parse(event.body);
    if (!text) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing: text' }) };

    const url = 'https://api.x.com/2/tweets';
    const authHeader = buildOAuthHeader('POST', url, {}, env);

    console.log('[twitter-tweet] Posting tweet, length:', text.length);

    const res = await fetch(url, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': authHeader,
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
