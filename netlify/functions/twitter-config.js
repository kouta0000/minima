// クライアントIDを安全にフロントエンドへ提供する
exports.handler = async () => ({
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client_id:    process.env.TWITTER_CLIENT_ID    || '',
    redirect_uri: process.env.TWITTER_REDIRECT_URI || 'https://issowriter.netlify.app/',
  }),
});
