const webpush = require('web-push');

webpush.setVapidDetails(
  'mailto:support@plantapp.fake',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  if (req.headers['x-push-secret'] !== process.env.PUSH_SECRET) return res.status(401).json({ error: 'bad secret' });

  const { subscription, title = 'Test push ✅', body = 'If you see this, pushes work!' } = req.body || {};
  if (!subscription) return res.status(400).json({ error: 'Missing subscription' });

  try {
    await webpush.sendNotification(subscription, JSON.stringify({ title, body, tag: 'manual-test' }));
    return res.status(200).json({ ok: true });
  } catch (e) {
    // Surface everything useful:
    return res.status(500).json({
      ok: false,
      message: e?.message,
      statusCode: e?.statusCode,
      body: e?.body,        // text from push service (often explains the mismatch)
      headers: e?.headers
    });
  }
};
