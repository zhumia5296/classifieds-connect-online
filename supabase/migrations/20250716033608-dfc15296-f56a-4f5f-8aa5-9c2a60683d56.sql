-- Create a table for saved comparisons
CREATE TABLE public.saved_comparisons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  ad_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.saved_comparisons ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own saved comparisons" 
ON public.saved_comparisons 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved comparisons" 
ON public.saved_comparisons 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved comparisons" 
ON public.saved_comparisons 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved comparisons" 
ON public.saved_comparisons 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_saved_comparisons_updated_at
BEFORE UPDATE ON public.saved_comparisons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();