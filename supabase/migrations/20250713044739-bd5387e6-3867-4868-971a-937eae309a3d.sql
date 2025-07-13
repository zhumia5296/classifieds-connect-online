-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job to run the cleanup function every hour
SELECT cron.schedule(
  'cleanup-expired-featured-ads',
  '0 * * * *', -- every hour at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://lvvtlseiwrnrvrmenche.supabase.co/functions/v1/cleanup-expired-featured',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2dnRsc2Vpd3JucnZybWVuY2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNjQzNjEsImV4cCI6MjA2Nzk0MDM2MX0.gORqMiQAA66-qgrOJZXQ5hzQ0505Tmrm4LEsT7_DRbc"}'::jsonb,
        body:='{"source": "cron"}'::jsonb
    ) as request_id;
  $$
);

-- Create a database function to handle featured ad expiration
CREATE OR REPLACE FUNCTION expire_featured_ads()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Update expired featured ads
  UPDATE public.ads 
  SET 
    is_featured = false,
    featured_until = null,
    updated_at = now()
  WHERE 
    is_featured = true 
    AND featured_until < now();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Update corresponding orders
  UPDATE public.featured_ad_orders 
  SET 
    status = 'expired',
    updated_at = now()
  WHERE 
    status = 'paid'
    AND featured_until < now();
  
  RETURN expired_count;
END;
$$;

-- Create a trigger to automatically expire featured ads on any ads table query
-- This ensures cleanup happens even without the cron job
CREATE OR REPLACE FUNCTION auto_expire_featured_ads_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Only run cleanup occasionally to avoid performance impact
  -- Use random to run approximately every 100th query
  IF random() < 0.01 THEN
    PERFORM expire_featured_ads();
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger on ads table SELECT operations
DROP TRIGGER IF EXISTS auto_expire_featured_ads ON public.ads;
CREATE TRIGGER auto_expire_featured_ads
  AFTER SELECT ON public.ads
  FOR EACH STATEMENT
  EXECUTE FUNCTION auto_expire_featured_ads_trigger();