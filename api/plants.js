import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_KV_REST_API_TOKEN,
})

export default async function handler(req, res) {
  // Get userId from header or query
  const userId = req.headers['x-user-id'] || req.query.userId
  
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' })
  }

  const key = `plants:${userId}`

  try {
    switch (req.method) {
      case 'GET': {
        // Fetch all plants for this user
        const plants = await redis.get(key)
        return res.status(200).json({ plants: plants || [] })
      }

      case 'POST': {
        // Set entire plant array (used for bulk updates)
        const { plants } = req.body
        if (!Array.isArray(plants)) {
          return res.status(400).json({ error: 'plants must be an array' })
        }
        await redis.set(key, plants)
        return res.status(200).json({ ok: true, plants })
      }

      case 'DELETE': {
        // Delete all plants for this user
        await redis.del(key)
        return res.status(200).json({ ok: true })
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Redis error:', error)
    return res.status(500).json({ error: 'Database error', detail: error.message })
  }
}