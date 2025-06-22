import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { email, token, password, name } = await request.json()

  if (!email || !token || !password) {
    return NextResponse.json(
      { error: 'Email, token, and password are required' },
      { status: 400 }
    )
  }

  const supabase = createClient()

  // 1. Verify the OTP
  // The 'signup' type is used here because the user initiated this flow
  // from the sign-up page. This verifies the code sent via signInWithOtp.
  const {
    data: { session },
    error: otpError,
  } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'signup',
  })

  if (otpError) {
    console.error('OTP verification error:', otpError)
    return NextResponse.json(
      { error: `Invalid or expired OTP: ${otpError.message}` },
      { status: 400 }
    )
  }

  // If the OTP is incorrect, the session will be null.
  if (!session) {
    return NextResponse.json(
      { error: 'Invalid or expired OTP. Please try again.' },
      { status: 400 }
    )
  }
  
  // 2. OTP is valid, we have a session. Now update the user's password and name.
  // The user is now technically logged in, so we can use updateUser.
  const {
    data: { user: updatedUser },
    error: updateUserError,
  } = await supabase.auth.updateUser({
    password: password,
    data: {
      name: name || email,
    },
  })

  if (updateUserError || !updatedUser) {
    console.error('Update user error:', updateUserError)
    // Even if this fails, the user is created. We should guide them to reset password.
    return NextResponse.json(
      {
        error: `Could not set user details: ${updateUserError?.message}. Please try resetting your password.`,
      },
      { status: 500 }
    )
  }

  // 3. Now that the auth.users record is updated,
  // let's create a corresponding record in our public.users table.
  const { error: publicUserError } = await supabase.from('users').insert({
    id: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.user_metadata.name,
    provider: 'credentials',
    email_verified: true, // This is the crucial step!
  })

  if (publicUserError) {
    console.error('Error creating public user record:', publicUserError)
    // This is not a fatal error for the user, but it's bad for us.
    // We'll log it but still allow the process to succeed.
  }

  // 4. Invalidate the session to force the user to log in with their new password.
  await supabase.auth.signOut()

  return NextResponse.json({ success: true, message: 'User created successfully' })
} 