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
  const {
    data: { session },
    error: otpError,
  } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'signup',
  })

  if (otpError || !session) {
    console.error('OTP verification error:', otpError)
    return NextResponse.json(
      { error: `Invalid or expired OTP: ${otpError?.message}` },
      { status: 400 }
    )
  }
  
  // 2. Update the user's password and name.
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
    return NextResponse.json(
      {
        error: `Could not set user details: ${updateUserError?.message}. Please try resetting your password.`,
      },
      { status: 500 }
    )
  }

  // 3. Create a corresponding record in our public.users table.
  const { error: publicUserError } = await supabase.from('users').insert({
    id: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.user_metadata.name,
    provider: 'credentials',
    email_verified: true,
  })

  if (publicUserError) {
    console.error('Error creating public user record:', publicUserError)
    // Log it but don't fail the request
  }

  // 4. Return the new user and session to the client.
  // The client will use this to log the user in with NextAuth.
  return NextResponse.json({ 
    success: true, 
    user: updatedUser,
    session: session 
  })
} 