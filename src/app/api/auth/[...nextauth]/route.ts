import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { NextAuthOptions } from 'next-auth'
import { createClient } from '@/lib/supabase/server'
import NextAuth from 'next-auth/next'
import CredentialsProvider from 'next-auth/providers/credentials'

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const supabase = createClient()
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials?.email || '',
          password: credentials?.password || ''
        })

        if (error) {
          console.error('Auth error:', error.message)
          return null
        }

        return data.user
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()
      session.user = data.session?.user || null
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
