# GitHub OAuth 登录设置指南

## 1. 创建 GitHub OAuth 应用

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 点击 "New OAuth App"
3. 填写应用信息：
   - **Application name**: AI English Learning (或您喜欢的名称)
   - **Homepage URL**: `http://localhost:3000` (开发环境) 或您的生产域名
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github` (开发环境) 或 `https://yourdomain.com/api/auth/callback/github` (生产环境)
4. 点击 "Register application"
5. 记录下 **Client ID** 和 **Client Secret**

## 2. 配置环境变量

在项目根目录创建 `.env.local` 文件，添加以下配置：

```bash
# Supabase Configuration (已有)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# NextAuth Configuration
NEXTAUTH_SECRET=fNut5EYeHd/Jglyvx7OhO9JAqVVSr+PFhTJFVuyhoAI=
NEXTAUTH_URL=http://localhost:3000

# GitHub OAuth Configuration
GITHUB_ID=your_github_client_id_here
GITHUB_SECRET=your_github_client_secret_here

# Other Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 3. 生成 NEXTAUTH_SECRET

运行以下命令生成一个安全的密钥：

```bash
openssl rand -base64 32
```

## 4. 数据库设置

确保您的 Supabase 数据库中有 `users` 表，包含以下字段：

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  avatar_url TEXT,
  provider TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 5. 启动应用

配置完成后，重新启动开发服务器：

```bash
npm run dev
```

## 6. 测试登录

1. 访问 `http://localhost:3000/auth/signin`
2. 点击 "Sign in with GitHub" 按钮
3. 授权 GitHub 应用
4. 验证登录是否成功

## 注意事项

- 确保 `.env.local` 文件已添加到 `.gitignore` 中
- 生产环境部署时，请更新 GitHub OAuth 应用的 callback URL
- 生产环境请使用 HTTPS
- 定期轮换 NEXTAUTH_SECRET 以提高安全性 