import { cookies } from 'next/headers'
import { verifySession, COOKIE_NAME } from '@/lib/session'
import { redirect } from 'next/navigation'
import CheckoutClient from './CheckoutClient'

export const metadata = {
  title: 'Checkout | Modvora Labs',
  description: 'Review and confirm your Modvora Labs plan.',
}

export default async function CheckoutPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  const user = token ? await verifySession(token) : null

  // Allow checkout for free tier without auth, but show auth notice
  // For paid tiers, require auth

  return <CheckoutClient user={user} />
}
