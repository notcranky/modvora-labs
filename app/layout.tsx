import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { cookies } from 'next/headers'
import { COOKIE_NAME, verifySession } from '@/lib/session'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Modvora Labs — Custom Car Modification Planning',
  description:
    'Custom car upgrade plans, performance guidance, and build strategy for your vehicle, your budget, and your goals.',
  keywords: 'car modifications, custom build plans, performance upgrades, automotive tuning, mod planning',
  openGraph: {
    title: 'Modvora Labs',
    description: 'Smarter Mod Plans for Real Builds',
    type: 'website',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  const user = token ? await verifySession(token) : null

  return (
    <html lang="en">
      <body className="bg-[#0a0a0b] text-[#f4f4f5] antialiased">
        <Navbar initialUser={user} />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
