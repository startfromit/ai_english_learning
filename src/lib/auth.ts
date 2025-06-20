import { createClient } from './supabase/client'
import { User } from '@supabase/supabase-js'
import { Database } from './supabase/database'

type UserUsage = Database['public']['Tables']['user_usage']['Row']

export async function getSession() {
  const supabase = createClient()
  return await supabase.auth.getSession()
}

export async function getUser(): Promise<User | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function signOut() {
  const supabase = createClient()
  return await supabase.auth.signOut()
}

export async function canPlayAudio(): Promise<{ canPlay: boolean; remaining: number }> {
  const user = await getUser()
  if (!user) return { canPlay: false, remaining: 0 }

  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  
  // Get or create user usage record
  const { data: usage, error } = await supabase
    .from('user_usage')
    .select('play_count, usage_date')
    .eq('user_id', user.id)
    .eq('usage_date', today)
    .single() as { data: UserUsage | null; error: any }

  const MAX_DAILY_PLAYS = 10
  
  // If no record exists or it's a new day, reset the counter
  if (!usage || usage.usage_date !== today) {
    const { error: upsertError } = await supabase
      .from('user_usage')
      .upsert({
        user_id: user.id,
        play_count: 1,
        usage_date: today,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,usage_date',
        ignoreDuplicates: false
      })
    
    if (upsertError) {
      console.error('Error updating user usage:', upsertError)
      return { canPlay: false, remaining: 0 }
    }
    
    return { canPlay: true, remaining: MAX_DAILY_PLAYS - 1 }
  }
  
  // Check if user has reached the limit
  if (usage.play_count >= MAX_DAILY_PLAYS) {
    return { canPlay: false, remaining: 0 }
  }
  
  // Increment the play count using the RPC function
  const { error: incrementError } = await supabase.rpc('increment_play_count', {
    user_id: user.id,
    usage_date: today
  })
  
  if (incrementError) {
    console.error('Error incrementing play count:', incrementError)
    return { canPlay: false, remaining: 0 }
  }
  
  return { 
    canPlay: true, 
    remaining: MAX_DAILY_PLAYS - (usage.play_count + 1)
  }
}

// Get current user's remaining plays for today
export async function getRemainingPlays(): Promise<number> {
  const user = await getUser()
  if (!user) return 0

  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  
  const { data: usage, error } = await supabase
    .from('user_usage')
    .select('play_count')
    .eq('user_id', user.id)
    .eq('usage_date', today)
    .single() as { data: Pick<UserUsage, 'play_count'> | null; error: any }

  if (error || !usage) return 10 // Default to max if no record exists
  
  return Math.max(0, 10 - (usage.play_count || 0))
}
