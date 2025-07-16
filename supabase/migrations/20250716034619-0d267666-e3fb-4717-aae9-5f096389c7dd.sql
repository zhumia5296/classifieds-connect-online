-- Create a table to store ad embeddings for similarity search
CREATE TABLE public.ad_embeddings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  embedding VECTOR(1536), -- OpenAI text-embedding-3-small dimension
  content_hash TEXT NOT NULL, -- Hash of title + description to detect changes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ad_id)
);

-- Enable Row Level Security
ALTER TABLE public.ad_embeddings ENABLE ROW LEVEL SECURITY;

-- Create policies for ad embeddings (system can manage, users can read for active ads)
CREATE POLICY "System can manage ad embeddings" 
ON public.ad_embeddings 
FOR ALL 
USING (true);

CREATE POLICY "Users can view embeddings for active ads" 
ON public.ad_embeddings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.ads 
    WHERE ads.id = ad_embeddings.ad_id 
    AND ads.is_active = true 
    AND ads.status = 'active'
  )
);

-- Create index for faster similarity searches
CREATE INDEX idx_ad_embeddings_embedding ON public.ad_embeddings USING ivfflat (embedding vector_cosine_ops);

-- Create a table to store user interaction patterns for recommendations
CREATE TABLE public.user_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL, -- 'view', 'save', 'contact', 'share'
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for user interactions
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own interactions" 
ON public.user_interactions 
FOR INSERT 
WITH CHECK (true); -- Allow both authenticated and anonymous users

CREATE POLICY "System can view all interactions for recommendations" 
ON public.user_interactions 
FOR SELECT 
USING (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_ad_embeddings_updated_at
BEFORE UPDATE ON public.ad_embeddings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();