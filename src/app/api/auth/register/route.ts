import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Create user in Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email,
        },
        emailRedirectTo: `${process.env.NEXTAUTH_URL}/auth/verify-email/callback`
      }
    })

    if (error) {
      console.error('Registration error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (data.user) {
      // Create user record in our users table
      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            id: data.user.id,
            email: data.user.email,
            name: name || data.user.email,
            provider: 'credentials',
            email_verified: false, // Mark as unverified initially
            created_at: new Date().toISOString()
          }
        ])

      if (insertError) {
        console.error('Error creating user record:', insertError)
        // Don't fail registration if this fails
      }

      return NextResponse.json({
        success: true,
        message: 'Registration successful! Please check your email to verify your account before signing in.',
        user: {
          id: data.user.id,
          email: data.user.email,
          name: name || data.user.email
        }
      })
    }

    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 