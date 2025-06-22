import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Check if user exists in our users table
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    // Try to get current session to check if user is logged in
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    // Try to sign in with the email to check if user exists
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: 'dummy-password-for-check' // This will fail but we can see the error
    })

    return NextResponse.json({
      success: true,
      details: {
        email: email,
        dbUser: dbUser,
        currentSession: session ? {
          userId: session.user.id,
          email: session.user.email,
          emailConfirmed: session.user.email_confirmed_at !== null
        } : null,
        dbError: dbError?.message,
        sessionError: sessionError?.message,
        signInError: signInError?.message,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('User status check error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
} 