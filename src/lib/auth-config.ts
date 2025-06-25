import { NextAuthOptions } from 'next-auth'
import { createClient } from '@/lib/supabase/server'
import CredentialsProvider from 'next-auth/providers/credentials'
import GithubProvider from 'next-auth/providers/github'

export const authOptions: NextAuthOptions = {
  providers: [
    // Provider for allowing users to sign up and then get immediately signed in
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
        }
      },
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // 使用 localhost 调用 API 路由，避免 DNS 解析问题
          const baseUrl = process.env.NODE_ENV === 'development' 
            ? 'http://localhost:3000' 
            : (process.env.NEXTAUTH_URL || 'http://localhost:3000')
          
          const response = await fetch(`${baseUrl}/api/auth/credentials`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password
            })
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
            console.error('Auth API error:', errorData.error)
            return null
          }

          const userData = await response.json()
          return userData

        } catch (error) {
          console.error('Unexpected auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('SignIn callback triggered:', { 
        provider: account?.provider, 
        userEmail: user?.email,
        userName: user?.name,
        userId: user?.id,
        profile: profile
      })

      // GitHub users are automatically verified (they have verified email from GitHub)
      if (account?.provider === 'github') {
        console.log('GitHub user - automatically verified')
      }

      // Handle user creation/update in Supabase for both GitHub and email/password
      if (user?.email) {
        console.log('Processing user sign in:', user.email)
        
        try {
          const supabase = createClient()
          
          // Check if user already exists in Supabase by email
          const { data: existingUser, error: selectError } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single()

          console.log('Existing user check:', { existingUser, selectError })

          if (selectError && selectError.code !== 'PGRST116') {
            console.error('Error checking existing user:', selectError)
            return '/auth/error?error=DatabaseError'
          }

          if (!existingUser) {
            console.log('Creating new user in Supabase:', {
              email: user.email,
              name: user.name,
              provider: account?.provider || 'credentials',
              email_verified: account?.provider === 'github' ? true : false
            })

            // Create new user in Supabase (let Supabase generate the ID)
            const { data: newUser, error: insertError } = await supabase
              .from('users')
              .insert([
                {
                  email: user.email,
                  name: user.name,
                  avatar_url: user.image,
                  provider: account?.provider || 'credentials',
                  email_verified: account?.provider === 'github' ? true : false
                }
              ])
              .select()
              .single()
            
            if (insertError) {
              console.error('Error creating user in Supabase:', insertError)
              // Don't fail the login if user creation fails
              // Just log the error and continue
            } else {
              console.log('User created successfully in Supabase:', newUser)
              // Update the user.id to match Supabase ID for session
              user.id = newUser.id
            }
          } else {
            console.log('User already exists in Supabase:', existingUser)
            // Update user info if needed
            if (existingUser.name !== user.name || existingUser.avatar_url !== user.image) {
              const { data: updatedUser, error: updateError } = await supabase
                .from('users')
                .update({
                  name: user.name,
                  avatar_url: user.image,
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingUser.id)
                .select()
                .single()
              
              if (updateError) {
                console.error('Error updating user in Supabase:', updateError)
              } else {
                console.log('User updated successfully:', updatedUser)
              }
            }
            // Update the user.id to match Supabase ID for session
            user.id = existingUser.id
          }
        } catch (error) {
          console.error('Unexpected error in signIn callback:', error)
          // Don't fail the login for unexpected errors
        }
      } else {
        console.warn('No user email provided in signIn callback')
      }
      
      console.log('SignIn callback returning true')
      return true
    },
    async session({ session, token }) {
      console.log('Session callback:', { 
        tokenId: token.sub, 
        tokenProvider: token.provider,
        tokenRole: token.role 
      })
      
      // Ensure session has user data
      if (token) {
        session.user = {
          id: token.sub as string, // 使用 token.sub 而不是 token.id
          email: token.email,
          name: token.name,
          image: token.picture,
          role: token.role || 'user' // 确保包含角色信息
        }
        
        console.log('Setting session user:', {
          name: session.user.name,
          email: session.user.email,
          id: session.user.id,
          role: session.user.role
        });
      }
      
      return session
    },
    async jwt({ token, user, account, trigger }) {
      console.log('JWT callback:', { 
        userId: user?.id, 
        accountProvider: account?.provider,
        tokenId: token.sub,
        trigger,
        currentRole: token.role
      });
      
      // 如果是登录或更新操作
      if (user) {
        // Use the user.id which should now be the Supabase ID
        token.id = user.id;
        token.sub = user.id; // Also update sub to match
        
        // 获取用户角色
        try {
          const supabase = createClient();
          const { data: publicUser, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();
            
          console.log('Fetching user role:', { 
            userId: user.id, 
            publicUser, 
            error 
          });
            
          if (publicUser?.role) {
            token.role = publicUser.role;
          } else if (!token.role) { // 只有在没有角色时才设置默认值
            token.role = 'user';
          }
          
          console.log('User role set in JWT:', token.role);
        } catch (error) {
          console.error('Error fetching user role in JWT callback:', error);
          if (!token.role) { // 只有在没有角色时才设置默认值
            token.role = 'user';
          }
        }
      } else if (trigger === 'update') {
        // 在更新时也尝试获取最新角色
        try {
          const supabase = createClient();
          const { data: publicUser } = await supabase
            .from('users')
            .select('role')
            .eq('id', token.sub)
            .single();
            
          if (publicUser?.role) {
            token.role = publicUser.role;
          }
        } catch (error) {
          console.error('Error updating role in JWT callback:', error);
        }
      }
      
      if (account) {
        token.provider = account.provider;
      }
      
      return token;
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