let SUBS = []

export async function addSubscription(sub) {
  const key = JSON.stringify(sub)
  if (!SUBS.find(s => JSON.stringify(s) === key)) SUBS.push(sub)
}
export async function listSubscriptions() { return SUBS }
export async function removeSubscription(sub) {
  const key = JSON.stringify(sub)
  SUBS = SUBS.filter(s => JSON.stringify(s) !== key)
}
