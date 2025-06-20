import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { NextAuthOptions } from 'next-auth'
import { createClient } from '@/lib/supabase/server'
import NextAuth from 'next-auth/next'
import CredentialsProvider from 'next-auth/providers/credentials'
import GithubProvider from 'next-auth/providers/github'

const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
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
    async signIn({ user, account, profile }) {
      console.log('SignIn callback triggered:', { 
        provider: account?.provider, 
        userEmail: user?.email,
        userName: user?.name 
      })

      // If signing in with GitHub, handle user creation/update in Supabase
      if (account?.provider === 'github') {
        console.log('GitHub sign in detected')
        
        if (!user.email) {
          console.error('GitHub user has no email')
          return '/auth/error?error=NoEmail'
        }

        try {
          const supabase = createClient()
          
          // Check if user already exists in Supabase
          const { data: existingUser, error: selectError } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single()

          if (selectError && selectError.code !== 'PGRST116') {
            console.error('Error checking existing user:', selectError)
            return '/auth/error?error=DatabaseError'
          }

          if (!existingUser) {
            console.log('Creating new user in Supabase:', {
              id: user.id,
              email: user.email,
              name: user.name
            })

            // Create new user in Supabase
            const { error: insertError } = await supabase
              .from('users')
              .insert([
                {
                  id: user.id,
                  email: user.email,
                  name: user.name,
                  avatar_url: user.image,
                  provider: 'github'
                }
              ])
            
            if (insertError) {
              console.error('Error creating user in Supabase:', insertError)
              // Don't fail the login if user creation fails
              // Just log the error and continue
            } else {
              console.log('User created successfully in Supabase')
            }
          } else {
            console.log('User already exists in Supabase')
          }
        } catch (error) {
          console.error('Unexpected error in signIn callback:', error)
          // Don't fail the login for unexpected errors
        }
      }
      
      console.log('SignIn callback returning true')
      return true
    },
    async session({ session, token }) {
      console.log('Session callback:', { tokenId: token.id, tokenProvider: token.provider })
      
      // For GitHub users, use NextAuth session data
      if (token.provider === 'github') {
        session.user = {
          id: token.id as string,
          email: token.email,
          name: token.name,
          image: token.picture
        }
      } else {
        // For Supabase users, get session from Supabase
        const supabase = createClient()
        const { data } = await supabase.auth.getSession()
        session.user = data.session?.user || null
      }
      
      return session
    },
    async jwt({ token, user, account }) {
      console.log('JWT callback:', { 
        userId: user?.id, 
        accountProvider: account?.provider,
        tokenId: token.id 
      })
      
      if (user) {
        token.id = user.id
      }
      if (account) {
        token.provider = account.provider
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
  debug: process.env.NODE_ENV === 'development',
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
