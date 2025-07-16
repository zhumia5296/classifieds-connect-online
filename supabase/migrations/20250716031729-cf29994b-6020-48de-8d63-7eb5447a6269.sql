-- Add trigger to send push notifications for new messages
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the send-push-notification edge function for new messages
  PERFORM
    net.http_post(
      url := 'https://lvvtlseiwrnrvrmenche.supabase.co/functions/v1/send-push-notification',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := json_build_object(
        'user_id', NEW.recipient_id,
        'title', 'New Message',
        'body', 'You have a new message about: ' || (SELECT title FROM ads WHERE id = NEW.ad_id LIMIT 1),
        'notification_type', 'new_messages',
        'data', json_build_object(
          'ad_id', NEW.ad_id,
          'message_id', NEW.id,
          'url', '/messages'
        )
      )::jsonb
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new messages
DROP TRIGGER IF EXISTS trigger_notify_new_message ON messages;
CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- Add trigger to send push notifications for price changes
CREATE OR REPLACE FUNCTION notify_price_change()
RETURNS TRIGGER AS $$
DECLARE
  watchers RECORD;
BEGIN
  -- Only notify if price actually changed and decreased
  IF OLD.price IS DISTINCT FROM NEW.price AND NEW.price < OLD.price THEN
    -- Notify users who saved this ad
    FOR watchers IN 
      SELECT DISTINCT sa.user_id
      FROM saved_ads sa
      WHERE sa.ad_id = NEW.id
    LOOP
      PERFORM
        net.http_post(
          url := 'https://lvvtlseiwrnrvrmenche.supabase.co/functions/v1/send-push-notification',
          headers := '{"Content-Type": "application/json"}'::jsonb,
          body := json_build_object(
            'user_id', watchers.user_id,
            'title', 'Price Drop Alert!',
            'body', NEW.title || ' price dropped to ' || NEW.currency || NEW.price,
            'notification_type', 'price_changes',
            'data', json_build_object(
              'ad_id', NEW.id,
              'old_price', OLD.price,
              'new_price', NEW.price,
              'url', '/ad/' || NEW.id
            )
          )::jsonb
        );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for price changes
DROP TRIGGER IF EXISTS trigger_notify_price_change ON ads;
CREATE TRIGGER trigger_notify_price_change
  AFTER UPDATE ON ads
  FOR EACH ROW
  EXECUTE FUNCTION notify_price_change();

-- Add trigger to send push notifications for similar ads
CREATE OR REPLACE FUNCTION notify_similar_ads()
RETURNS TRIGGER AS $$
DECLARE
  similar_watchers RECORD;
  keywords TEXT[];
  keyword TEXT;
  match_found BOOLEAN := false;
BEGIN
  -- Only for newly inserted active ads
  IF TG_OP = 'INSERT' AND NEW.is_active = true AND NEW.status = 'active' THEN
    
    -- Find users with saved ads in the same category
    FOR similar_watchers IN 
      SELECT DISTINCT sa.user_id, p.display_name
      FROM saved_ads sa
      JOIN ads a ON sa.ad_id = a.id
      JOIN profiles p ON sa.user_id = p.user_id
      WHERE a.category_id = NEW.category_id 
        AND sa.user_id != NEW.user_id
        AND a.id != NEW.id
      LIMIT 10 -- Limit to avoid spam
    LOOP
      PERFORM
        net.http_post(
          url := 'https://lvvtlseiwrnrvrmenche.supabase.co/functions/v1/send-push-notification',
          headers := '{"Content-Type": "application/json"}'::jsonb,
          body := json_build_object(
            'user_id', similar_watchers.user_id,
            'title', 'Similar Ad Available',
            'body', 'New listing in your saved category: ' || NEW.title,
            'notification_type', 'ad_responses',
            'data', json_build_object(
              'ad_id', NEW.id,
              'url', '/ad/' || NEW.id
            )
          )::jsonb
        );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for similar ads
DROP TRIGGER IF EXISTS trigger_notify_similar_ads ON ads;
CREATE TRIGGER trigger_notify_similar_ads
  AFTER INSERT ON ads
  FOR EACH ROW
  EXECUTE FUNCTION notify_similar_ads();

-- Update the watchlist function to use push notifications
CREATE OR REPLACE FUNCTION check_watchlist_matches()
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
      
      -- If we get here, it's a match - create notification and send push notification
      INSERT INTO public.watchlist_notifications (
        watchlist_id,
        ad_id,
        user_id
      ) VALUES (
        watchlist_record.id,
        NEW.id,
        watchlist_record.user_id
      );

      -- Send push notification
      PERFORM
        net.http_post(
          url := 'https://lvvtlseiwrnrvrmenche.supabase.co/functions/v1/send-push-notification',
          headers := '{"Content-Type": "application/json"}'::jsonb,
          body := json_build_object(
            'user_id', watchlist_record.user_id,
            'title', 'Watchlist Match Found!',
            'body', 'New listing matches your "' || watchlist_record.name || '" watchlist: ' || NEW.title,
            'notification_type', 'ad_responses',
            'data', json_build_object(
              'ad_id', NEW.id,
              'watchlist_id', watchlist_record.id,
              'url', '/ad/' || NEW.id
            )
          )::jsonb
        );
      
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;