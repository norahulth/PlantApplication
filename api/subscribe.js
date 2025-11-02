import { Redis } from '@upstash/redis'

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_KV_REST_API_URL,
    token: process.env.UPSTASH_REDIS_KV_REST_API_TOKEN,
})

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  
  const { subscription, userId } = req.body
  if (!subscription?.endpoint) return res.status(400).json({ error: 'Bad subscription' })
  if (!userId) return res.status(400).json({ error: 'Missing userId' })

  // Store subscription with userId
  await redis.sadd('push:subs', JSON.stringify({ ...subscription, userId }))
  
  // Also create a reverse mapping: endpoint -> userId for quick lookup
  await redis.set(`sub:${subscription.endpoint}`, userId)
  
  return res.status(201).json({ ok: true })
}
