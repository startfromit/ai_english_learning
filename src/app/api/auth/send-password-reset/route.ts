import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { email } = await request.json()

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const supabase = createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXTAUTH_URL}/auth/reset-password`,
  })

  if (error) {
    console.error('Send password reset error:', error)
    // To prevent user enumeration attacks, we don't reveal if the user
    // exists or not. We always return a success-like response.
    // The actual error is logged on the server.
    if (error.message.includes('User not found')) {
      return NextResponse.json({
        message: 'If an account with this email exists, a password reset link has been sent.',
      })
    }
    
    return NextResponse.json(
      { error: `Failed to send reset link: ${error.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({
    message: 'If an account with this email exists, a password reset link has been sent.',
  })
} 