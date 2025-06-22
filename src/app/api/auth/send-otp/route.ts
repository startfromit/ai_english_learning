import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { email } = await request.json()

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const supabase = createClient()

  // This will send a 6-digit code to the user's email.
  // It works for both new and existing users.
  // If the user doesn't exist, Supabase will create a new user record.
  const { error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      // This is crucial for the sign-up flow.
      // It ensures that a new user is created if one doesn't exist.
      shouldCreateUser: true,
    },
  })

  if (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { error: `Failed to send OTP: ${error.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
} 