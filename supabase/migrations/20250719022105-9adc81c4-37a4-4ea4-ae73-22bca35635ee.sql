-- Add location data to reviews table for local reputation tracking
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS reviewer_location TEXT,
ADD COLUMN IF NOT EXISTS reviewer_latitude NUMERIC,
ADD COLUMN IF NOT EXISTS reviewer_longitude NUMERIC,
ADD COLUMN IF NOT EXISTS transaction_location TEXT,
ADD COLUMN IF NOT EXISTS transaction_latitude NUMERIC,
ADD COLUMN IF NOT EXISTS transaction_longitude NUMERIC;

-- Function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 numeric, lng1 numeric, 
  lat2 numeric, lng2 numeric
)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  R CONSTANT numeric := 6371; -- Earth's radius in kilometers
  dlat numeric;
  dlng numeric;
  a numeric;
  c numeric;
BEGIN
  dlat := radians(lat2 - lat1);
  dlng := radians(lng2 - lng1);
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng/2) * sin(dlng/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  RETURN R * c;
END;
$$;

-- Function to get local reputation within a radius
CREATE OR REPLACE FUNCTION public.get_local_reputation(
  target_user_id uuid,
  user_lat numeric,
  user_lng numeric,
  radius_km numeric DEFAULT 25
)
RETURNS TABLE(
  user_id uuid,
  local_reviews_count bigint,
  local_average_rating numeric,
  local_average_safety numeric,
  local_average_communication numeric,
  local_average_reliability numeric,
  local_average_payment_safety numeric,
  local_five_star_count bigint,
  local_four_star_count bigint,
  local_three_star_count bigint,
  local_two_star_count bigint,
  local_one_star_count bigint,
  search_radius_km numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    target_user_id as user_id,
    COUNT(*)::bigint as local_reviews_count,
    AVG(r.rating)::NUMERIC(3,2) as local_average_rating,
    AVG(r.safety_rating)::NUMERIC(3,2) as local_average_safety,
    AVG(r.communication_rating)::NUMERIC(3,2) as local_average_communication,
    AVG(r.reliability_rating)::NUMERIC(3,2) as local_average_reliability,
    AVG(r.payment_safety_rating)::NUMERIC(3,2) as local_average_payment_safety,
    COUNT(CASE WHEN r.rating = 5 THEN 1 END)::bigint as local_five_star_count,
    COUNT(CASE WHEN r.rating = 4 THEN 1 END)::bigint as local_four_star_count,
    COUNT(CASE WHEN r.rating = 3 THEN 1 END)::bigint as local_three_star_count,
    COUNT(CASE WHEN r.rating = 2 THEN 1 END)::bigint as local_two_star_count,
    COUNT(CASE WHEN r.rating = 1 THEN 1 END)::bigint as local_one_star_count,
    radius_km as search_radius_km
  FROM public.reviews r
  WHERE r.reviewed_user_id = target_user_id
    AND r.transaction_latitude IS NOT NULL 
    AND r.transaction_longitude IS NOT NULL
    AND public.calculate_distance(user_lat, user_lng, r.transaction_latitude, r.transaction_longitude) <= radius_km
  GROUP BY target_user_id;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_transaction_location 
ON public.reviews(reviewed_user_id, transaction_latitude, transaction_longitude);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_user_location 
ON public.reviews(reviewed_user_id, transaction_location);

-- Update the reviews trigger to auto-populate location data from ads
CREATE OR REPLACE FUNCTION public.auto_populate_review_location()
RETURNS TRIGGER AS $$
BEGIN
  -- If ad_id is provided, get location from the ad
  IF NEW.ad_id IS NOT NULL THEN
    UPDATE public.reviews 
    SET 
      transaction_location = a.location,
      transaction_latitude = a.latitude,
      transaction_longitude = a.longitude
    FROM public.ads a
    WHERE public.reviews.id = NEW.id 
      AND a.id = NEW.ad_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-populating location
DROP TRIGGER IF EXISTS auto_populate_review_location_trigger ON public.reviews;
CREATE TRIGGER auto_populate_review_location_trigger
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION auto_populate_review_location();