// ツイート投稿プロキシ
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

    if (!text || !access_token)
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing params' }) };

    const res  = await fetch('https://api.twitter.com/2/tweets', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${access_token}`,
      },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();

    return { statusCode: res.ok ? 201 : res.status, headers: CORS, body: JSON.stringify(data) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
