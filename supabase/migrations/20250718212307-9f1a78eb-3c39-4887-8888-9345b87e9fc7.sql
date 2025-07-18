-- Add safety rating fields to the reviews table
ALTER TABLE public.reviews 
ADD COLUMN safety_rating integer CHECK (safety_rating >= 1 AND safety_rating <= 5),
ADD COLUMN communication_rating integer CHECK (communication_rating >= 1 AND communication_rating <= 5),
ADD COLUMN reliability_rating integer CHECK (reliability_rating >= 1 AND reliability_rating <= 5),
ADD COLUMN payment_safety_rating integer CHECK (payment_safety_rating >= 1 AND payment_safety_rating <= 5);

-- Update the user_reputation table to include safety metrics
ALTER TABLE public.user_reputation 
ADD COLUMN average_safety_rating numeric DEFAULT 0,
ADD COLUMN average_communication_rating numeric DEFAULT 0,
ADD COLUMN average_reliability_rating numeric DEFAULT 0,
ADD COLUMN average_payment_safety_rating numeric DEFAULT 0,
ADD COLUMN overall_safety_score numeric DEFAULT 0;

-- Update the update_user_reputation function to include safety metrics
CREATE OR REPLACE FUNCTION public.update_user_reputation(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  rep_data RECORD;
  safety_data RECORD;
BEGIN
  -- Calculate reputation data
  SELECT 
    COUNT(*) as total_reviews,
    COALESCE(AVG(rating), 0) as avg_rating,
    COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
    COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
    COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
    COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
    COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star,
    COUNT(CASE WHEN transaction_type = 'selling' THEN 1 END) as sales,
    COUNT(CASE WHEN transaction_type = 'buying' THEN 1 END) as purchases
  INTO rep_data
  FROM public.reviews 
  WHERE reviewed_user_id = target_user_id;

  -- Calculate safety metrics
  SELECT 
    COALESCE(AVG(safety_rating), 0) as avg_safety,
    COALESCE(AVG(communication_rating), 0) as avg_communication,
    COALESCE(AVG(reliability_rating), 0) as avg_reliability,
    COALESCE(AVG(payment_safety_rating), 0) as avg_payment_safety
  INTO safety_data
  FROM public.reviews 
  WHERE reviewed_user_id = target_user_id 
    AND (safety_rating IS NOT NULL OR communication_rating IS NOT NULL 
         OR reliability_rating IS NOT NULL OR payment_safety_rating IS NOT NULL);

  -- Calculate reputation score (weighted algorithm)
  DECLARE
    reputation_score INTEGER := 0;
    safety_score NUMERIC := 0;
  BEGIN
    reputation_score := (
      (rep_data.five_star * 100) + 
      (rep_data.four_star * 75) + 
      (rep_data.three_star * 50) + 
      (rep_data.two_star * 25) + 
      (rep_data.one_star * 0)
    );
    
    -- Bonus for volume (up to 500 points)
    reputation_score := reputation_score + LEAST(rep_data.total_reviews * 10, 500);
    
    -- Calculate overall safety score (average of all safety metrics)
    safety_score := (
      COALESCE(safety_data.avg_safety, 0) + 
      COALESCE(safety_data.avg_communication, 0) + 
      COALESCE(safety_data.avg_reliability, 0) + 
      COALESCE(safety_data.avg_payment_safety, 0)
    ) / 4.0;
  END;

  -- Insert or update reputation data
  INSERT INTO public.user_reputation (
    user_id,
    total_reviews,
    average_rating,
    five_star_count,
    four_star_count,
    three_star_count,
    two_star_count,
    one_star_count,
    total_sales,
    total_purchases,
    reputation_score,
    average_safety_rating,
    average_communication_rating,
    average_reliability_rating,
    average_payment_safety_rating,
    overall_safety_score,
    last_updated
  ) VALUES (
    target_user_id,
    rep_data.total_reviews,
    rep_data.avg_rating,
    rep_data.five_star,
    rep_data.four_star,
    rep_data.three_star,
    rep_data.two_star,
    rep_data.one_star,
    rep_data.sales,
    rep_data.purchases,
    reputation_score,
    safety_data.avg_safety,
    safety_data.avg_communication,
    safety_data.avg_reliability,
    safety_data.avg_payment_safety,
    safety_score,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_reviews = EXCLUDED.total_reviews,
    average_rating = EXCLUDED.average_rating,
    five_star_count = EXCLUDED.five_star_count,
    four_star_count = EXCLUDED.four_star_count,
    three_star_count = EXCLUDED.three_star_count,
    two_star_count = EXCLUDED.two_star_count,
    one_star_count = EXCLUDED.one_star_count,
    total_sales = EXCLUDED.total_sales,
    total_purchases = EXCLUDED.total_purchases,
    reputation_score = EXCLUDED.reputation_score,
    average_safety_rating = EXCLUDED.average_safety_rating,
    average_communication_rating = EXCLUDED.average_communication_rating,
    average_reliability_rating = EXCLUDED.average_reliability_rating,
    average_payment_safety_rating = EXCLUDED.average_payment_safety_rating,
    overall_safety_score = EXCLUDED.overall_safety_score,
    last_updated = EXCLUDED.last_updated;
END;
$function$;