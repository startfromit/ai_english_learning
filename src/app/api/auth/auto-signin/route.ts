import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { accessToken, refreshToken } = await request.json()

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { error: 'Access token and refresh token are required' },
        { status: 400 }
      )
    }

    console.log('Auto-signin API called with tokens')

    // Set Supabase session
    const supabase = createClient()
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (sessionError) {
      console.error('Error setting Supabase session:', sessionError)
      return NextResponse.json(
        { error: 'Failed to set session' },
        { status: 500 }
      )
    }

    // Get user from Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('Error getting user:', userError)
      return NextResponse.json(
        { error: 'Failed to get user' },
        { status: 500 }
      )
    }

    console.log('User retrieved:', user.id)

    // Get user profile
    const { data: publicUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    // Create a session cookie manually
    const sessionData = {
      user: {
        id: user.id,
        email: user.email,
        name: publicUser?.name || user.email,
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    }

    // Set a custom session cookie
    const response = NextResponse.json({ success: true, user: sessionData.user })
    
    // Set a session cookie that our app can read
    response.cookies.set('next-auth.session-token', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
    })

    console.log('Auto-signin successful')
    return response

  } catch (error) {
    console.error('Auto-signin error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 