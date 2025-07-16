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

-- Create function to find similar ads using vector similarity
CREATE OR REPLACE FUNCTION public.find_similar_ads(
  target_ad_id UUID,
  similarity_threshold FLOAT DEFAULT 0.7,
  max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  ad_id UUID,
  similarity_score FLOAT,
  title TEXT,
  price NUMERIC,
  location TEXT,
  image_url TEXT,
  category_name TEXT,
  is_featured BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_embedding VECTOR(1536);
  target_category_id UUID;
BEGIN
  -- Get the target ad's embedding and category
  SELECT ae.embedding, a.category_id 
  INTO target_embedding, target_category_id
  FROM public.ad_embeddings ae
  JOIN public.ads a ON ae.ad_id = a.id
  WHERE ae.ad_id = target_ad_id;
  
  -- If no embedding found, return empty result
  IF target_embedding IS NULL THEN
    RETURN;
  END IF;
  
  -- Find similar ads using cosine similarity
  RETURN QUERY
  SELECT 
    a.id,
    (1 - (ae.embedding <=> target_embedding))::FLOAT as similarity_score,
    a.title,
    a.price,
    a.location,
    ai.image_url,
    c.name as category_name,
    a.is_featured
  FROM public.ad_embeddings ae
  JOIN public.ads a ON ae.ad_id = a.id
  JOIN public.categories c ON a.category_id = c.id
  LEFT JOIN (
    SELECT DISTINCT ON (ad_id) ad_id, image_url
    FROM public.ad_images
    WHERE is_primary = true
    ORDER BY ad_id, created_at
  ) ai ON a.id = ai.ad_id
  WHERE 
    ae.ad_id != target_ad_id
    AND a.is_active = true
    AND a.status = 'active'
    AND (1 - (ae.embedding <=> target_embedding)) >= similarity_threshold
  ORDER BY 
    -- Boost items in same category
    CASE WHEN a.category_id = target_category_id THEN 0.1 ELSE 0 END + 
    (1 - (ae.embedding <=> target_embedding)) DESC,
    a.is_featured DESC,
    a.created_at DESC
  LIMIT max_results;
END;
$$;