-- Create saved_searches table for storing user search queries and filters
CREATE TABLE public.saved_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  search_query TEXT,
  filters JSONB NOT NULL DEFAULT '{}',
  category_ids TEXT[],
  notification_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

-- Create policies for saved_searches
CREATE POLICY "Users can view their own saved searches" 
ON public.saved_searches FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved searches" 
ON public.saved_searches FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved searches" 
ON public.saved_searches FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved searches" 
ON public.saved_searches FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_saved_searches_user_id ON public.saved_searches(user_id);
CREATE INDEX idx_saved_searches_created_at ON public.saved_searches(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_saved_searches_updated_at
BEFORE UPDATE ON public.saved_searches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();