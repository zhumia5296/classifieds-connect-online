-- Enhanced function to send email notifications for new messages
CREATE OR REPLACE FUNCTION public.notify_new_message_with_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Get ad title and sender name for the email
  DECLARE
    ad_title TEXT;
    sender_name TEXT;
  BEGIN
    SELECT a.title INTO ad_title 
    FROM ads a WHERE a.id = NEW.ad_id;
    
    SELECT COALESCE(p.display_name, 'A user') INTO sender_name 
    FROM profiles p WHERE p.user_id = NEW.sender_id;
    
    -- Send email notification via edge function
    PERFORM
      net.http_post(
        url := 'https://lvvtlseiwrnrvrmenche.supabase.co/functions/v1/send-email-notification',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := json_build_object(
          'user_id', NEW.recipient_id,
          'notification_type', 'new_messages',
          'subject', 'New message about: ' || COALESCE(ad_title, 'your listing'),
          'title', 'New Message Received',
          'message', 'You have received a new message from ' || sender_name || ' about your listing "' || COALESCE(ad_title, 'Untitled') || '".',
          'action_url', '/messages?ad=' || NEW.ad_id,
          'action_label', 'View Message',
          'data', json_build_object(
            'ad_id', NEW.ad_id,
            'message_id', NEW.id,
            'sender_name', sender_name
          )
        )::jsonb
      );
  END;
  
  RETURN NEW;
END;
$function$;

-- Enhanced function to send email notifications for price changes
CREATE OR REPLACE FUNCTION public.notify_price_change_with_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
      -- Send email notification
      PERFORM
        net.http_post(
          url := 'https://lvvtlseiwrnrvrmenche.supabase.co/functions/v1/send-email-notification',
          headers := '{"Content-Type": "application/json"}'::jsonb,
          body := json_build_object(
            'user_id', watchers.user_id,
            'notification_type', 'price_changes',
            'subject', 'Price Drop Alert: ' || NEW.title,
            'title', 'Price Drop Alert!',
            'message', 'Great news! The price for "' || NEW.title || '" has dropped from ' || COALESCE(NEW.currency, 'USD') || OLD.price || ' to ' || COALESCE(NEW.currency, 'USD') || NEW.price || '.',
            'action_url', '/ad/' || NEW.id,
            'action_label', 'View Listing',
            'data', json_build_object(
              'ad_id', NEW.id,
              'old_price', OLD.price,
              'new_price', NEW.price,
              'currency', COALESCE(NEW.currency, 'USD')
            )
          )::jsonb
        );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Enhanced function to send email notifications for watchlist matches
CREATE OR REPLACE FUNCTION public.check_watchlist_matches_with_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
      
      -- If we get here, it's a match - create notification and send email
      INSERT INTO public.watchlist_notifications (
        watchlist_id,
        ad_id,
        user_id
      ) VALUES (
        watchlist_record.id,
        NEW.id,
        watchlist_record.user_id
      );

      -- Send email notification
      PERFORM
        net.http_post(
          url := 'https://lvvtlseiwrnrvrmenche.supabase.co/functions/v1/send-email-notification',
          headers := '{"Content-Type": "application/json"}'::jsonb,
          body := json_build_object(
            'user_id', watchlist_record.user_id,
            'notification_type', 'ad_responses',
            'subject', 'Watchlist Match: ' || NEW.title,
            'title', 'Watchlist Match Found!',
            'message', 'A new listing "' || NEW.title || '" matches your watchlist "' || watchlist_record.name || '". Check it out before it''s gone!',
            'action_url', '/ad/' || NEW.id,
            'action_label', 'View Listing',
            'data', json_build_object(
              'ad_id', NEW.id,
              'watchlist_id', watchlist_record.id,
              'watchlist_name', watchlist_record.name
            )
          )::jsonb
        );
      
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Drop old triggers and create new ones with email notifications
DROP TRIGGER IF EXISTS notify_new_message_trigger ON public.messages;
DROP TRIGGER IF EXISTS notify_price_change_trigger ON public.ads;
DROP TRIGGER IF EXISTS check_watchlist_matches_trigger ON public.ads;

-- Create new triggers with email notifications
CREATE TRIGGER notify_new_message_with_email_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_message_with_email();

CREATE TRIGGER notify_price_change_with_email_trigger
  AFTER UPDATE ON public.ads
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_price_change_with_email();

CREATE TRIGGER check_watchlist_matches_with_email_trigger
  AFTER INSERT ON public.ads
  FOR EACH ROW
  EXECUTE FUNCTION public.check_watchlist_matches_with_email();

-- Function to send ad expiring email notifications (called by cron job)
CREATE OR REPLACE FUNCTION public.send_ad_expiring_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  expiring_ad RECORD;
  days_left INTEGER;
BEGIN
  -- Find ads expiring in the next 3 days
  FOR expiring_ad IN
    SELECT a.id, a.user_id, a.title, a.expires_at
    FROM public.ads a
    WHERE a.is_active = true 
      AND a.status = 'active'
      AND a.expires_at IS NOT NULL
      AND a.expires_at BETWEEN now() AND now() + interval '3 days'
      AND NOT EXISTS (
        -- Don't send if we already sent a notification in the last 24 hours
        SELECT 1 FROM public.notifications n
        WHERE n.user_id = a.user_id
          AND n.type = 'ad_expiring'
          AND n.data->>'ad_id' = a.id::text
          AND n.created_at > now() - interval '24 hours'
      )
  LOOP
    days_left := CEIL(EXTRACT(EPOCH FROM (expiring_ad.expires_at - now())) / 86400);
    
    -- Send email notification
    PERFORM
      net.http_post(
        url := 'https://lvvtlseiwrnrvrmenche.supabase.co/functions/v1/send-email-notification',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := json_build_object(
          'user_id', expiring_ad.user_id,
          'notification_type', 'ad_expiring',
          'subject', 'Your listing expires in ' || days_left || ' day' || CASE WHEN days_left = 1 THEN '' ELSE 's' END,
          'title', 'Listing Expiring Soon',
          'message', 'Your listing "' || expiring_ad.title || '" will expire in ' || days_left || ' day' || CASE WHEN days_left = 1 THEN '' ELSE 's' END || '. Consider renewing it to keep it active.',
          'action_url', '/dashboard?highlight=' || expiring_ad.id,
          'action_label', 'Manage Listing',
          'data', json_build_object(
            'ad_id', expiring_ad.id,
            'expires_at', expiring_ad.expires_at,
            'days_left', days_left
          )
        )::jsonb
      );
  END LOOP;
END;
$function$;