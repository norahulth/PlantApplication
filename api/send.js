import { Redis } from '@upstash/redis'
import webpush from 'web-push'

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_KV_REST_API_URL,
    token: process.env.UPSTASH_REDIS_KV_REST_API_TOKEN,
})

webpush.setVapidDetails(
  'mailto:you@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const payload = req.body || { title: 'Hello!', body: 'From PlantApp', url: '/' }

  const subs = await redis.smembers('push:subs')
  const results = await Promise.allSettled(subs.map(async raw => {
    const sub = JSON.parse(raw)
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload))
      return true
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410)
        await redis.srem('push:subs', raw)
      return false
    }
  }))

  res.json({ sent: results.filter(r => r.status === 'fulfilled').length })
}
