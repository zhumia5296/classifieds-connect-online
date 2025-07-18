-- Create safe meetup spots table
CREATE TABLE public.safe_meetup_spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('police_station', 'business', 'public_facility')),
  address TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  description TEXT,
  operating_hours JSONB DEFAULT '{}',
  has_cameras BOOLEAN DEFAULT false,
  has_security BOOLEAN DEFAULT false,
  is_24_7 BOOLEAN DEFAULT false,
  contact_phone TEXT,
  contact_email TEXT,
  website_url TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.safe_meetup_spots ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Safe meetup spots are viewable by everyone" 
ON public.safe_meetup_spots 
FOR SELECT 
USING (is_active = true AND verification_status = 'verified');

CREATE POLICY "Admins can manage safe meetup spots" 
ON public.safe_meetup_spots 
FOR ALL 
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create index for location-based queries
CREATE INDEX idx_safe_meetup_spots_location ON public.safe_meetup_spots USING GIST (
  point(longitude, latitude)
);

-- Create trigger for updated_at
CREATE TRIGGER update_safe_meetup_spots_updated_at
BEFORE UPDATE ON public.safe_meetup_spots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample safe meetup spots
INSERT INTO public.safe_meetup_spots (
  name, type, address, latitude, longitude, description, 
  has_cameras, has_security, is_24_7, verification_status
) VALUES 
(
  'Central Police Station',
  'police_station',
  '123 Main St, Downtown',
  40.7128,
  -74.0060,
  'Main police station with 24/7 security and surveillance cameras',
  true,
  true,
  true,
  'verified'
),
(
  'SafeMeet Business Center',
  'business',
  '456 Commerce Ave, Business District',
  40.7589,
  -73.9851,
  'Secure business center with monitored parking and security personnel during business hours',
  true,
  true,
  false,
  'verified'
),
(
  'City Hall Public Safety Zone',
  'public_facility',
  '789 Government Plaza',
  40.7282,
  -74.0776,
  'Public safety zone with security cameras and regular patrols',
  true,
  false,
  false,
  'verified'
);