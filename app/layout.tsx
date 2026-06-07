import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import Providers from './providers'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'RHConnect — ISM Dakar',
  description: 'Plateforme SaaS de gestion des vacataires — Institut Supérieur de Management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${poppins.variable} h-full`}>
      <body className="h-full antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
