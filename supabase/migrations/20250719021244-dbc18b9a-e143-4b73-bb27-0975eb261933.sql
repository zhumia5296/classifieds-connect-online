-- Add location verification fields to verification_requests table
ALTER TABLE public.verification_requests 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS area_code TEXT,
ADD COLUMN IF NOT EXISTS verified_location TEXT,
ADD COLUMN IF NOT EXISTS location_coordinates POINT;

-- Add index for location-based queries
CREATE INDEX IF NOT EXISTS idx_verification_requests_area_code 
ON public.verification_requests(area_code);

-- Add location verification badge support
-- The verification_badges table should already support different badge_types
-- Add a check to ensure location verifications have the required data
CREATE OR REPLACE FUNCTION validate_location_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a location verification request, ensure required fields are present
  IF NEW.request_type = 'location' THEN
    IF NEW.phone_number IS NULL OR NEW.area_code IS NULL THEN
      RAISE EXCEPTION 'Location verification requires phone_number and area_code';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for location verification validation
DROP TRIGGER IF EXISTS validate_location_verification_trigger ON public.verification_requests;
CREATE TRIGGER validate_location_verification_trigger
  BEFORE INSERT OR UPDATE ON public.verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION validate_location_verification();

-- Update the approve_verification function to handle location verification
CREATE OR REPLACE FUNCTION public.approve_location_verification(
  request_id uuid, 
  reviewer_id uuid, 
  admin_notes text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  req_user_id uuid;
  req_type text;
  req_phone text;
  req_area_code text;
  req_location text;
BEGIN
  -- Get request details
  SELECT user_id, request_type, phone_number, area_code, verified_location
  INTO req_user_id, req_type, req_phone, req_area_code, req_location
  FROM public.verification_requests 
  WHERE id = request_id AND status = 'pending';
  
  IF req_user_id IS NULL THEN
    RAISE EXCEPTION 'Verification request not found or already processed';
  END IF;
  
  -- Update verification request
  UPDATE public.verification_requests 
  SET 
    status = 'approved',
    reviewed_at = now(),
    reviewed_by = reviewer_id,
    admin_notes = approve_location_verification.admin_notes,
    updated_at = now()
  WHERE id = request_id;
  
  -- Update user profile verification status
  UPDATE public.profiles 
  SET is_verified = true, updated_at = now()
  WHERE user_id = req_user_id;
  
  -- Add verification badge with location metadata
  INSERT INTO public.verification_badges (
    user_id,
    badge_type,
    issued_by,
    metadata
  ) VALUES (
    req_user_id,
    CASE 
      WHEN req_type = 'location' THEN 'location'
      ELSE req_type 
    END,
    reviewer_id,
    jsonb_build_object(
      'verified_on', now(),
      'phone_number', req_phone,
      'area_code', req_area_code,
      'verified_location', req_location
    )
  )
  ON CONFLICT (user_id, badge_type) 
  DO UPDATE SET
    is_active = true,
    issued_by = reviewer_id,
    issued_at = now(),
    metadata = jsonb_build_object(
      'verified_on', now(),
      'phone_number', req_phone,
      'area_code', req_area_code,
      'verified_location', req_location
    );
END;
$$;