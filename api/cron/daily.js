import { Redis } from '@upstash/redis'
import webpush from 'web-push'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_KV_REST_API_TOKEN,
})

webpush.setVapidDetails(
  'mailto:hello@plantapp.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

export default async function handler(req, res) {
  // Allow only Vercel Cron or a manual call with a secret
  const isCron = req.headers['x-vercel-cron'] === '1'
  const okBySecret = req.headers.authorization === `Bearer ${process.env.PUSH_SECRET}`
  if (!isCron && !okBySecret) return res.status(403).json({ error: 'forbidden' })

  const payload = {
    title: '🌙 Plant reminder',
    body: 'Time to check your plants for water 💧',
    url: '/'
  }

  try {
    const subs = await redis.smembers('push:subs')
    if (!subs?.length) return res.status(200).json({ sent: 0, reason: 'no-subs' })

    let sent = 0, errors = []
    for (const raw of subs) {
      try {
        await webpush.sendNotification(JSON.parse(raw), JSON.stringify(payload))
        sent++
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) {
          await redis.srem('push:subs', raw)
        } else {
          errors.push(e.message || String(e))
        }
      }
    }
    return res.status(200).json({ sent, total: subs.length, errors })
  } catch (e) {
    return res.status(500).json({ error: 'send-failed', detail: e.message })
  }
}
