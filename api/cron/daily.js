import webpush from 'web-push'
import { listSubscriptions, removeSubscription } from '../push/_store.js'

webpush.setVapidDetails(
  'mailto:hello@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

export default async function handler(_req, res) {
  const subs = await listSubscriptions()
  const payload = JSON.stringify({
    title: 'TEST Time to water your plants 🌱',
    body: 'Give your green buddies a sip!',
    tag: 'daily-water'
  })

  const results = await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(sub, payload)
      } catch (err) {
        const code = err?.statusCode || err?.code
        if (code === 410 || code === 404) await removeSubscription(sub) // expired
      }
    })
  )

  res.status(200).json({ sent: results.length })
}
