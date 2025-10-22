// api/cron/daily.js
const webpush = require('web-push')
const { listSubscriptions, removeSubscription } = require('../push/_store.js')

module.exports = async function handler(req, res) {
  try {
    // Check env first so we return a readable error, not a crash
    const pub = process.env.VAPID_PUBLIC_KEY
    const priv = process.env.VAPID_PRIVATE_KEY

    if (!pub || !priv) {
      return res.status(500).json({
        ok: false,
        error: 'Missing VAPID keys',
        hasPublic: !!pub,
        hasPrivate: !!priv
      })
    }

    webpush.setVapidDetails('mailto:support@plantapp.fake', pub, priv)

    const subs = await listSubscriptions()
    if (!subs || !subs.length) {
      return res.status(200).json({ ok: true, sent: 0 })
    }

    const payload = JSON.stringify({
      title: 'Time to water your plants 🌱',
      body: 'Give your green buddies a sip!',
      tag: 'daily-water'
    })

    const results = await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(sub, payload)
        } catch (err) {
          const code = err?.statusCode || err?.code
          // expired/unsubscribed → delete it
          if (code === 404 || code === 410) await removeSubscription(sub)
          // rethrow others so we can see them in logs but still continue
          throw err
        }
      })
    )

    const failed = results.filter(r => r.status === 'rejected').length
    return res.status(200).json({ ok: true, sent: subs.length - failed, failed })
  } catch (e) {
    console.error('cron/daily error:', e)
    return res.status(500).json({ ok: false, error: String(e?.message || e) })
  }
}
