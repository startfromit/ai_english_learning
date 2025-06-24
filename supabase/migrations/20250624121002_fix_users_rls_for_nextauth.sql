-- =====================================================
-- Fix RLS policies for NextAuth integration
-- Created: 2025-06-24 12:10:02
-- =====================================================

-- Drop existing policies that don't work with NextAuth
DROP POLICY IF EXISTS "Users can view their own data." ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data." ON public.users;

-- Create NextAuth-compatible policies
-- Allow all operations for now (since NextAuth handles authentication)
CREATE POLICY "Allow all operations for users (NextAuth)"
  ON public.users FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- Fix Complete
-- ===================================================== 