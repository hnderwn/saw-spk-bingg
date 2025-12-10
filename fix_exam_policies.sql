-- Forcefully fix policies for exam_results
-- Run this if you are getting RLS errors

BEGIN;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own results" ON public.exam_results;
DROP POLICY IF EXISTS "Admins can view all results" ON public.exam_results;
DROP POLICY IF EXISTS "Users can insert their own results" ON public.exam_results;

-- Ensure RLS is enabled
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

-- Recreate policies with simple conditions
CREATE POLICY "Users can view their own results" 
  ON public.exam_results FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own results" 
  ON public.exam_results FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all results" 
  ON public.exam_results FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

COMMIT;
