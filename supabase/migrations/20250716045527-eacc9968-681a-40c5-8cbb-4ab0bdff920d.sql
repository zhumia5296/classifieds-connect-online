-- Update existing notification functions to use the new notifications table

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT DEFAULT 'general',
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT '{}',
  p_action_url TEXT DEFAULT NULL,
  p_action_label TEXT DEFAULT NULL,
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id, type, title, message, data, action_url, action_label, expires_at
  ) VALUES (
    p_user_id, p_type, p_title, p_message, p_data, p_action_url, p_action_label, p_expires_at
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Update the existing message notification trigger to use new system
CREATE OR REPLACE FUNCTION public.notify_new_message_enhanced()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sender_name TEXT;
  ad_title TEXT;
BEGIN
  -- Get sender name and ad title
  SELECT COALESCE(p.display_name, 'Someone') INTO sender_name
  FROM public.profiles p 
  WHERE p.user_id = NEW.sender_id;
  
  SELECT a.title INTO ad_title
  FROM public.ads a 
  WHERE a.id = NEW.ad_id;
  
  -- Create notification using new system
  PERFORM public.create_notification(
    NEW.recipient_id,
    'message',
    'New message from ' || sender_name,
    NEW.content,
    jsonb_build_object(
      'message_id', NEW.id,
      'sender_id', NEW.sender_id,
      'ad_id', NEW.ad_id,
      'ad_title', ad_title
    ),
    '/messages',
    'View Message'
  );
  
  RETURN NEW;
END;
$$;

-- Update the watchlist notification trigger
CREATE OR REPLACE FUNCTION public.notify_watchlist_match_enhanced()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  watchlist_record RECORD;
  criteria JSONB;
  keywords TEXT[];
  keyword TEXT;
  match_found BOOLEAN := false;
  ad_data RECORD;
BEGIN
  -- Only check for newly inserted active ads
  IF TG_OP = 'INSERT' AND NEW.is_active = true AND NEW.status = 'active' THEN
    
    -- Loop through all active watchlists
    FOR watchlist_record IN 
      SELECT w.id, w.user_id, w.criteria, w.name 
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
      
      -- Check other criteria (category, price, location)
      IF criteria ? 'category_id' AND criteria->>'category_id' != '' THEN
        IF NEW.category_id::TEXT != criteria->>'category_id' THEN
          CONTINUE;
        END IF;
      END IF;
      
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
      
      IF criteria ? 'location' AND criteria->>'location' != '' THEN
        IF NEW.location IS NULL OR lower(NEW.location) NOT LIKE '%' || lower(criteria->>'location') || '%' THEN
          CONTINUE;
        END IF;
      END IF;
      
      -- If we get here, it's a match
      INSERT INTO public.watchlist_notifications (
        watchlist_id, ad_id, user_id
      ) VALUES (
        watchlist_record.id, NEW.id, watchlist_record.user_id
      );

      -- Create enhanced notification
      PERFORM public.create_notification(
        watchlist_record.user_id,
        'watchlist',
        'New ad matches "' || watchlist_record.name || '"',
        CASE 
          WHEN NEW.price IS NOT NULL THEN 
            NEW.title || ' - ' || COALESCE(NEW.currency, 'USD') || ' ' || NEW.price
          ELSE NEW.title
        END,
        jsonb_build_object(
          'ad_id', NEW.id,
          'watchlist_id', watchlist_record.id,
          'watchlist_name', watchlist_record.name,
          'price', NEW.price,
          'currency', NEW.currency
        ),
        '/ad/' || NEW.id,
        'View Ad'
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop old triggers and create new ones
DROP TRIGGER IF EXISTS notify_new_message ON public.messages;
DROP TRIGGER IF EXISTS check_watchlist_matches ON public.ads;

CREATE TRIGGER notify_new_message_enhanced
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_message_enhanced();

CREATE TRIGGER notify_watchlist_match_enhanced
AFTER INSERT ON public.ads
FOR EACH ROW
EXECUTE FUNCTION public.notify_watchlist_match_enhanced();