import type { Metadata } from 'next'
import SmoothScroll from '@/components/SmoothScroll'
import 'lenis/dist/lenis.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'DevStreak',
  description: 'Track your dev goals. Get roasted. Stay accountable.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        <SmoothScroll />
        {children}
      </body>
    </html>
  )
}
