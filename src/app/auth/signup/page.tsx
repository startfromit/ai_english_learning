'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import OtpInput from 'react-otp-input'
import { signIn } from 'next-auth/react'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const router = useRouter()

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (res.ok) {
      setOtpSent(true)
      setError('Verification code sent. Please check your email.')
    } else {
      const { error } = await res.json()
      setError(error || 'Failed to send verification code.')
    }
    setLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. 验证 OTP 并创建账号
      const apiRes = await fetch('/api/auth/verify-otp-and-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: otp, password, name }),
      })

      const data = await apiRes.json()
      if (!apiRes.ok) {
        throw new Error(data.error || 'Sign up failed.')
      }

      console.log('Registration successful, attempting to sign in...', {
        hasSession: !!data.session,
        hasAccessToken: !!data.session?.access_token,
        hasRefreshToken: !!data.session?.refresh_token
      });

      // 2. 使用 NextAuth 登录
      const signInResult = await signIn('supabase', {
        redirect: false,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        callbackUrl: '/',
      })

      console.log('Sign in result:', {
        ok: signInResult?.ok,
        error: signInResult?.error,
        url: signInResult?.url
      });

      // 3. 检查登录结果
      if (!signInResult?.ok) {
        const errorMessage = signInResult?.error || 'An unknown error occurred during sign in';
        console.error('Sign in failed:', errorMessage);
        setError(`Sign in failed: ${errorMessage}`);
        return;
      }
      
      // 4. 登录成功，跳转到首页
      console.log('Sign in successful, redirecting to home page...');
      if (signInResult.url) {
        window.location.href = signInResult.url;
      } else {
        router.push('/');
      }

    } catch (err) {
      const error = err as Error
      setError(error.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Create your account
          </h2>
        </div>
        {!otpSent ? (
          <form className="mt-8 space-y-6" onSubmit={handleSendOtp}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Verification Code'}
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="name" className="sr-only">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 sm:text-sm"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="relative block w-full appearance-none rounded-none border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex flex-col items-center space-y-4">
               <label htmlFor="otp" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enter Verification Code
                </label>
                <OtpInput
                  value={otp}
                  onChange={setOtp}
                  numInputs={6}
                  renderSeparator={<span className="mx-1">-</span>}
                  renderInput={(props) => <input {...props} />}
                   inputStyle="!w-10 sm:!w-12 h-12 text-lg rounded-md border border-gray-300 text-center text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500"
                />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Create Account & Sign In'}
              </button>
            </div>
          </form>
        )}

        {error && <p className="mt-2 text-center text-sm text-red-600">{error}</p>}

        <div className="text-sm text-center">
          <Link
            href="/auth/signin"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
