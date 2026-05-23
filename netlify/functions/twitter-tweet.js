// POST /2/tweets — OAuth 1.0a User Context
const crypto = require('crypto');

function pct(s) { return encodeURIComponent(String(s)); }

function buildOAuthHeader(method, url, env) {
  const o = {
    oauth_consumer_key:     env.apiKey,
    oauth_nonce:            crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp:        String(Math.floor(Date.now() / 1000)),
    oauth_token:            env.accessToken,
    oauth_version:          '1.0',
  };

  // JSON body は署名に含めない
  const paramStr = Object.keys(o).sort().map(k => `${pct(k)}=${pct(o[k])}`).join('&');
  const baseStr  = [method.toUpperCase(), pct(url), pct(paramStr)].join('&');
  const sigKey   = `${pct(env.apiSecret)}&${pct(env.accessSecret)}`;
  const sig      = crypto.createHmac('sha1', sigKey).update(baseStr).digest('base64');

  const all = { ...o, oauth_signature: sig };
  return 'OAuth ' + Object.keys(all).sort().map(k => `${pct(k)}="${pct(all[k])}"`).join(', ');
}

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
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Missing env vars: TW_API_KEY / TW_API_SECRET / TW_ACCESS_TOKEN / TW_ACCESS_SECRET' }) };
  }

  try {
    const { text } = JSON.parse(event.body);
    if (!text) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing: text' }) };

    const url = 'https://api.twitter.com/2/tweets';
    const auth = buildOAuthHeader('POST', url, env);

    console.log('[twitter-tweet] Posting, length:', text.length);

    const res = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': auth },
      body:    JSON.stringify({ text }),
    });

    const raw = await res.text();
    console.log('[twitter-tweet] status:', res.status, 'body:', raw);

    let data;
    try { data = JSON.parse(raw); } catch { data = { raw }; }

    if (!res.ok) {
      const detail = data?.detail || data?.errors?.[0]?.message || data?.error || raw;
      return { statusCode: res.status, headers: CORS, body: JSON.stringify({ error: detail }) };
    }
    return { statusCode: 201, headers: CORS, body: JSON.stringify(data) };
  } catch (e) {
    console.error('[twitter-tweet] Exception:', e.message);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
