-- Create reviews and ratings system

-- Reviews table for user feedback
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewed_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_id UUID REFERENCES public.ads(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  comment TEXT,
  transaction_type TEXT CHECK (transaction_type IN ('buying', 'selling')),
  is_verified BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT no_self_review CHECK (reviewer_id != reviewed_user_id),
  UNIQUE(reviewer_id, reviewed_user_id, ad_id)
);

-- Review helpfulness votes
CREATE TABLE public.review_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- User reputation summary (calculated from reviews)
CREATE TABLE public.user_reputation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_reviews INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  five_star_count INTEGER DEFAULT 0,
  four_star_count INTEGER DEFAULT 0,
  three_star_count INTEGER DEFAULT 0,
  two_star_count INTEGER DEFAULT 0,
  one_star_count INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  total_purchases INTEGER DEFAULT 0,
  reputation_score INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reputation ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews
CREATE POLICY "Users can view all reviews" 
ON public.reviews FOR SELECT 
USING (true);

CREATE POLICY "Users can create reviews for others" 
ON public.reviews FOR INSERT 
WITH CHECK (auth.uid() = reviewer_id AND reviewer_id != reviewed_user_id);

CREATE POLICY "Users can update their own reviews" 
ON public.reviews FOR UPDATE 
USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete their own reviews" 
ON public.reviews FOR DELETE 
USING (auth.uid() = reviewer_id);

-- RLS Policies for review votes
CREATE POLICY "Users can view all review votes" 
ON public.review_votes FOR SELECT 
USING (true);

CREATE POLICY "Users can vote on reviews" 
ON public.review_votes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" 
ON public.review_votes FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" 
ON public.review_votes FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for user reputation
CREATE POLICY "Users can view all reputation data" 
ON public.user_reputation FOR SELECT 
USING (true);

CREATE POLICY "System can update reputation data" 
ON public.user_reputation FOR ALL 
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_reviews_reviewed_user_id ON public.reviews(reviewed_user_id);
CREATE INDEX idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX idx_reviews_ad_id ON public.reviews(ad_id);
CREATE INDEX idx_reviews_rating ON public.reviews(rating);
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at);

CREATE INDEX idx_review_votes_review_id ON public.review_votes(review_id);
CREATE INDEX idx_review_votes_user_id ON public.review_votes(user_id);

CREATE INDEX idx_user_reputation_user_id ON public.user_reputation(user_id);
CREATE INDEX idx_user_reputation_average_rating ON public.user_reputation(average_rating);

-- Function to update user reputation
CREATE OR REPLACE FUNCTION public.update_user_reputation(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rep_data RECORD;
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

  -- Calculate reputation score (weighted algorithm)
  DECLARE
    reputation_score INTEGER := 0;
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
    last_updated = EXCLUDED.last_updated;
END;
$$;

-- Function to update review helpfulness count
CREATE OR REPLACE FUNCTION public.update_review_helpfulness()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.reviews 
    SET helpful_count = helpful_count + (CASE WHEN NEW.is_helpful THEN 1 ELSE -1 END)
    WHERE id = NEW.review_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle vote change
    UPDATE public.reviews 
    SET helpful_count = helpful_count + 
      (CASE WHEN NEW.is_helpful THEN 1 ELSE -1 END) - 
      (CASE WHEN OLD.is_helpful THEN 1 ELSE -1 END)
    WHERE id = NEW.review_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.reviews 
    SET helpful_count = helpful_count - (CASE WHEN OLD.is_helpful THEN 1 ELSE -1 END)
    WHERE id = OLD.review_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger to update reputation when reviews change
CREATE OR REPLACE FUNCTION public.handle_review_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.update_user_reputation(NEW.reviewed_user_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.update_user_reputation(NEW.reviewed_user_id);
    IF OLD.reviewed_user_id != NEW.reviewed_user_id THEN
      PERFORM public.update_user_reputation(OLD.reviewed_user_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.update_user_reputation(OLD.reviewed_user_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create triggers
CREATE TRIGGER trigger_update_review_helpfulness
  AFTER INSERT OR UPDATE OR DELETE ON public.review_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_review_helpfulness();

CREATE TRIGGER trigger_handle_review_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_review_changes();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();