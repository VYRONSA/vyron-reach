import type { Metadata } from 'next'
import './globals.css'

const inter = {
  variable: '--font-inter',
} as const

export const metadata: Metadata = {
  title: 'VYRON REACH — Revenue Command Centre',
  icons: {
    icon: '/vyron-logo.svg',
    shortcut: '/vyron-logo.svg',
    apple: '/vyron-logo.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="min-h-screen bg-[#030407] text-slate-100 antialiased">{children}</body>
    </html>
  )
}
