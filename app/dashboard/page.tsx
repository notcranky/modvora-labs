import { cookies } from 'next/headers'
import { verifySession, COOKIE_NAME } from '@/lib/session'
import { redirect } from 'next/navigation'
import Dashboard from '@/components/Dashboard'

export const metadata = {
  title: 'Your Build Plan | Modvora Labs',
  description: 'Your custom vehicle modification plan with recommended parts and retailer links.',
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  const user = token ? await verifySession(token) : null

  if (!user) redirect('/signin?from=/dashboard')

  return <Dashboard />
}
