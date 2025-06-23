'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from 'next-auth/react'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

const AuthNav = () => {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const { t } = useTranslation()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  // Don't show auth nav on auth pages
  if (pathname?.startsWith('/auth')) {
    return null
  }

  if (loading) {
    return (
      <div className="animate-pulse flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
        <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      {user ? (
        <Menu as="div" className="relative">
          <div>
            <Menu.Button className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400">
              {user.image && (
                <img src={user.image} alt={user.name || 'User avatar'} className="h-8 w-8 rounded-full" />
              )}
              <span>{user.name || user.email}</span>
            </Menu.Button>
          </div>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <Menu.Item>
                {({ active }) => (
                  <Link href="/profile" className={classNames(active ? 'bg-gray-100 dark:bg-gray-700' : '', 'block px-4 py-2 text-sm text-gray-700 dark:text-gray-200')}>
                    {t('profile', 'Profile')}
                  </Link>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={handleSignOut}
                    className={classNames(active ? 'bg-gray-100 dark:bg-gray-700' : '', 'w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200')}
                  >
                    {t('sign_out', 'Sign out')}
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
      ) : (
        <div className="flex items-center gap-2">
          <Link href="/auth/signin" className="text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400">
            {t('signIn', 'Sign In')}
          </Link>
          <Link href="/auth/signup" className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md">
            {t('signUp', 'Sign Up')}
          </Link>
        </div>
      )}
    </div>
  )
}

export default AuthNav
