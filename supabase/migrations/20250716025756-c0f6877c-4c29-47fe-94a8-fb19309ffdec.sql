-- Create verification requests table
CREATE TABLE public.verification_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type text NOT NULL DEFAULT 'seller'::text,
  business_name text,
  business_registration text,
  identity_document_url text,
  business_document_url text,
  website_url text,
  social_media_urls jsonb,
  additional_info text,
  status text NOT NULL DEFAULT 'pending'::text,
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid REFERENCES auth.users(id),
  admin_notes text,
  rejection_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on verification requests
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- Users can create their own verification requests
CREATE POLICY "Users can create their own verification requests" 
ON public.verification_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can view their own verification requests
CREATE POLICY "Users can view their own verification requests" 
ON public.verification_requests 
FOR SELECT 
USING (auth.uid() = user_id);

-- Admins can manage all verification requests
CREATE POLICY "Admins can manage all verification requests" 
ON public.verification_requests 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Create verification badges table for different verification types
CREATE TABLE public.verification_badges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type text NOT NULL,
  issued_at timestamp with time zone NOT NULL DEFAULT now(),
  issued_by uuid REFERENCES auth.users(id),
  expires_at timestamp with time zone,
  metadata jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_type)
);

-- Enable RLS on verification badges
ALTER TABLE public.verification_badges ENABLE ROW LEVEL SECURITY;

-- Anyone can view active verification badges
CREATE POLICY "Active verification badges are viewable by everyone" 
ON public.verification_badges 
FOR SELECT 
USING (is_active = true);

-- Admins can manage verification badges
CREATE POLICY "Admins can manage verification badges" 
ON public.verification_badges 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_verification_requests_updated_at
BEFORE UPDATE ON public.verification_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create notification for new verification requests
CREATE OR REPLACE FUNCTION public.notify_verification_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This could be used to send notifications to admins
  -- For now, we'll just log the event
  INSERT INTO public.analytics_events (
    event_name,
    event_type,
    user_id,
    event_data
  ) VALUES (
    'verification_request_submitted',
    'verification',
    NEW.user_id,
    jsonb_build_object(
      'request_id', NEW.id,
      'request_type', NEW.request_type,
      'status', NEW.status
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for verification request notifications
CREATE TRIGGER verification_request_notification
AFTER INSERT ON public.verification_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_verification_request();

-- Function to approve verification and update profile
CREATE OR REPLACE FUNCTION public.approve_verification(
  request_id uuid,
  reviewer_id uuid,
  admin_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  req_user_id uuid;
  req_type text;
BEGIN
  -- Get request details
  SELECT user_id, request_type 
  INTO req_user_id, req_type
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
    admin_notes = approve_verification.admin_notes,
    updated_at = now()
  WHERE id = request_id;
  
  -- Update user profile verification status
  UPDATE public.profiles 
  SET is_verified = true, updated_at = now()
  WHERE user_id = req_user_id;
  
  -- Add verification badge
  INSERT INTO public.verification_badges (
    user_id,
    badge_type,
    issued_by,
    metadata
  ) VALUES (
    req_user_id,
    req_type,
    reviewer_id,
    jsonb_build_object('verified_on', now())
  )
  ON CONFLICT (user_id, badge_type) 
  DO UPDATE SET
    is_active = true,
    issued_by = reviewer_id,
    issued_at = now(),
    metadata = jsonb_build_object('verified_on', now());
END;
$$;

-- Function to reject verification
CREATE OR REPLACE FUNCTION public.reject_verification(
  request_id uuid,
  reviewer_id uuid,
  rejection_reason text,
  admin_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update verification request
  UPDATE public.verification_requests 
  SET 
    status = 'rejected',
    reviewed_at = now(),
    reviewed_by = reviewer_id,
    rejection_reason = reject_verification.rejection_reason,
    admin_notes = reject_verification.admin_notes,
    updated_at = now()
  WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Verification request not found or already processed';
  END IF;
END;
$$;