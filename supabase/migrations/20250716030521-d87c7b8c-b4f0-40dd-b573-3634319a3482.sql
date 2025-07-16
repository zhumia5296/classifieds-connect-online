-- Create watchlists table for saved searches
CREATE TABLE public.watchlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  criteria JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;

-- Create policies for watchlists
CREATE POLICY "Users can view their own watchlists" 
ON public.watchlists 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own watchlists" 
ON public.watchlists 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watchlists" 
ON public.watchlists 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watchlists" 
ON public.watchlists 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create watchlist notifications table
CREATE TABLE public.watchlist_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  watchlist_id UUID NOT NULL REFERENCES public.watchlists(id) ON DELETE CASCADE,
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for watchlist notifications
ALTER TABLE public.watchlist_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for watchlist notifications
CREATE POLICY "Users can view their own watchlist notifications" 
ON public.watchlist_notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own watchlist notifications" 
ON public.watchlist_notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert watchlist notifications" 
ON public.watchlist_notifications 
FOR INSERT 
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_watchlists_updated_at
BEFORE UPDATE ON public.watchlists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check ads against watchlists
CREATE OR REPLACE FUNCTION public.check_watchlist_matches()
RETURNS TRIGGER AS $$
DECLARE
  watchlist_record RECORD;
  criteria JSONB;
  keywords TEXT[];
  keyword TEXT;
  match_found BOOLEAN := false;
BEGIN
  -- Only check for newly inserted active ads
  IF TG_OP = 'INSERT' AND NEW.is_active = true AND NEW.status = 'active' THEN
    
    -- Loop through all active watchlists
    FOR watchlist_record IN 
      SELECT w.id, w.user_id, w.criteria 
      FROM public.watchlists w 
      WHERE w.is_active = true AND w.user_id != NEW.user_id
    LOOP
      criteria := watchlist_record.criteria;
      match_found := true;
      
      -- Check keywords
      IF criteria ? 'keywords' AND criteria->>'keywords' != '' THEN
        keywords := string_to_array(lower(criteria->>'keywords'), ' ');
        match_found := false;
        FOREACH keyword IN ARRAY keywords
        LOOP
          IF lower(NEW.title) LIKE '%' || keyword || '%' 
             OR lower(NEW.description) LIKE '%' || keyword || '%' THEN
            match_found := true;
            EXIT;
          END IF;
        END LOOP;
        IF NOT match_found THEN
          CONTINUE;
        END IF;
      END IF;
      
      -- Check category
      IF criteria ? 'category_id' AND criteria->>'category_id' != '' THEN
        IF NEW.category_id::TEXT != criteria->>'category_id' THEN
          CONTINUE;
        END IF;
      END IF;
      
      -- Check price range
      IF criteria ? 'min_price' AND criteria->>'min_price' != '' THEN
        IF NEW.price IS NULL OR NEW.price < (criteria->>'min_price')::NUMERIC THEN
          CONTINUE;
        END IF;
      END IF;
      
      IF criteria ? 'max_price' AND criteria->>'max_price' != '' THEN
        IF NEW.price IS NULL OR NEW.price > (criteria->>'max_price')::NUMERIC THEN
          CONTINUE;
        END IF;
      END IF;
      
      -- Check location (basic text match for now)
      IF criteria ? 'location' AND criteria->>'location' != '' THEN
        IF NEW.location IS NULL OR lower(NEW.location) NOT LIKE '%' || lower(criteria->>'location') || '%' THEN
          CONTINUE;
        END IF;
      END IF;
      
      -- If we get here, it's a match - create notification
      INSERT INTO public.watchlist_notifications (
        watchlist_id,
        ad_id,
        user_id
      ) VALUES (
        watchlist_record.id,
        NEW.id,
        watchlist_record.user_id
      );
      
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to check watchlists when new ads are posted
CREATE TRIGGER check_watchlist_matches_trigger
AFTER INSERT ON public.ads
FOR EACH ROW
EXECUTE FUNCTION public.check_watchlist_matches();