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

    // Get current session
    const { data: { session } } = await supabase.auth.getSession()

    // Get all users with this email
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)

    if (usersError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch users',
        details: { message: usersError.message }
      }, { status: 500 })
    }

    // Find the verified user (GitHub user)
    const verifiedUser = users?.find(user => user.provider === 'github' || user.email_verified)
    const unverifiedUser = users?.find(user => user.provider === 'credentials' && !user.email_verified)

    let action = 'none'
    let deletedUser = null

    // If we have both verified and unverified users, delete the unverified one
    if (verifiedUser && unverifiedUser) {
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', unverifiedUser.id)

      if (deleteError) {
        return NextResponse.json({
          success: false,
          error: 'Failed to delete duplicate user',
          details: { message: deleteError.message }
        }, { status: 500 })
      }

      action = 'deleted_unverified'
      deletedUser = unverifiedUser
    }

    return NextResponse.json({
      success: true,
      message: action === 'deleted_unverified' ? 'Duplicate user cleaned up' : 'No cleanup needed',
      details: {
        email: email,
        action: action,
        deletedUser: deletedUser,
        verifiedUser: verifiedUser,
        currentSession: session ? {
          userId: session.user.id,
          email: session.user.email,
          emailConfirmed: session.user.email_confirmed_at !== null
        } : null,
        allUsers: users,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('User cleanup error:', error)
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