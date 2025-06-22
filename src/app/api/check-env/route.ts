import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const envVars = {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'NOT SET',
      GITHUB_ID: process.env.GITHUB_ID ? 'Set' : 'NOT SET',
      GITHUB_SECRET: process.env.GITHUB_SECRET ? 'Set' : 'NOT SET',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Set' : 'NOT SET',
    }

    const missingVars = Object.entries(envVars)
      .filter(([key, value]) => !value || value === 'NOT SET')
      .map(([key]) => key)

    return NextResponse.json({
      success: missingVars.length === 0,
      message: missingVars.length === 0 ? 'All required environment variables are set' : `Missing: ${missingVars.join(', ')}`,
      details: envVars,
      missing: missingVars
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to check environment variables',
      details: { message: error instanceof Error ? error.message : 'Unknown error' }
    }, { status: 500 })
  }
} 