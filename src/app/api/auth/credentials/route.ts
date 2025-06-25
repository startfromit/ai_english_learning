import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    
    // 在服务器端进行 Supabase 认证
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('Auth error:', error.message)
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    if (data.user) {
      // 检查用户邮箱是否已验证
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email_verified')
        .eq('id', data.user.id)
        .single()

      if (userError) {
        console.error('Error checking user verification status:', userError)
        return NextResponse.json(
          { error: 'Database error' },
          { status: 500 }
        )
      }

      // 如果用户未验证，返回错误
      if (!userData?.email_verified) {
        return NextResponse.json(
          { error: 'Please verify your email address before signing in' },
          { status: 401 }
        )
      }

      // 返回用户信息给 NextAuth
      return NextResponse.json({
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email,
        image: data.user.user_metadata?.avatar_url
      })
    }

    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    )

  } catch (error) {
    console.error('Unexpected auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 