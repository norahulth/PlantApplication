// api/push/test.js
const webpush = require('web-push');
const { removeSubscription, addSubscription } = require('./_store.js'); // optional add

webpush.setVapidDetails(
  'mailto:support@plantapp.fake',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).end();
    if (req.headers['x-push-secret'] !== process.env.PUSH_SECRET) {
      return res.status(401).json({ error: 'bad secret' });
    }

    // Body (fallback parser)
    let body = req.body;
    if (!body) {
      body = await new Promise((resolve) => {
        let data = '';
        req.on('data', (c) => (data += c));
        req.on('end', () => {
          try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); }
        });
      });
    }

    const {
      subscription,
      title = 'Test push ✅',
      body: msg = 'If you see this, pushes work!'
    } = body || {};

    if (!subscription) return res.status(400).json({ error: 'Missing subscription' });

    // (optional) ensure this sub exists in your store
    // await addSubscription(subscription);

    try {
      await webpush.sendNotification(subscription, JSON.stringify({
        title,
        body: msg,
        tag: 'manual-test'
      }));
      return res.status(200).json({ ok: true });
    } catch (e) {
      const code = e?.statusCode || e?.code;

      // 🔥 Clean up obviously bad/expired/unauthorized subs
      if (code === 400 || code === 401 || code === 403 || code === 404 || code === 410) {
        try { await removeSubscription(subscription); } catch {}
      }

      // Surface full details for debugging
      return res.status(500).json({
        ok: false,
        message: e?.message,
        statusCode: code,
        body: e?.body,       // text from push service (often says BadJwtToken / etc.)
        headers: e?.headers
      });
    }
  } catch (err) {
    return res.status(500).json({ ok: false, message: String(err?.message || err) });
  }
};
