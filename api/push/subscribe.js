// /api/push/subscribe.js
const webpush = require('web-push')
const { addSubscription } = require('./_store.js')

// Set VAPID only if both keys exist (prevents runtime throw)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:support@plantapp.fake',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).end('Method Not Allowed')

    // simple auth
    if (req.headers['x-push-secret'] !== process.env.PUSH_SECRET) {
      return res.status(401).end('Unauthorized')
    }

    // Body parsing (Vercel usually parses JSON, but handle fallback)
    let body = req.body
    if (!body) {
      body = await new Promise((resolve) => {
        let data = ''
        req.on('data', (c) => (data += c))
        req.on('end', () => {
          try { resolve(JSON.parse(data || '{}')) } catch { resolve({}) }
        })
      })
    }

    const { subscription } = body || {}
    if (!subscription) return res.status(400).json({ error: 'Missing subscription' })

    await addSubscription(subscription)

    // Optional: send a welcome push immediately to prove end-to-end
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      try {
        await webpush.sendNotification(
          subscription,
          JSON.stringify({
            title: 'Push is enabled 🌿',
            body: 'You’ll get your plant reminder at the scheduled time.',
            tag: 'welcome'
          })
        )
      } catch (e) {
        console.warn('welcome push failed:', e?.message || e)
        // don’t fail the API because of this
      }
    }

    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('subscribe error:', e)
    return res.status(500).json({ error: String(e?.message || e) })
  }
}
