-- Drop the old exam_results table to recreate it with the new structure
DROP TABLE IF EXISTS public.exam_results CASCADE;

CREATE TABLE IF NOT EXISTS public.exam_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  score_total INTEGER NOT NULL,
  category_scores JSONB NOT NULL DEFAULT '{}'::jsonb, -- NEW: Flexible scores per category {"grammar": 80, "vocab": 70}
  answers JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

-- Recreate policies for the new table
CREATE POLICY "Users can view their own results" 
  ON public.exam_results FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all results" 
  ON public.exam_results FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can insert their own results" 
  ON public.exam_results FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
