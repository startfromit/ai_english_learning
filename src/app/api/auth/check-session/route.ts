import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('Check-session API called')
    
    // Get the session cookie
    const sessionCookie = request.cookies.get('next-auth.session-token')
    console.log('Session cookie found:', !!sessionCookie?.value)
    
    if (!sessionCookie?.value) {
      console.log('No session cookie found')
      return NextResponse.json({ user: null })
    }

    // Parse the session data
    const sessionData = JSON.parse(sessionCookie.value)
    console.log('Session data parsed:', { userId: sessionData.user?.id, expires: sessionData.expires })
    
    // Check if session is expired
    if (new Date(sessionData.expires) < new Date()) {
      console.log('Session expired')
      return NextResponse.json({ user: null })
    }

    console.log('Returning user:', sessionData.user)
    return NextResponse.json({ user: sessionData.user })

  } catch (error) {
    console.error('Error checking session:', error)
    return NextResponse.json({ user: null })
  }
} 