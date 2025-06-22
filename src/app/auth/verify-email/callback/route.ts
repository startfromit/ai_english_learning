import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const type = searchParams.get('type')

    if (!token || type !== 'signup') {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/error?error=InvalidVerificationLink`)
    }

    const supabase = createClient()

    // Verify the email
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'signup'
    })

    if (error) {
      console.error('Email verification error:', error)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/error?error=VerificationFailed`)
    }

    if (data.user) {
      // Update user's email_verified status in our users table
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          email_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.user.id)

      if (updateError) {
        console.error('Error updating user verification status:', updateError)
        // Don't fail verification if this fails
      }

      // Clear the pending verification email from localStorage
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/verification-success`)
    }

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/error?error=VerificationFailed`)

  } catch (error) {
    console.error('Email verification callback error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/error?error=VerificationFailed`)
  }
} 