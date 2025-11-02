import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_KV_REST_API_TOKEN,
})

export default async function handler(req, res) {
  try {
    // Get all keys that start with "plants:"
    const keys = await redis.keys('plants:*')
    
    if (!keys || keys.length === 0) {
      return res.status(200).json({ 
        message: 'No plant data found in Redis',
        keys: []
      })
    }

    // Fetch data for each key
    const plantsData = {}
    for (const key of keys) {
      const data = await redis.get(key)
      plantsData[key] = data
    }

    return res.status(200).json({
      message: 'Plant data from Upstash Redis',
      totalUsers: keys.length,
      keys,
      data: plantsData
    })
  } catch (error) {
    console.error('Redis error:', error)
    return res.status(500).json({ 
      error: 'Database error', 
      detail: error.message 
    })
  }
}

