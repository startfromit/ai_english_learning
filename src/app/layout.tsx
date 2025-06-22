'use client';

import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import { Inter as FontSans, Lora as FontSerif } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { AuthProvider } from '../components/AuthProvider'
import ThemeProvider from './components/ThemeProvider'
import Header from './components/Header'
import Footer from './components/Footer'

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
})

const fontSerif = FontSerif({
  subsets: ['latin'],
  variable: '--font-serif',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <I18nextProvider i18n={i18n}>
      <html lang="en" suppressHydrationWarning>
        <body
          className={cn(
            'min-h-screen bg-background font-sans antialiased flex flex-col',
            fontSans.variable,
            fontSerif.variable
          )}
        >
          <AuthProvider>
            <ThemeProvider>
              <div className="flex-grow">
                <Header />
                <main>{children}</main>
              </div>
              <Footer />
            </ThemeProvider>
          </AuthProvider>
        </body>
      </html>
    </I18nextProvider>
  )
} 