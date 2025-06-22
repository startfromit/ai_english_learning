import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { token, password } = await request.json()

  if (!token || !password) {
    return NextResponse.json(
      { error: 'Token and password are required' },
      { status: 400 }
    )
  }

  const supabase = createClient()

  // 1. First, we need to exchange the token for a session
  // This verifies the token is valid and gives us an authenticated user context.
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.setSession({
    access_token: token,
    refresh_token: 'dummy-refresh-token-since-we-dont-have-one', // Refresh token can be a dummy value here
  })
  
  if (sessionError || !session) {
     console.error('Set session error:', sessionError)
     return NextResponse.json(
      { error: 'Invalid or expired reset token.' },
      { status: 401 }
    )
  }

  // 2. Now that we have an authenticated session, we can update the user's password.
  const { error: updateError } = await supabase.auth.updateUser({
    password: password,
  })

  if (updateError) {
    console.error('Update password error:', updateError)
    return NextResponse.json(
      { error: `Failed to update password: ${updateError.message}` },
      { status: 500 }
    )
  }
  
  // 3. Invalidate the session to force re-login
  await supabase.auth.signOut();

  return NextResponse.json({ success: true, message: 'Password updated successfully' })
} 