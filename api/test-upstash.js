import { Redis } from '@upstash/redis'
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
})  
export default async function handler(req, res) {
  await redis.set('hello', 'plantapp!')
  const val = await redis.get('hello')
  res.status(200).json({ value: val })
}
