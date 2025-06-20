import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
            path: '/',
          })
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: '',
            ...options,
            path: '/',
          })
        },
      },
    }
  )

  // Check both Supabase and NextAuth sessions
  const [supabaseSession, nextAuthToken] = await Promise.all([
    supabase.auth.getSession(),
    getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  ])
  
  // User is authenticated if either Supabase or NextAuth session exists
  const isAuthenticated = supabaseSession.data.session || nextAuthToken
  
  // Protected routes that require authentication
  const protectedRoutes = ['/generate', '/play', '/profile']
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  
  // Auth routes that should redirect to home if already authenticated
  const authRoutes = ['/auth/signin', '/auth/signup']
  const isAuthRoute = authRoutes.includes(request.nextUrl.pathname)
  
  // If trying to access protected route without session, redirect to sign in
  if (isProtectedRoute && !isAuthenticated) {
    const redirectUrl = new URL('/auth/signin', request.url)
    redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  // If trying to access auth route while already authenticated, redirect to home
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|auth/).*)'],
}
