import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Spoolio Badge',
  description: 'Fiche SOS festivalier',
}

export const viewport: Viewport = {
  themeColor: '#1B4FD8',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${inter.className} bg-amber-50 text-gray-900 min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
