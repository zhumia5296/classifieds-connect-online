-- Create Local Delivery Network tables with real-time tracking

-- Create delivery providers table
CREATE TABLE public.delivery_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('individual', 'business', 'company')),
  vehicle_types TEXT[] NOT NULL DEFAULT '{}',
  service_areas JSONB NOT NULL DEFAULT '{}', -- Store geographic areas as polygons/circles
  base_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  per_km_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  per_minute_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  minimum_order_value NUMERIC(10,2) DEFAULT 0,
  maximum_distance_km INTEGER DEFAULT 50,
  maximum_weight_kg NUMERIC(8,2) DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_available BOOLEAN NOT NULL DEFAULT false,
  current_latitude NUMERIC,
  current_longitude NUMERIC,
  last_location_update TIMESTAMP WITH TIME ZONE,
  rating NUMERIC(3,2) DEFAULT 0,
  total_deliveries INTEGER DEFAULT 0,
  phone_number TEXT,
  emergency_contact TEXT,
  license_plate TEXT,
  insurance_expiry DATE,
  background_check_status TEXT DEFAULT 'pending' CHECK (background_check_status IN ('pending', 'approved', 'rejected')),
  verification_documents JSONB DEFAULT '{}',
  availability_schedule JSONB DEFAULT '{}', -- Store weekly schedule
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create delivery requests table
CREATE TABLE public.delivery_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  ad_id UUID REFERENCES public.ads(id) ON DELETE SET NULL,
  
  -- Pickup details
  pickup_address TEXT NOT NULL,
  pickup_latitude NUMERIC NOT NULL,
  pickup_longitude NUMERIC NOT NULL,
  pickup_contact_name TEXT NOT NULL,
  pickup_contact_phone TEXT NOT NULL,
  pickup_instructions TEXT,
  pickup_time_window_start TIMESTAMP WITH TIME ZONE,
  pickup_time_window_end TIMESTAMP WITH TIME ZONE,
  
  -- Delivery details
  delivery_address TEXT NOT NULL,
  delivery_latitude NUMERIC NOT NULL,
  delivery_longitude NUMERIC NOT NULL,
  delivery_contact_name TEXT NOT NULL,
  delivery_contact_phone TEXT NOT NULL,
  delivery_instructions TEXT,
  delivery_time_window_start TIMESTAMP WITH TIME ZONE,
  delivery_time_window_end TIMESTAMP WITH TIME ZONE,
  
  -- Package details
  package_description TEXT NOT NULL,
  package_weight_kg NUMERIC(8,2),
  package_dimensions JSONB, -- {length, width, height}
  package_value NUMERIC(10,2),
  special_handling TEXT[], -- ['fragile', 'refrigerated', 'urgent', etc.]
  
  -- Delivery preferences
  delivery_type TEXT NOT NULL DEFAULT 'standard' CHECK (delivery_type IN ('standard', 'express', 'scheduled', 'same_day')),
  urgency_level TEXT DEFAULT 'normal' CHECK (urgency_level IN ('low', 'normal', 'high', 'urgent')),
  signature_required BOOLEAN DEFAULT false,
  photo_confirmation_required BOOLEAN DEFAULT false,
  
  -- Pricing
  estimated_distance_km NUMERIC(8,2),
  estimated_duration_minutes INTEGER,
  customer_budget NUMERIC(10,2),
  estimated_cost NUMERIC(10,2),
  final_cost NUMERIC(10,2),
  
  -- Assignment and status
  assigned_provider_id UUID REFERENCES public.delivery_providers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'quoted', 'accepted', 'pickup_scheduled', 'en_route_pickup', 
    'at_pickup', 'picked_up', 'en_route_delivery', 'at_delivery', 
    'delivered', 'failed', 'cancelled'
  )),
  
  -- Timestamps
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  quoted_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  pickup_scheduled_at TIMESTAMP WITH TIME ZONE,
  pickup_started_at TIMESTAMP WITH TIME ZONE,
  picked_up_at TIMESTAMP WITH TIME ZONE,
  delivery_started_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create delivery quotes table
CREATE TABLE public.delivery_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_request_id UUID NOT NULL REFERENCES public.delivery_requests(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.delivery_providers(id) ON DELETE CASCADE,
  quoted_price NUMERIC(10,2) NOT NULL,
  estimated_pickup_time TIMESTAMP WITH TIME ZONE,
  estimated_delivery_time TIMESTAMP WITH TIME ZONE,
  message TEXT,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create real-time delivery tracking table
CREATE TABLE public.delivery_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_request_id UUID NOT NULL REFERENCES public.delivery_requests(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.delivery_providers(id) ON DELETE CASCADE,
  
  -- Location data
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  accuracy_meters NUMERIC(8,2),
  heading_degrees INTEGER, -- 0-360
  speed_kmh NUMERIC(6,2),
  
  -- Status and context
  status TEXT NOT NULL,
  activity_type TEXT, -- 'driving', 'walking', 'stationary', 'loading', 'unloading'
  notes TEXT,
  photo_urls TEXT[],
  
  -- Battery and device info
  battery_level INTEGER, -- 0-100
  device_info JSONB,
  
  -- Timestamps
  tracked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create delivery reviews table
CREATE TABLE public.delivery_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_request_id UUID NOT NULL REFERENCES public.delivery_requests(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.delivery_providers(id) ON DELETE CASCADE,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  care_rating INTEGER CHECK (care_rating >= 1 AND care_rating <= 5),
  
  title TEXT NOT NULL,
  comment TEXT,
  would_recommend BOOLEAN,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_delivery_providers_location ON public.delivery_providers USING GIST (
  POINT(current_longitude, current_latitude)
) WHERE current_latitude IS NOT NULL AND current_longitude IS NOT NULL;

CREATE INDEX idx_delivery_providers_active ON public.delivery_providers (is_active, is_available);
CREATE INDEX idx_delivery_providers_user ON public.delivery_providers (user_id);

CREATE INDEX idx_delivery_requests_status ON public.delivery_requests (status);
CREATE INDEX idx_delivery_requests_user ON public.delivery_requests (user_id);
CREATE INDEX idx_delivery_requests_provider ON public.delivery_requests (assigned_provider_id);
CREATE INDEX idx_delivery_requests_location_pickup ON public.delivery_requests USING GIST (
  POINT(pickup_longitude, pickup_latitude)
);
CREATE INDEX idx_delivery_requests_location_delivery ON public.delivery_requests USING GIST (
  POINT(delivery_longitude, delivery_latitude)
);

CREATE INDEX idx_delivery_quotes_request ON public.delivery_quotes (delivery_request_id);
CREATE INDEX idx_delivery_quotes_provider ON public.delivery_quotes (provider_id);
CREATE INDEX idx_delivery_quotes_active ON public.delivery_quotes (is_active, expires_at);

CREATE INDEX idx_delivery_tracking_request ON public.delivery_tracking (delivery_request_id);
CREATE INDEX idx_delivery_tracking_provider ON public.delivery_tracking (provider_id);
CREATE INDEX idx_delivery_tracking_time ON public.delivery_tracking (tracked_at DESC);

CREATE INDEX idx_delivery_reviews_provider ON public.delivery_reviews (provider_id);
CREATE INDEX idx_delivery_reviews_request ON public.delivery_reviews (delivery_request_id);

-- Enable Row Level Security
ALTER TABLE public.delivery_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for delivery_providers
CREATE POLICY "Providers can manage their own profile" 
ON public.delivery_providers 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Active providers are viewable by everyone" 
ON public.delivery_providers 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage all providers" 
ON public.delivery_providers 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for delivery_requests
CREATE POLICY "Users can manage their own delivery requests" 
ON public.delivery_requests 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Assigned providers can view and update requests" 
ON public.delivery_requests 
FOR ALL 
USING (
  assigned_provider_id IN (
    SELECT id FROM public.delivery_providers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Providers can view pending requests in their area" 
ON public.delivery_requests 
FOR SELECT 
USING (
  status = 'pending' AND 
  EXISTS (
    SELECT 1 FROM public.delivery_providers 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- RLS Policies for delivery_quotes
CREATE POLICY "Providers can manage their own quotes" 
ON public.delivery_quotes 
FOR ALL 
USING (
  provider_id IN (
    SELECT id FROM public.delivery_providers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Request owners can view quotes for their requests" 
ON public.delivery_quotes 
FOR SELECT 
USING (
  delivery_request_id IN (
    SELECT id FROM public.delivery_requests WHERE user_id = auth.uid()
  )
);

-- RLS Policies for delivery_tracking
CREATE POLICY "Providers can insert their own tracking data" 
ON public.delivery_tracking 
FOR INSERT 
WITH CHECK (
  provider_id IN (
    SELECT id FROM public.delivery_providers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Tracking data is viewable by request owner and assigned provider" 
ON public.delivery_tracking 
FOR SELECT 
USING (
  delivery_request_id IN (
    SELECT id FROM public.delivery_requests 
    WHERE user_id = auth.uid() OR assigned_provider_id IN (
      SELECT id FROM public.delivery_providers WHERE user_id = auth.uid()
    )
  )
);

-- RLS Policies for delivery_reviews
CREATE POLICY "Users can create reviews for their requests" 
ON public.delivery_reviews 
FOR INSERT 
WITH CHECK (
  auth.uid() = reviewer_id AND
  delivery_request_id IN (
    SELECT id FROM public.delivery_requests WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Reviews are viewable by everyone" 
ON public.delivery_reviews 
FOR SELECT 
USING (true);

CREATE POLICY "Reviewers can update their own reviews" 
ON public.delivery_reviews 
FOR UPDATE 
USING (auth.uid() = reviewer_id);

-- Create functions for calculations and updates

-- Function to calculate distance between two points
CREATE OR REPLACE FUNCTION public.calculate_delivery_distance(
  lat1 NUMERIC, lng1 NUMERIC, lat2 NUMERIC, lng2 NUMERIC
) RETURNS NUMERIC AS $$
BEGIN
  RETURN public.calculate_distance(lat1, lng1, lat2, lng2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update provider location
CREATE OR REPLACE FUNCTION public.update_provider_location(
  p_provider_id UUID, 
  p_latitude NUMERIC, 
  p_longitude NUMERIC
) RETURNS VOID AS $$
BEGIN
  UPDATE public.delivery_providers 
  SET 
    current_latitude = p_latitude,
    current_longitude = p_longitude,
    last_location_update = now(),
    updated_at = now()
  WHERE id = p_provider_id
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find nearby providers
CREATE OR REPLACE FUNCTION public.find_nearby_providers(
  p_latitude NUMERIC,
  p_longitude NUMERIC,
  p_max_distance_km INTEGER DEFAULT 25,
  p_vehicle_types TEXT[] DEFAULT NULL
) RETURNS TABLE (
  provider_id UUID,
  business_name TEXT,
  provider_type TEXT,
  distance_km NUMERIC,
  rating NUMERIC,
  base_rate NUMERIC,
  per_km_rate NUMERIC,
  vehicle_types TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dp.id,
    dp.business_name,
    dp.provider_type,
    public.calculate_delivery_distance(p_latitude, p_longitude, dp.current_latitude, dp.current_longitude) AS distance_km,
    dp.rating,
    dp.base_rate,
    dp.per_km_rate,
    dp.vehicle_types
  FROM public.delivery_providers dp
  WHERE dp.is_active = true 
    AND dp.is_available = true
    AND dp.current_latitude IS NOT NULL 
    AND dp.current_longitude IS NOT NULL
    AND public.calculate_delivery_distance(p_latitude, p_longitude, dp.current_latitude, dp.current_longitude) <= p_max_distance_km
    AND (p_vehicle_types IS NULL OR dp.vehicle_types && p_vehicle_types)
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update delivery request status
CREATE OR REPLACE FUNCTION public.update_delivery_status(
  p_request_id UUID,
  p_new_status TEXT
) RETURNS VOID AS $$
DECLARE
  current_status TEXT;
  provider_user_id UUID;
BEGIN
  -- Get current status and verify permissions
  SELECT dr.status, dp.user_id INTO current_status, provider_user_id
  FROM public.delivery_requests dr
  LEFT JOIN public.delivery_providers dp ON dr.assigned_provider_id = dp.id
  WHERE dr.id = p_request_id;
  
  -- Check if user has permission to update
  IF NOT (
    EXISTS (SELECT 1 FROM public.delivery_requests WHERE id = p_request_id AND user_id = auth.uid()) OR
    provider_user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  
  -- Update status and relevant timestamp
  UPDATE public.delivery_requests 
  SET 
    status = p_new_status,
    updated_at = now(),
    quoted_at = CASE WHEN p_new_status = 'quoted' THEN now() ELSE quoted_at END,
    accepted_at = CASE WHEN p_new_status = 'accepted' THEN now() ELSE accepted_at END,
    pickup_scheduled_at = CASE WHEN p_new_status = 'pickup_scheduled' THEN now() ELSE pickup_scheduled_at END,
    pickup_started_at = CASE WHEN p_new_status = 'en_route_pickup' THEN now() ELSE pickup_started_at END,
    picked_up_at = CASE WHEN p_new_status = 'picked_up' THEN now() ELSE picked_up_at END,
    delivery_started_at = CASE WHEN p_new_status = 'en_route_delivery' THEN now() ELSE delivery_started_at END,
    delivered_at = CASE WHEN p_new_status = 'delivered' THEN now() ELSE delivered_at END,
    cancelled_at = CASE WHEN p_new_status = 'cancelled' THEN now() ELSE cancelled_at END
  WHERE id = p_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update provider rating
CREATE OR REPLACE FUNCTION public.update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.delivery_providers
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.delivery_reviews
      WHERE provider_id = NEW.provider_id
    ),
    updated_at = now()
  WHERE id = NEW.provider_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for rating updates
CREATE TRIGGER update_provider_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.delivery_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_provider_rating();

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_delivery_providers_updated_at
  BEFORE UPDATE ON public.delivery_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delivery_requests_updated_at
  BEFORE UPDATE ON public.delivery_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delivery_reviews_updated_at
  BEFORE UPDATE ON public.delivery_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_tracking;
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_quotes;

-- Set replica identity for real-time updates
ALTER TABLE public.delivery_requests REPLICA IDENTITY FULL;
ALTER TABLE public.delivery_tracking REPLICA IDENTITY FULL;
ALTER TABLE public.delivery_quotes REPLICA IDENTITY FULL;