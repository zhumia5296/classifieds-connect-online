-- Create RPC function to increment ad view count
CREATE OR REPLACE FUNCTION public.increment_ad_views(ad_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.ads 
  SET views_count = views_count + 1,
      updated_at = now()
  WHERE id = ad_id 
    AND is_active = true 
    AND status = 'active';
END;
$function$;