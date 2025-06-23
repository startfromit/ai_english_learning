import NextAuth, { getServerSession, NextAuthOptions } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from '@/lib/supabase/client';
import { Database } from './supabase/database'
import { signOut as nextAuthSignOut } from 'next-auth/react'
import { User } from '@supabase/supabase-js';
import { headers } from 'next/headers'
import { NextRequest } from 'next/server'

type UserUsage = Database['public']['Tables']['user_usage']['Row']
type UserProfile = Database['public']['Tables']['users']['Row']

export async function getSession() {
  try {
    const session = await getServerSession(authOptions);
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

// 专门用于API路由的函数
export async function getCurrentUserFromRequest(req: NextRequest): Promise<{ id: string; email: string | null } | null> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return null;
    }
    
    return {
      id: session.user.id,
      email: session.user.email || null
    };
  } catch (error) {
    console.error('Error getting current user from request:', error);
    return null;
  }
}

export async function getCurrentUser(): Promise<{ id: string; email: string | null } | null> {
  try {
    // 在API路由中，我们需要从请求头中获取用户信息
    const session = await getSession() as any;
    if (!session?.user?.id) {
      return null;
    }
    
    return {
      id: session.user.id,
      email: session.user.email || null
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = createClient();
  const { data: publicUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();
  
  return publicUser;
}

export async function signOut() {
  // Sign out from NextAuth (this will handle both GitHub and email/password)
  await nextAuthSignOut({ redirect: false })
}

export async function canPlayAudio(): Promise<{ canPlay: boolean; remaining: number }> {
  try {
    const user = await getCurrentUser()
    if (!user) return { canPlay: false, remaining: 0 }

    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    
    // Get or create user usage record
    const { data: usage, error } = await supabase
      .from('user_usage')
      .select('play_count, usage_date')
      .eq('user_id', user.id)
      .eq('usage_date', today)
      .single() as { data: UserUsage | null; error: any }

    const MAX_DAILY_PLAYS = 20
    
    // If no record exists or it's a new day, reset the counter
    if (!usage || usage.usage_date !== today) {
      const { error: upsertError } = await supabase
        .from('user_usage')
        .upsert({
          user_id: user.id,
          play_count: 1,
          usage_date: today,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,usage_date',
          ignoreDuplicates: false
        })
      
      if (upsertError) {
        console.error('Error updating user usage:', upsertError)
        return { canPlay: false, remaining: 0 }
      }
      
      return { canPlay: true, remaining: MAX_DAILY_PLAYS - 1 }
    }
    
    // Check if user has reached the limit
    if (usage.play_count >= MAX_DAILY_PLAYS) {
      return { canPlay: false, remaining: 0 }
    }
    
    // Increment the play count directly
    const { error: updateError } = await supabase
      .from('user_usage')
      .update({
        play_count: usage.play_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('usage_date', today)
    
    if (updateError) {
      console.error('Error incrementing play count:', updateError)
      return { canPlay: false, remaining: 0 }
    }
    
    return { 
      canPlay: true, 
      remaining: MAX_DAILY_PLAYS - (usage.play_count + 1)
    }
  } catch (error) {
    console.error('Error in canPlayAudio:', error)
    return { canPlay: false, remaining: 0 }
  }
}

// Get current user's remaining plays for today
export async function getRemainingPlays(): Promise<number> {
  const user = await getCurrentUser()
  if (!user) return 0

  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  
  const { data: usage, error } = await supabase
    .from('user_usage')
    .select('play_count')
    .eq('user_id', user.id)
    .eq('usage_date', today)
    .single() as { data: Pick<UserUsage, 'play_count'> | null; error: any }

  if (error || !usage) return 20 // Default to max if no record exists
  
  return Math.max(0, 20 - (usage.play_count || 0))
}

export const authOptions: NextAuthOptions = {
  providers: [
    // Provider for allowing users to sign up and then get immediately signed in
    CredentialsProvider({
      id: 'supabase',
      name: 'Supabase',
      credentials: {
        accessToken: { type: 'text' },
        refreshToken: { type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.accessToken || !credentials?.refreshToken) {
          console.error("Authorize Error: Access Token or Refresh Token was not provided.");
          return null;
        }

        const supabase = createClient();

        const { error: sessionError } = await supabase.auth.setSession({
          access_token: credentials.accessToken,
          refresh_token: credentials.refreshToken,
        });

        if (sessionError) {
          console.error(`Authorize Error: Supabase setSession failed: ${sessionError.message}`);
          return null;
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error(`Authorize Error: Supabase getUser failed. User: ${!!user}, Error: ${userError?.message}`);
          return null;
        }
        
        const { data: publicUser } = await supabase
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single();

        return {
          id: user.id,
          email: user.email,
          name: publicUser?.name || user.email,
        };
      },
    }),
    // Provider for standard email/password sign-in
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: {  label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        const supabase = createClient()
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        })

        if (error) {
          console.error('Sign in error:', error.message)
          return null
        }
        
        if (data.user) {
          const { data: publicUser } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (publicUser?.provider !== 'credentials') {
             return null;
          }
          if (!publicUser?.email_verified) {
            throw new Error('Please verify your email address before signing in.');
          }

          return {
            id: data.user.id,
            email: data.user.email,
            name: publicUser?.name || data.user.email,
          };
        }
        return null
      },
    }),
    // Provider for GitHub OAuth
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // 如果这是登录后的第一次调用，user 对象是可用的
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        
        // 立即设置一个临时角色，稍后会在数据库查询后更新
        token.role = 'user';
      }
      
      // 如果 token 中有 id，尝试获取用户角色
      const userId = token.id || token.sub;
      if (userId) {
        try {
          // 使用服务端 Supabase 客户端
          const { createClient } = await import('./supabase/server');
          const supabase = createClient();
          
          // 从数据库获取用户角色
          const { data: publicUser, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();
            
          console.log('Fetching user role:', { userId, publicUser, error });
          
          if (error) {
            console.error('Error fetching user role:', error);
          }
          
          // 更新 token 中的角色
          token.role = publicUser?.role || 'user';
        } catch (error) {
          console.error('Error in JWT callback:', error);
          token.role = 'user';
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      console.log('Session callback', { token, session });
      
      if (session.user) {
        // 确保 session.user 有正确的类型
        const userWithRole = session.user as {
          id: string;
          email?: string | null;
          name?: string | null;
          image?: string | null;
          role?: string;
        };
        
        // 设置用户 ID 和角色
        userWithRole.id = token.sub || token.id || '';
        userWithRole.role = token.role || 'user';
        
        console.log('Setting session user:', userWithRole);
      }
      
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error', 
    verifyRequest: '/auth/verify-request', 
  },
};
