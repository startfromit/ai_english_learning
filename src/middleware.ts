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
  
  // Admin routes that require admin role
  const adminRoutes = ['/admin']
  
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
  
  // If user is not authenticated and trying to access a protected route, redirect to signin
  if (!isAuthenticated && protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }
  
  // Check if user is trying to access admin routes
  const isAdminRoute = adminRoutes.some(route => request.nextUrl.pathname.startsWith(route))
  
  if (isAdminRoute) {
    // For admin routes, we need to check the user's role
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
    
    // Get user role from the database
    const { data: userData, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', nextAuthToken?.sub || '')
      .single()
    
    // If user is not an admin, redirect to home page
    if (error || userData?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }
  
  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|auth/).*)'],
}
