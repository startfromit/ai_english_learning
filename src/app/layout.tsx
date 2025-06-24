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
import type { Metadata } from 'next'
import { siteConfig } from '@/lib/config'

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
})

const fontSerif = FontSerif({
  subsets: ['latin'],
  variable: '--font-serif',
})

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} - 每日智能英语学习平台`,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.author }],
  creator: siteConfig.author,
  publisher: siteConfig.publisher,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(siteConfig.domain),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: siteConfig.defaultLanguage,
    url: siteConfig.domain,
    title: `${siteConfig.name} - 每日智能英语学习平台`,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.images.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} - 智能英语学习平台`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} - 每日智能英语学习平台`,
    description: siteConfig.description,
    images: [siteConfig.images.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: siteConfig.verification.google,
    yandex: siteConfig.verification.yandex,
    yahoo: siteConfig.verification.yahoo,
  },
  category: 'education',
  classification: 'English Learning Platform',
  other: {
    'baidu-site-verification': siteConfig.verification.baidu,
    'msvalidate.01': siteConfig.verification.bing,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <I18nextProvider i18n={i18n}>
      <html lang={siteConfig.defaultLanguage} suppressHydrationWarning>
        <head>
          <link rel="icon" href={siteConfig.images.favicon} type="image/svg+xml" />
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="apple-touch-icon" href={siteConfig.images.appleTouchIcon} />
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content={siteConfig.themeColor} />
          <meta name="msapplication-TileColor" content={siteConfig.themeColor} />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content={siteConfig.name} />
          <meta name="application-name" content={siteConfig.name} />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="format-detection" content="telephone=no" />
          <meta name="msapplication-config" content="/browserconfig.xml" />
          
          {/* Bing Webmaster Tools Verification */}
          <meta name="msvalidate.01" content={siteConfig.verification.bing} />
        </head>
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