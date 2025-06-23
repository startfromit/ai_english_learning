-- Check if RLS is enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'user_vocabulary' 
    AND schemaname = 'public'
  ) THEN
    RAISE EXCEPTION 'Table user_vocabulary does not exist. Please run the previous migration first.';
  END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE public.user_vocabulary ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own vocabulary." ON public.user_vocabulary;
DROP POLICY IF EXISTS "Users can view their own vocabulary." ON public.user_vocabulary;
DROP POLICY IF EXISTS "Users can update their own vocabulary." ON public.user_vocabulary;
DROP POLICY IF EXISTS "Users can delete their own vocabulary." ON public.user_vocabulary;

-- Create policies
CREATE POLICY "Users can insert their own vocabulary."
  ON public.user_vocabulary FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own vocabulary."
  ON public.user_vocabulary FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own vocabulary."
  ON public.user_vocabulary FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vocabulary."
  ON public.user_vocabulary FOR DELETE
  USING (auth.uid() = user_id);

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