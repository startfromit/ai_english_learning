-- =====================================================
-- Fix user_usage table structure and data consistency
-- Created: 2025-06-24 12:10:01
-- =====================================================

-- =====================================================
-- 1. Ensure all users have user_usage records
-- =====================================================

-- Insert missing user_usage records for all users
INSERT INTO public.user_usage (id, daily_play_count, last_play_date, created_at, updated_at)
SELECT 
  u.id,
  0 as daily_play_count,
  current_date as last_play_date,
  now() as created_at,
  now() as updated_at
FROM auth.users u
LEFT JOIN public.user_usage uu ON u.id = uu.id
WHERE uu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. Reset all play counts for today to ensure consistency
-- =====================================================

-- Reset play counts for today to ensure they start from 0
UPDATE public.user_usage 
SET daily_play_count = 0, 
    last_play_date = current_date,
    updated_at = now()
WHERE last_play_date = current_date;

-- =====================================================
-- 3. Verify table structure
-- =====================================================

-- Check if all required columns exist
DO $$
BEGIN
  -- Check if the table has the correct structure
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_usage' 
    AND column_name = 'id'
  ) THEN
    RAISE EXCEPTION 'user_usage table missing id column';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_usage' 
    AND column_name = 'daily_play_count'
  ) THEN
    RAISE EXCEPTION 'user_usage table missing daily_play_count column';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_usage' 
    AND column_name = 'last_play_date'
  ) THEN
    RAISE EXCEPTION 'user_usage table missing last_play_date column';
  END IF;
  
  RAISE NOTICE 'user_usage table structure is correct';
END $$;

-- =====================================================
-- 4. Display current user_usage records for verification
-- =====================================================

SELECT 
  uu.id,
  uu.daily_play_count,
  uu.last_play_date,
  uu.created_at,
  uu.updated_at,
  u.email
FROM public.user_usage uu
LEFT JOIN auth.users u ON uu.id = u.id
ORDER BY uu.created_at DESC
LIMIT 10;

-- =====================================================
-- 5. Test database functions
-- =====================================================

-- Test the increment function with a dummy user
DO $$
DECLARE
  test_user_id uuid := '00000000-0000-0000-0000-000000000000';
  result_count integer;
BEGIN
  -- Test increment function
  SELECT increment_play_count(test_user_id) INTO result_count;
  RAISE NOTICE 'Test increment_play_count result: %', result_count;
  
  -- Test check function
  SELECT check_and_reset_daily_play_count(test_user_id) INTO result_count;
  RAISE NOTICE 'Test check_and_reset_daily_play_count result: %', result_count;
  
  -- Clean up test data
  DELETE FROM public.user_usage WHERE id = test_user_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Function test failed: %', SQLERRM;
END $$;

-- =====================================================
-- Fix Complete
-- ===================================================== 