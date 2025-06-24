import { Suspense } from 'react'
import ArticlePanel from './components/ArticlePanel'
import StructuredData, { websiteStructuredData, organizationStructuredData, courseStructuredData } from './components/StructuredData'
import type { Metadata } from 'next'
import { siteConfig } from '@/lib/config'

export const metadata: Metadata = {
  title: `${siteConfig.name} - 每日智能英语学习平台`,
  description: siteConfig.description,
  keywords: siteConfig.keywords.join(','),
  openGraph: {
    title: `${siteConfig.name} - 每日智能英语学习平台`,
    description: siteConfig.description,
    type: 'website',
    url: siteConfig.domain,
    images: [
      {
        url: siteConfig.images.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} - 智能英语学习平台`,
      },
    ],
  },
}

export default function Home() {
  return (
    <>
      <StructuredData type="website" data={websiteStructuredData} />
      <StructuredData type="organization" data={organizationStructuredData} />
      <StructuredData type="course" data={courseStructuredData} />
      
      <div>
        <div className="container py-4">
          <Suspense fallback={<div>Loading...</div>}>
            <ArticlePanel />
          </Suspense>
        </div>
      </div>
    </>
  )
}