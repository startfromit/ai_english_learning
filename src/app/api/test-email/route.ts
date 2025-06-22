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

    console.log('Testing email sending to:', email)
    console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL)
    console.log('Redirect URL:', `${process.env.NEXTAUTH_URL}/auth/verify-email`)

    const supabase = createClient()

    // Test resending verification email
    const { error, data } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${process.env.NEXTAUTH_URL}/auth/verify-email`
      }
    })

    console.log('Supabase response:', { error, data })

    if (error) {
      console.error('Email test error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.status,
        details: {
          message: error.message,
          status: error.status,
          name: error.name,
          stack: error.stack
        }
      }, { status: 400 })
    }

    console.log('Email sent successfully to:', email)

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      details: {
        email: email,
        redirectUrl: `${process.env.NEXTAUTH_URL}/auth/verify-email`,
        timestamp: new Date().toISOString(),
        supabaseResponse: data
      }
    })

  } catch (error) {
    console.error('Email test error:', error)
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