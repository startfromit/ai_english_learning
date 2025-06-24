// 网站基础配置
export const siteConfig = {
  // 域名配置 - 部署时修改
  domain: 'https://daily-english.eusoftbank.com',
  
  // 网站信息
  name: 'AI英语学习助手',
  shortName: 'AI英语助手',
  description: 'AI驱动的每日英语学习平台，结合智能对话、语音朗读和个性化学习路径，让英语学习更高效、更有趣。支持文章阅读、对话练习、词汇管理等功能。',
  
  // 关键词
  keywords: [
    '英语学习',
    'AI英语',
    '智能学习',
    '英语对话',
    '语音朗读',
    '英语词汇',
    '每日英语',
    '英语练习',
    '在线英语',
    '英语教育',
    'AI教育',
    '英语口语',
    '英语听力',
    '英语阅读'
  ],
  
  // 作者信息
  author: 'AI英语学习助手',
  publisher: 'AI英语学习助手',
  
  // 主题色
  themeColor: '#3B82F6',
  
  // 语言设置
  defaultLanguage: 'zh-CN',
  supportedLanguages: ['zh-CN', 'en'],
  
  // 社交媒体链接
  socialLinks: {
    github: 'https://github.com/your-repo',
    twitter: 'https://twitter.com/your-handle',
    // 添加其他社交媒体链接
  },
  
  // 搜索引擎验证码
  verification: {
    google: 'your-google-verification-code',
    bing: '32F90A6C61C109D0B5C62AC6C6A21EB0',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
    baidu: 'your-baidu-verification-code',
  },
  
  // 图片资源
  images: {
    logo: '/logo.svg',
    favicon: '/favicon.svg',
    ogImage: '/og-image.png',
    appleTouchIcon: '/apple-touch-icon.png',
    icon192: '/icon-192.png',
    icon512: '/icon-512.png',
  },
  
  // PWA配置
  pwa: {
    name: 'AI英语学习助手',
    shortName: 'AI英语助手',
    description: 'AI驱动的每日英语学习平台，结合智能对话、语音朗读和个性化学习路径',
    startUrl: '/',
    display: 'standalone',
    backgroundColor: '#ffffff',
    themeColor: '#3B82F6',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'zh-CN',
    categories: ['education', 'productivity'],
  },
  
  // 联系信息
  contact: {
    email: 'support@eusoftbank.com',
    address: {
      country: 'CN',
    },
  },
  
  // 创建年份
  foundingYear: '2024',
}

// 导出常用配置的便捷访问
export const {
  domain,
  name,
  shortName,
  description,
  keywords,
  author,
  publisher,
  themeColor,
  defaultLanguage,
  supportedLanguages,
  socialLinks,
  verification,
  images,
  pwa,
  contact,
  foundingYear,
} = siteConfig 