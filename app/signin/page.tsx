import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import SignInForm from '@/components/SignInForm'
import { verifySession, COOKIE_NAME } from '@/lib/session'

export const metadata = {
  title: 'Sign In | Modvora Labs',
}

export default async function SignInPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  const user = token ? await verifySession(token) : null

  if (user) redirect('/dashboard')

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0b]" />}>
      <SignInForm />
    </Suspense>
  )
}
