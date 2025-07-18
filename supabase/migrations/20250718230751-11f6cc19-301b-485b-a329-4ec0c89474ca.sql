-- Create search alerts table
CREATE TABLE IF NOT EXISTS public.search_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  search_query TEXT,
  filters JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  notification_enabled BOOLEAN DEFAULT true,
  last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.search_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for search alerts
CREATE POLICY "Users can manage their own search alerts"
ON public.search_alerts
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create search alert matches table to track what items matched which alerts
CREATE TABLE IF NOT EXISTS public.search_alert_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_alert_id UUID NOT NULL REFERENCES public.search_alerts(id) ON DELETE CASCADE,
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(search_alert_id, ad_id)
);

-- Enable RLS
ALTER TABLE public.search_alert_matches ENABLE ROW LEVEL SECURITY;

-- Create policies for search alert matches
CREATE POLICY "Users can view their own search alert matches"
ON public.search_alert_matches
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create search alert matches"
ON public.search_alert_matches
FOR INSERT
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_search_alerts_updated_at
  BEFORE UPDATE ON public.search_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check search alerts for new ads
CREATE OR REPLACE FUNCTION public.check_search_alerts()
RETURNS TRIGGER AS $$
DECLARE
  alert_record RECORD;
  filters JSONB;
  search_terms TEXT[];
  term TEXT;
  matches BOOLEAN;
BEGIN
  -- Only check for newly inserted active ads
  IF TG_OP = 'INSERT' AND NEW.is_active = true AND NEW.status = 'active' THEN
    
    -- Loop through all active search alerts
    FOR alert_record IN 
      SELECT sa.id, sa.user_id, sa.search_query, sa.filters, sa.name
      FROM public.search_alerts sa 
      WHERE sa.is_active = true 
        AND sa.notification_enabled = true
        AND sa.user_id != NEW.user_id
    LOOP
      matches := true;
      filters := alert_record.filters;
      
      -- Check search query terms
      IF alert_record.search_query IS NOT NULL AND alert_record.search_query != '' THEN
        search_terms := string_to_array(lower(alert_record.search_query), ' ');
        matches := false;
        FOREACH term IN ARRAY search_terms
        LOOP
          IF lower(NEW.title) LIKE '%' || term || '%' 
             OR lower(NEW.description) LIKE '%' || term || '%' THEN
            matches := true;
            EXIT;
          END IF;
        END LOOP;
        IF NOT matches THEN
          CONTINUE;
        END IF;
      END IF;
      
      -- Check category filter
      IF filters ? 'category_id' AND filters->>'category_id' != '' THEN
        IF NEW.category_id::TEXT != filters->>'category_id' THEN
          CONTINUE;
        END IF;
      END IF;
      
      -- Check price range
      IF filters ? 'min_price' AND filters->>'min_price' != '' THEN
        IF NEW.price IS NULL OR NEW.price < (filters->>'min_price')::NUMERIC THEN
          CONTINUE;
        END IF;
      END IF;
      
      IF filters ? 'max_price' AND filters->>'max_price' != '' THEN
        IF NEW.price IS NULL OR NEW.price > (filters->>'max_price')::NUMERIC THEN
          CONTINUE;
        END IF;
      END IF;
      
      -- Check condition filter
      IF filters ? 'condition' AND filters->>'condition' != '' THEN
        IF NEW.condition IS NULL OR NEW.condition != filters->>'condition' THEN
          CONTINUE;
        END IF;
      END IF;
      
      -- Check location filter (basic text match)
      IF filters ? 'location' AND filters->>'location' != '' THEN
        IF NEW.location IS NULL OR lower(NEW.location) NOT LIKE '%' || lower(filters->>'location') || '%' THEN
          CONTINUE;
        END IF;
      END IF;
      
      -- If we get here, it's a match - create record and send notification
      INSERT INTO public.search_alert_matches (
        search_alert_id,
        ad_id,
        user_id
      ) VALUES (
        alert_record.id,
        NEW.id,
        alert_record.user_id
      ) ON CONFLICT (search_alert_id, ad_id) DO NOTHING;

      -- Create in-app notification
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        data,
        action_url,
        action_label
      ) VALUES (
        alert_record.user_id,
        'search_alert_match',
        'Search Alert Match!',
        'New item matches your "' || alert_record.name || '" search: ' || NEW.title,
        jsonb_build_object(
          'ad_id', NEW.id,
          'search_alert_id', alert_record.id,
          'search_alert_name', alert_record.name,
          'price', NEW.price,
          'currency', NEW.currency
        ),
        '/ad/' || NEW.id,
        'View Item'
      );

      -- Send push notification
      PERFORM
        net.http_post(
          url := 'https://lvvtlseiwrnrvrmenche.supabase.co/functions/v1/send-push-notification',
          headers := '{"Content-Type": "application/json"}'::jsonb,
          body := json_build_object(
            'user_id', alert_record.user_id,
            'title', 'Search Alert Match! 🔍',
            'body', '"' || NEW.title || '" matches your "' || alert_record.name || '" search',
            'notification_type', 'search_alert_match',
            'data', json_build_object(
              'ad_id', NEW.id,
              'search_alert_id', alert_record.id,
              'url', '/ad/' || NEW.id
            )
          )::jsonb
        );
      
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to check search alerts on new ads
CREATE TRIGGER check_search_alerts_on_new_ad
  AFTER INSERT ON public.ads
  FOR EACH ROW
  EXECUTE FUNCTION public.check_search_alerts();