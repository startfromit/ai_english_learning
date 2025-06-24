# 网站配置指南

## 概述

所有网站相关的配置信息都集中在 `src/lib/config.ts` 文件中，方便统一管理和修改。

## 主要配置项

### 1. 域名配置
```typescript
domain: 'https://your-domain.com'
```
**重要**: 部署时必须修改为实际的域名。

### 2. 网站基本信息
- `name`: 网站完整名称
- `shortName`: 网站简称
- `description`: 网站描述
- `keywords`: SEO关键词数组

### 3. 搜索引擎验证码
```typescript
verification: {
  google: 'your-google-verification-code',
  bing: '32F90A6C61C109D0B5C62AC6C6A21EB0', // 已配置
  yandex: 'your-yandex-verification-code',
  yahoo: 'your-yahoo-verification-code',
  baidu: 'your-baidu-verification-code',
}
```

### 4. 图片资源路径
```typescript
images: {
  logo: '/logo.svg',
  favicon: '/favicon.svg',
  ogImage: '/og-image.png',
  appleTouchIcon: '/apple-touch-icon.png',
  icon192: '/icon-192.png',
  icon512: '/icon-512.png',
}
```

### 5. 社交媒体链接
```typescript
socialLinks: {
  github: 'https://github.com/your-repo',
  twitter: 'https://twitter.com/your-handle',
}
```

## 部署前需要修改的项目

1. **域名**: 修改 `domain` 为实际域名
2. **验证码**: 添加各搜索引擎的验证码
3. **社交媒体**: 更新社交媒体链接
4. **联系信息**: 更新邮箱等联系信息

## 配置的使用

配置会自动应用到以下文件：
- `src/app/layout.tsx` - 网站元数据和SEO信息
- `src/app/page.tsx` - 首页元数据
- `src/app/components/StructuredData.tsx` - 结构化数据
- `src/app/sitemap.ts` - 网站地图
- `src/app/robots.ts` - 搜索引擎爬虫规则

## 图标文件

确保以下图标文件存在于 `public/` 目录：
- `favicon.svg` - 网站图标
- `logo.svg` - 网站Logo
- `og-image.png` - Open Graph图片 (1200x630)
- `apple-touch-icon.png` - iOS图标 (180x180)
- `icon-192.png` - PWA图标 (192x192)
- `icon-512.png` - PWA图标 (512x512)

## 注意事项

1. 修改配置后需要重启开发服务器
2. 域名变更会影响所有相关链接
3. 验证码需要从各搜索引擎站长工具获取
4. 图片文件需要手动上传到public目录 