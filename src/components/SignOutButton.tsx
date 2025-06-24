'use client';

import { useRouter } from 'next/navigation';

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      // Call the signout API
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Sign out failed');
      }

      // Clear all auth-related cookies
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        if (name.includes('next-auth.')) {
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        }
      });

      // Clear local storage and session storage
      localStorage.clear();
      sessionStorage.clear();

      // Force a full page reload to ensure all state is cleared
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
      // If signout fails, force a full page reload
      window.location.href = '/';
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
    >
      Sign Out
    </button>
  );
}
