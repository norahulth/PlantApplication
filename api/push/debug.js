module.exports = (req, res) => {
    res.status(200).json({
      hasPublic: !!process.env.VAPID_PUBLIC_KEY,
      hasPrivate: !!process.env.VAPID_PRIVATE_KEY,
      hasSecret: !!process.env.PUSH_SECRET
    })
  }