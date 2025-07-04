// This file provides type declarations for module aliases
import { SupabaseClient, User, Session } from '@supabase/supabase-js'
import { ReactNode } from 'react'
import { Database } from '@/lib/supabase/database'

// Type declarations for module aliases
declare module '@/lib/auth' {
  export function getSession(): Promise<{
    data: { session: Session | null }
    error: Error | null
  }>
  
  export function getUser(): Promise<User | null>
  
  export function signOut(): Promise<{ error: Error | null }>
  
  export function canPlayAudio(): Promise<{
    canPlay: boolean
    remaining: number
  }>
  
  export function getRemainingPlays(): Promise<number>
}

// Global type declarations
declare global {
  interface Window {
    supabase: SupabaseClient<Database>
  }
}

// Allow importing CSS modules
declare module '*.module.css' {
  const classes: { [key: string]: string }
  export default classes
}

declare module '*.module.scss' {
  const classes: { [key: string]: string }
  export default classes
}
