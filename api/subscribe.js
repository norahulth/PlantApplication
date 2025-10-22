import { Redis } from '@upstash/redis'

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_KV_REST_API_URL,
    token: process.env.UPSTASH_REDIS_KV_REST_API_TOKEN,
})

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const sub = req.body
  if (!sub?.endpoint) return res.status(400).json({ error: 'Bad subscription' })

  await redis.sadd('push:subs', JSON.stringify(sub))
  return res.status(201).json({ ok: true })
}
