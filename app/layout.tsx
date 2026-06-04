import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-dm-sans',
})

export const metadata: Metadata = {
  title: 'lembrete de prospecção',
  description: 'a arte de vender arte — ferramenta 04',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${dmSans.variable} h-full`}>
      <body className="min-h-full" style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
