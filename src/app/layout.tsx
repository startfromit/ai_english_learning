import type { Metadata } from 'next'
import { EB_Garamond, Lato } from 'next/font/google'
import './globals.css'
import ThemeProvider from './components/ThemeProvider'

const ebGaramond = EB_Garamond({ 
  subsets: ['latin'],
  variable: '--font-eb-garamond',
  display: 'swap',
})

const lato = Lato({ 
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-lato',
  display: 'swap',
})



export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${ebGaramond.variable} ${lato.variable} font-sans bg-[#f8f4e9] text-[#2c3e50] dark:bg-[#181c23] dark:text-gray-100`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
} 