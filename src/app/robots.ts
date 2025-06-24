import { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/config'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/_next/',
          '/private/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
        ],
      },
      {
        userAgent: 'Baiduspider',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
        ],
      },
    ],
    sitemap: `${siteConfig.domain}/sitemap.xml`,
    host: siteConfig.domain,
  }
} 