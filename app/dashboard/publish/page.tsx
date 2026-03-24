import PublishBuild from '@/components/PublishBuild'
import { cookies } from 'next/headers'
import { COOKIE_NAME, verifySession } from '@/lib/session'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Publish Build | Modvora Labs',
  description: 'Publish a saved garage build to the community gallery.',
}

export default async function PublishBuildPage({ searchParams }: { searchParams?: { vehicle?: string; edit?: string } }) {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  const user = token ? await verifySession(token) : null

  if (!user) redirect('/signin?from=/dashboard/publish')

  return <PublishBuild initialVehicleId={searchParams?.vehicle} initialEditSlug={searchParams?.edit} />
}
