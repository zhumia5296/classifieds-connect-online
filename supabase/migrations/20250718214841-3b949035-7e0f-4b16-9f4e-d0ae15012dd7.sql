-- Create table for nearby item alert preferences
CREATE TABLE public.nearby_alert_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  radius_km INTEGER NOT NULL DEFAULT 25,
  max_price NUMERIC,
  min_price NUMERIC,
  categories TEXT[] DEFAULT '{}',
  conditions TEXT[] DEFAULT '{}',
  keywords TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on nearby alert preferences
ALTER TABLE public.nearby_alert_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for nearby alert preferences
CREATE POLICY "Users can manage their own nearby alert preferences"
ON public.nearby_alert_preferences
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create function to check for nearby item alerts
CREATE OR REPLACE FUNCTION public.check_nearby_item_alerts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  alert_record RECORD;
  distance_km DECIMAL;
  price_match BOOLEAN;
  category_match BOOLEAN;
  condition_match BOOLEAN;
  keyword_match BOOLEAN;
  location_display TEXT;
BEGIN
  -- Only check for newly inserted active ads
  IF TG_OP = 'INSERT' AND NEW.is_active = true AND NEW.status = 'active' AND NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    
    -- Loop through all enabled nearby alert preferences
    FOR alert_record IN 
      SELECT *
      FROM public.nearby_alert_preferences 
      WHERE is_enabled = true 
        AND user_id != NEW.user_id
        AND location_lat IS NOT NULL 
        AND location_lng IS NOT NULL
    LOOP
      -- Calculate distance
      distance_km := public.calculate_distance(
        alert_record.location_lat,
        alert_record.location_lng,
        NEW.latitude,
        NEW.longitude
      );
      
      -- Skip if outside radius
      IF distance_km > alert_record.radius_km THEN
        CONTINUE;
      END IF;
      
      -- Check price range
      price_match := true;
      IF alert_record.min_price IS NOT NULL AND (NEW.price IS NULL OR NEW.price < alert_record.min_price) THEN
        price_match := false;
      END IF;
      IF alert_record.max_price IS NOT NULL AND (NEW.price IS NULL OR NEW.price > alert_record.max_price) THEN
        price_match := false;
      END IF;
      
      -- Check categories
      category_match := true;
      IF array_length(alert_record.categories, 1) > 0 THEN
        category_match := NEW.category_id = ANY(alert_record.categories::UUID[]);
      END IF;
      
      -- Check conditions
      condition_match := true;
      IF array_length(alert_record.conditions, 1) > 0 THEN
        condition_match := NEW.condition = ANY(alert_record.conditions) OR NEW.condition IS NULL;
      END IF;
      
      -- Check keywords
      keyword_match := true;
      IF alert_record.keywords IS NOT NULL AND alert_record.keywords != '' THEN
        keyword_match := (
          lower(NEW.title) LIKE '%' || lower(alert_record.keywords) || '%' OR
          lower(NEW.description) LIKE '%' || lower(alert_record.keywords) || '%'
        );
      END IF;
      
      -- If all conditions match, send notification
      IF price_match AND category_match AND condition_match AND keyword_match THEN
        -- Determine location display
        location_display := COALESCE(alert_record.location_name, 'your area');
        
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
          'nearby_item_alert',
          'New Item Nearby!',
          '"' || NEW.title || '" is now available ' || ROUND(distance_km, 1) || 'km from ' || location_display,
          jsonb_build_object(
            'ad_id', NEW.id,
            'distance_km', distance_km,
            'price', NEW.price,
            'currency', NEW.currency,
            'category_id', NEW.category_id
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
              'title', 'New Item Nearby! 📍',
              'body', '"' || NEW.title || '" • ' || COALESCE(NEW.currency, 'USD') || COALESCE(NEW.price::text, 'Price on request') || ' • ' || ROUND(distance_km, 1) || 'km away',
              'notification_type', 'nearby_item_alert',
              'data', json_build_object(
                'ad_id', NEW.id,
                'distance_km', distance_km,
                'url', '/ad/' || NEW.id
              )
            )::jsonb
          );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for nearby item alerts
CREATE TRIGGER trigger_check_nearby_item_alerts
  AFTER INSERT ON public.ads
  FOR EACH ROW
  EXECUTE FUNCTION public.check_nearby_item_alerts();

-- Add trigger for updating timestamps
CREATE TRIGGER update_nearby_alert_preferences_updated_at
  BEFORE UPDATE ON public.nearby_alert_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();