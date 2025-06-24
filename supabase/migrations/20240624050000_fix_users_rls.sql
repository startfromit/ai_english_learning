-- Enable RLS on users table if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own data." ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;

-- Create policy to allow users to view their own data
CREATE POLICY "Users can view their own data." 
ON public.users FOR SELECT 
USING (auth.uid() = id);

-- Create policy to allow authenticated users to insert their own data
CREATE POLICY "Enable insert for authenticated users only" 
ON public.users FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow users to update their own data
CREATE POLICY "Users can update their own data." 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

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
WHERE tablename = 'users';
