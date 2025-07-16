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