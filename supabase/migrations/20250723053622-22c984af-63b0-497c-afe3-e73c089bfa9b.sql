-- Create trending items tracking table
CREATE TABLE public.trending_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type TEXT NOT NULL CHECK (item_type IN ('ad', 'search', 'category')),
  item_id UUID,
  search_term TEXT,
  category_id UUID,
  location_area TEXT NOT NULL,
  view_count INTEGER DEFAULT 1,
  search_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  trend_score NUMERIC DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trending_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for trending_items
CREATE POLICY "Anyone can view trending items" 
ON public.trending_items 
FOR SELECT 
USING (true);

CREATE POLICY "System can manage trending items" 
ON public.trending_items 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_trending_items_location_area ON public.trending_items(location_area);
CREATE INDEX idx_trending_items_type_area ON public.trending_items(item_type, location_area);
CREATE INDEX idx_trending_items_trend_score ON public.trending_items(trend_score DESC);
CREATE INDEX idx_trending_items_last_activity ON public.trending_items(last_activity_at DESC);

-- Function to track item views/searches
CREATE OR REPLACE FUNCTION track_trending_activity(
  p_item_type TEXT,
  p_item_id UUID DEFAULT NULL,
  p_search_term TEXT DEFAULT NULL,
  p_category_id UUID DEFAULT NULL,
  p_location_area TEXT DEFAULT 'Unknown',
  p_activity_type TEXT DEFAULT 'view'
) RETURNS VOID AS $$
DECLARE
  item_key TEXT;
BEGIN
  -- Create a unique key for the item
  item_key := COALESCE(p_item_id::text, p_search_term, p_category_id::text);
  
  INSERT INTO public.trending_items (
    item_type,
    item_id,
    search_term,
    category_id,
    location_area,
    view_count,
    search_count,
    last_activity_at
  ) VALUES (
    p_item_type,
    p_item_id,
    p_search_term,
    p_category_id,
    p_location_area,
    CASE WHEN p_activity_type = 'view' THEN 1 ELSE 0 END,
    CASE WHEN p_activity_type = 'search' THEN 1 ELSE 0 END,
    now()
  )
  ON CONFLICT (item_type, location_area, COALESCE(item_id, uuid_nil()), COALESCE(search_term, ''), COALESCE(category_id, uuid_nil()))
  DO UPDATE SET
    view_count = trending_items.view_count + (CASE WHEN p_activity_type = 'view' THEN 1 ELSE 0 END),
    search_count = trending_items.search_count + (CASE WHEN p_activity_type = 'search' THEN 1 ELSE 0 END),
    last_activity_at = now(),
    trend_score = (
      (trending_items.view_count + trending_items.search_count * 2.0) * 
      (1.0 / (1.0 + EXTRACT(EPOCH FROM (now() - trending_items.last_activity_at)) / 86400.0))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Function to get trending items for a location
CREATE OR REPLACE FUNCTION get_trending_items(
  p_location_area TEXT,
  p_item_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  item_type TEXT,
  item_id UUID,
  search_term TEXT,
  category_id UUID,
  trend_score NUMERIC,
  view_count INTEGER,
  search_count INTEGER,
  last_activity_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ti.item_type,
    ti.item_id,
    ti.search_term,
    ti.category_id,
    ti.trend_score,
    ti.view_count,
    ti.search_count,
    ti.last_activity_at
  FROM public.trending_items ti
  WHERE ti.location_area = p_location_area
    AND (p_item_type IS NULL OR ti.item_type = p_item_type)
    AND ti.last_activity_at > now() - INTERVAL '7 days'
  ORDER BY ti.trend_score DESC, ti.last_activity_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Add unique constraint with proper handling of nullable fields
CREATE UNIQUE INDEX unique_trending_item_idx 
ON public.trending_items (
  item_type, 
  location_area, 
  COALESCE(item_id, '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(search_term, ''),
  COALESCE(category_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

-- Create trigger for updated_at
CREATE TRIGGER update_trending_items_updated_at
BEFORE UPDATE ON public.trending_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();