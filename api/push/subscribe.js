import { addSubscription } from './_store.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  if (req.headers['x-push-secret'] !== process.env.PUSH_SECRET) return res.status(401).end()

  const { subscription } = req.body || {}
  if (!subscription) return res.status(400).json({ error: 'Missing subscription' })

  await addSubscription(subscription)
  res.status(200).json({ ok: true })
}
