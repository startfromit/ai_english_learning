import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // Create a response that will clear all auth cookies
    const response = NextResponse.json({ success: true });
    
    // Clear all auth-related cookies
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    allCookies.forEach(cookie => {
      if (cookie.name.includes('next-auth.') || cookie.name.includes('__Secure-next-auth.')) {
        response.cookies.delete(cookie.name);
      }
    });

    // Force clear the session cookie
    response.cookies.set({
      name: 'next-auth.session-token',
      value: '',
      path: '/',
      expires: new Date(0),
    });
    
    response.cookies.set({
      name: '__Secure-next-auth.session-token',
      value: '',
      path: '/',
      expires: new Date(0),
      secure: true,
    });
    
    return response;
  } catch (error) {
    console.error('Sign out error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sign out' },
      { status: 500 }
    );
  }
}
