'use client'

import { useEffect } from 'react'
import { siteConfig } from '@/lib/config'

interface StructuredDataProps {
  type: 'website' | 'article' | 'course' | 'organization'
  data: any
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  useEffect(() => {
    // Remove existing structured data
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"]')
    existingScripts.forEach(script => script.remove())

    // Add new structured data
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(data)
    document.head.appendChild(script)

    return () => {
      script.remove()
    }
  }, [data])

  return null
}

// Website structured data
export const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": siteConfig.name,
  "alternateName": siteConfig.shortName,
  "url": siteConfig.domain,
  "description": siteConfig.description,
  "potentialAction": {
    "@type": "SearchAction",
    "target": `${siteConfig.domain}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string"
  },
  "publisher": {
    "@type": "Organization",
    "name": siteConfig.name,
    "logo": {
      "@type": "ImageObject",
      "url": `${siteConfig.domain}${siteConfig.images.logo}`
    }
  }
}

// Organization structured data
export const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": siteConfig.name,
  "alternateName": siteConfig.shortName,
  "url": siteConfig.domain,
  "logo": `${siteConfig.domain}${siteConfig.images.logo}`,
  "description": siteConfig.description,
  "foundingDate": siteConfig.foundingYear,
  "address": {
    "@type": "PostalAddress",
    "addressCountry": siteConfig.contact.address.country
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "availableLanguage": siteConfig.supportedLanguages
  },
  "sameAs": [
    siteConfig.socialLinks.github,
    siteConfig.socialLinks.twitter
  ]
}

// Course structured data
export const courseStructuredData = {
  "@context": "https://schema.org",
  "@type": "Course",
  "name": `${siteConfig.name}课程`,
  "description": "通过AI驱动的智能对话、语音朗读和个性化学习路径，系统性地提升英语水平。",
  "provider": {
    "@type": "Organization",
    "name": siteConfig.name,
    "sameAs": siteConfig.domain
  },
  "courseMode": "online",
  "educationalLevel": "beginner",
  "inLanguage": siteConfig.supportedLanguages,
  "teaches": "English language learning",
  "hasCourseInstance": {
    "@type": "CourseInstance",
    "courseMode": "online",
    "inLanguage": siteConfig.supportedLanguages
  }
}

// Article structured data
export const articleStructuredData = (title: string, description: string, publishDate: string) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": title,
  "description": description,
  "image": `${siteConfig.domain}${siteConfig.images.ogImage}`,
  "author": {
    "@type": "Organization",
    "name": siteConfig.name
  },
  "publisher": {
    "@type": "Organization",
    "name": siteConfig.name,
    "logo": {
      "@type": "ImageObject",
      "url": `${siteConfig.domain}${siteConfig.images.logo}`
    }
  },
  "datePublished": publishDate,
  "dateModified": publishDate,
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": siteConfig.domain
  }
}) 