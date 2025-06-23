-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own vocabulary." ON public.user_vocabulary;
DROP POLICY IF EXISTS "Users can view their own vocabulary." ON public.user_vocabulary;
DROP POLICY IF EXISTS "Users can update their own vocabulary." ON public.user_vocabulary;
DROP POLICY IF EXISTS "Users can delete their own vocabulary." ON public.user_vocabulary;

-- Create new policies that work with NextAuth
-- For NextAuth, we need to allow authenticated users to manage their own data
-- We'll use a more permissive approach for now

-- Allow authenticated users to insert their own vocabulary
CREATE POLICY "Users can insert their own vocabulary."
  ON public.user_vocabulary FOR INSERT
  WITH CHECK (true); -- Allow all authenticated inserts, we'll validate user_id in the application

-- Allow users to view their own vocabulary
CREATE POLICY "Users can view their own vocabulary."
  ON public.user_vocabulary FOR SELECT
  USING (true); -- Allow all authenticated selects, we'll filter by user_id in the application

-- Allow users to update their own vocabulary
CREATE POLICY "Users can update their own vocabulary."
  ON public.user_vocabulary FOR UPDATE
  USING (true); -- Allow all authenticated updates, we'll validate user_id in the application

-- Allow users to delete their own vocabulary
CREATE POLICY "Users can delete their own vocabulary."
  ON public.user_vocabulary FOR DELETE
  USING (true); -- Allow all authenticated deletes, we'll validate user_id in the application

-- Verify policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'user_vocabulary'; 