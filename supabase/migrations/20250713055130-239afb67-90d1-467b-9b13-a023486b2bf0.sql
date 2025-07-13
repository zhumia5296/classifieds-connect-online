-- Add latitude and longitude columns to ads table for location-based features
ALTER TABLE public.ads 
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8);

-- Add spatial index for better performance on location queries
CREATE INDEX IF NOT EXISTS idx_ads_location ON public.ads (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add location coordinates to profiles table as well
ALTER TABLE public.profiles 
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8);

-- Create a function to calculate distance between two points using Haversine formula
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 DECIMAL, 
  lng1 DECIMAL, 
  lat2 DECIMAL, 
  lng2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  earth_radius DECIMAL := 6371; -- Earth's radius in kilometers
  dlat DECIMAL;
  dlng DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  -- Convert degrees to radians
  dlat := RADIANS(lat2 - lat1);
  dlng := RADIANS(lng2 - lng1);
  
  -- Haversine formula
  a := SIN(dlat/2) * SIN(dlat/2) + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dlng/2) * SIN(dlng/2);
  c := 2 * ATAN2(SQRT(a), SQRT(1-a));
  
  RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a function to get nearby ads
CREATE OR REPLACE FUNCTION public.get_nearby_ads(
  user_lat DECIMAL,
  user_lng DECIMAL,
  radius_km DECIMAL DEFAULT 50,
  limit_count INTEGER DEFAULT 20
) RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  price NUMERIC,
  currency TEXT,
  location TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  distance_km DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE,
  is_featured BOOLEAN,
  category_name TEXT,
  image_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.description,
    a.price,
    a.currency,
    a.location,
    a.latitude,
    a.longitude,
    public.calculate_distance(user_lat, user_lng, a.latitude, a.longitude) as distance_km,
    a.created_at,
    a.is_featured,
    c.name as category_name,
    ai.image_url
  FROM public.ads a
  LEFT JOIN public.categories c ON a.category_id = c.id
  LEFT JOIN (
    SELECT DISTINCT ON (ad_id) ad_id, image_url
    FROM public.ad_images
    WHERE is_primary = true
    ORDER BY ad_id, created_at
  ) ai ON a.id = ai.ad_id
  WHERE 
    a.is_active = true 
    AND a.status = 'active'
    AND a.latitude IS NOT NULL 
    AND a.longitude IS NOT NULL
    AND public.calculate_distance(user_lat, user_lng, a.latitude, a.longitude) <= radius_km
  ORDER BY 
    a.is_featured DESC,
    distance_km ASC,
    a.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;