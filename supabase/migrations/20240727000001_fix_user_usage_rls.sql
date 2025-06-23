-- Fix RLS policies for user_usage table to work with NextAuth
-- Drop existing policies
drop policy if exists "Users can view their own usage" on public.user_usage;
drop policy if exists "Users can update their own usage" on public.user_usage;

-- Create new policies that work with NextAuth
-- For now, we'll allow all operations since we're using NextAuth for authentication
-- and the API routes handle authorization
create policy "Allow all operations for user_usage"
  on public.user_usage for all
  using (true)
  with check (true); 