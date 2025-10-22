import { Redis } from '@upstash/redis'
import webpush from 'web-push'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_KV_REST_API_TOKEN,
})

// VAPID config
webpush.setVapidDetails(
  'mailto:hello@plantapp.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const payload = req.body && typeof req.body === 'object'
    ? req.body
    : { title: 'PlantApp', body: 'Hello!', url: '/' }

  // sanity checks
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return res.status(500).json({ error: 'Missing VAPID keys on server' })
  }

  try {
    const subs = await redis.smembers('push:subs')
    if (!subs || subs.length === 0) {
      return res.status(200).json({ sent: 0, reason: 'no-subscriptions' })
    }

    let sent = 0
    const errors = []

    for (const raw of subs) {
      try {
        const sub = JSON.parse(raw)
        await webpush.sendNotification(sub, JSON.stringify(payload))
        sent++
      } catch (e) {
        // Clean up dead subs
        if (e.statusCode === 404 || e.statusCode === 410) {
          await redis.srem('push:subs', raw)
        } else {
          errors.push(e.message || String(e))
          console.error('Push error:', e)
        }
      }
    }

    return res.status(200).json({ sent, total: subs.length, errors })
  } catch (e) {
    console.error('Send handler error:', e)
    return res.status(500).json({ error: 'Failed to send push' })
  }
}
