-- Create trending items tracking table
CREATE TABLE public.trending_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type TEXT NOT NULL CHECK (item_type IN ('ad', 'search', 'category')),
  item_id UUID,
  search_term TEXT,
  category_id UUID,
  location_area TEXT NOT NULL, -- City or region
  location_coordinates POINT,
  view_count INTEGER DEFAULT 1,
  search_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  trend_score NUMERIC DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create location-based trending analytics table
CREATE TABLE public.location_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_area TEXT NOT NULL,
  location_coordinates POINT,
  trending_categories JSONB DEFAULT '[]',
  trending_searches JSONB DEFAULT '[]',
  trending_ads JSONB DEFAULT '[]',
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(location_area)
);

-- Enable RLS
ALTER TABLE public.trending_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_trends ENABLE ROW LEVEL SECURITY;

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

-- RLS policies for location_trends
CREATE POLICY "Anyone can view location trends" 
ON public.location_trends 
FOR SELECT 
USING (true);

CREATE POLICY "System can manage location trends" 
ON public.location_trends 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_trending_items_location_area ON public.trending_items(location_area);
CREATE INDEX idx_trending_items_type_area ON public.trending_items(item_type, location_area);
CREATE INDEX idx_trending_items_trend_score ON public.trending_items(trend_score DESC);
CREATE INDEX idx_trending_items_last_activity ON public.trending_items(last_activity_at DESC);
CREATE INDEX idx_location_trends_area ON public.location_trends(location_area);

-- Create function to update trending scores based on activity
CREATE OR REPLACE FUNCTION update_trending_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate trend score based on recency and activity
  NEW.trend_score := (
    (NEW.view_count * 1.0 + NEW.search_count * 2.0) * 
    (1.0 / (1.0 + EXTRACT(EPOCH FROM (now() - NEW.last_activity_at)) / 86400.0)) -- Decay over days
  );
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER update_trending_score_trigger
BEFORE UPDATE ON public.trending_items
FOR EACH ROW
EXECUTE FUNCTION update_trending_score();

-- Function to track item views/searches
CREATE OR REPLACE FUNCTION track_trending_activity(
  p_item_type TEXT,
  p_item_id UUID DEFAULT NULL,
  p_search_term TEXT DEFAULT NULL,
  p_category_id UUID DEFAULT NULL,
  p_location_area TEXT DEFAULT 'Unknown',
  p_activity_type TEXT DEFAULT 'view' -- 'view' or 'search'
) RETURNS VOID AS $$
BEGIN
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
  ON CONFLICT (item_type, COALESCE(item_id::text, search_term, category_id::text), location_area) 
  DO UPDATE SET
    view_count = trending_items.view_count + (CASE WHEN p_activity_type = 'view' THEN 1 ELSE 0 END),
    search_count = trending_items.search_count + (CASE WHEN p_activity_type = 'search' THEN 1 ELSE 0 END),
    last_activity_at = now();
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
    AND ti.last_activity_at > now() - INTERVAL '7 days' -- Only recent trends
  ORDER BY ti.trend_score DESC, ti.last_activity_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Add unique constraint for proper conflict resolution
ALTER TABLE public.trending_items 
ADD CONSTRAINT unique_trending_item 
UNIQUE (item_type, location_area, COALESCE(item_id::text, search_term, category_id::text));

-- Create trigger for updated_at
CREATE TRIGGER update_trending_items_updated_at
BEFORE UPDATE ON public.trending_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_location_trends_updated_at
BEFORE UPDATE ON public.location_trends
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();