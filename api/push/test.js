const webpush = require('web-push');

webpush.setVapidDetails(
  'mailto:support@plantapp.fake',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  if (req.headers['x-push-secret'] !== process.env.PUSH_SECRET) return res.status(401).end();

  const { subscription, title = 'Test push ✅', body = 'If you see this, pushes work!' } = req.body || {};
  if (!subscription) return res.status(400).json({ error: 'Missing subscription' });

  try {
    await webpush.sendNotification(subscription, JSON.stringify({ title, body, tag: 'manual-test' }));
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
};
