# AI English Learning

An AI-powered English learning application built with Next.js, Supabase, and NextAuth.

## Features

- **AI-Powered Learning**: Interactive English learning with AI assistance
- **Speech Recognition**: Practice pronunciation with speech recognition
- **Multiple Authentication Methods**:
  - Email/Password authentication (Supabase)
  - GitHub OAuth login (NextAuth)
- **User Profiles**: Track your learning progress
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Supabase account
- GitHub account (for OAuth)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai_english_learning
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Fill in your Supabase and GitHub OAuth credentials
   - See `GITHUB_OAUTH_SETUP.md` for detailed GitHub OAuth setup instructions

4. Set up the database:
   - Create a `users` table in your Supabase database
   - See `GITHUB_OAUTH_SETUP.md` for the SQL schema

5. Run the development server:
```bash
npm run dev
# or
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Authentication Setup

### GitHub OAuth Setup

Follow the detailed instructions in `GITHUB_OAUTH_SETUP.md` to configure GitHub OAuth login.

### Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# GitHub OAuth Configuration
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret

# Other Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Usage

1. **Sign In**: Visit `/auth/signin` to sign in with email/password or GitHub
2. **Test Authentication**: Visit `/test-auth` to verify your authentication setup
3. **Start Learning**: Use the AI-powered features to improve your English

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js, Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **AI**: LangChain, OpenAI
- **Speech**: Microsoft Cognitive Services

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
