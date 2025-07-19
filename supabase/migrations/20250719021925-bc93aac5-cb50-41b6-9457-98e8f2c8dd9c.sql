-- Add location data to reviews table for local reputation tracking
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS reviewer_location TEXT,
ADD COLUMN IF NOT EXISTS reviewer_coordinates POINT,
ADD COLUMN IF NOT EXISTS transaction_location TEXT,
ADD COLUMN IF NOT EXISTS transaction_coordinates POINT;

-- Create local reputation view that calculates area-specific ratings
CREATE OR REPLACE VIEW public.local_reputation_summary AS
SELECT 
  r.reviewed_user_id,
  COUNT(*) as local_reviews_count,
  AVG(r.rating)::NUMERIC(3,2) as local_average_rating,
  AVG(r.safety_rating)::NUMERIC(3,2) as local_average_safety,
  AVG(r.communication_rating)::NUMERIC(3,2) as local_average_communication,
  AVG(r.reliability_rating)::NUMERIC(3,2) as local_average_reliability,
  AVG(r.payment_safety_rating)::NUMERIC(3,2) as local_average_payment_safety,
  COUNT(CASE WHEN r.rating = 5 THEN 1 END) as local_five_star_count,
  COUNT(CASE WHEN r.rating = 4 THEN 1 END) as local_four_star_count,
  COUNT(CASE WHEN r.rating = 3 THEN 1 END) as local_three_star_count,
  COUNT(CASE WHEN r.rating = 2 THEN 1 END) as local_two_star_count,
  COUNT(CASE WHEN r.rating = 1 THEN 1 END) as local_one_star_count,
  r.transaction_location as area_name,
  ST_X(r.transaction_coordinates::geometry) as area_lng,
  ST_Y(r.transaction_coordinates::geometry) as area_lat
FROM public.reviews r
WHERE r.transaction_coordinates IS NOT NULL
GROUP BY r.reviewed_user_id, r.transaction_location, r.transaction_coordinates;

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
  radius_km numeric
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
    radius_km
  FROM public.reviews r
  WHERE r.reviewed_user_id = target_user_id
    AND r.transaction_coordinates IS NOT NULL
    AND ST_DWithin(
      r.transaction_coordinates::geometry,
      ST_MakePoint(user_lng, user_lat)::geometry,
      radius_km * 1000 -- Convert km to meters
    )
  GROUP BY target_user_id, radius_km;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_transaction_coordinates 
ON public.reviews USING GIST(transaction_coordinates);

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
      transaction_coordinates = CASE 
        WHEN a.latitude IS NOT NULL AND a.longitude IS NOT NULL 
        THEN ST_MakePoint(a.longitude, a.latitude)::point
        ELSE NULL 
      END
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