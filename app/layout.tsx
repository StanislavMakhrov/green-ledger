/**
 * Root layout — wraps every page with the sidebar nav.
 * Public supplier pages use a separate layout (no nav).
 */
import type { Metadata } from 'next'
import './globals.css'
import { Nav } from '@/components/Nav'

export const metadata: Metadata = {
  title: 'GreenLedger — CSRD Climate Reporting',
  description: 'Automated CSRD/ESRS E1 climate reporting for German SMEs',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen bg-gray-50">
        <Nav />
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </body>
    </html>
  )
}
