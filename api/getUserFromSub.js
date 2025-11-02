import { Redis } from '@upstash/redis'

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_KV_REST_API_URL,
    token: process.env.UPSTASH_REDIS_KV_REST_API_TOKEN,
})

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  
  const { endpoint } = req.query
  if (!endpoint) return res.status(400).json({ error: 'Missing endpoint' })

  try {
    const userId = await redis.get(`sub:${endpoint}`)
    if (userId) {
      return res.status(200).json({ userId })
    }
    return res.status(404).json({ error: 'No userId found for this subscription' })
  } catch (error) {
    console.error('Redis error:', error)
    return res.status(500).json({ error: 'Database error' })
  }
}

