-- Add shipping information to orders table
ALTER TABLE public.orders ADD COLUMN shipping_method TEXT;
ALTER TABLE public.orders ADD COLUMN shipping_cost NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN shipping_address JSONB;
ALTER TABLE public.orders ADD COLUMN tracking_number TEXT;
ALTER TABLE public.orders ADD COLUMN carrier TEXT;
ALTER TABLE public.orders ADD COLUMN estimated_delivery_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN actual_delivery_date TIMESTAMP WITH TIME ZONE;

-- Create shipping_rates table for flat rate and calculated shipping
CREATE TABLE public.shipping_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  rate_type TEXT NOT NULL CHECK (rate_type IN ('flat', 'calculated', 'free')),
  base_cost NUMERIC DEFAULT 0,
  weight_based BOOLEAN DEFAULT false,
  weight_rate NUMERIC DEFAULT 0, -- cost per pound/kg
  distance_based BOOLEAN DEFAULT false,
  distance_rate NUMERIC DEFAULT 0, -- cost per mile/km
  international BOOLEAN DEFAULT false,
  min_order_for_free NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create shipping_zones table for location-based shipping
CREATE TABLE public.shipping_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  countries TEXT[] DEFAULT array['US'],
  states TEXT[],
  postal_codes TEXT[],
  rate_id UUID REFERENCES public.shipping_rates(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create shipments table for tracking
CREATE TABLE public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  tracking_number TEXT,
  carrier TEXT,
  service_type TEXT,
  status TEXT DEFAULT 'pending',
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  estimated_delivery TIMESTAMP WITH TIME ZONE,
  shipping_address JSONB NOT NULL,
  from_address JSONB,
  weight NUMERIC,
  dimensions JSONB, -- {length, width, height, unit}
  insurance_value NUMERIC,
  signature_required BOOLEAN DEFAULT false,
  tracking_events JSONB DEFAULT '[]',
  customs_info JSONB, -- for international shipments
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create customs_items table for international shipping
CREATE TABLE public.customs_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  value NUMERIC NOT NULL,
  weight NUMERIC,
  hs_tariff_number TEXT,
  origin_country TEXT DEFAULT 'US',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customs_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shipping_rates
CREATE POLICY "Shipping rates are viewable by everyone" ON public.shipping_rates
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage shipping rates" ON public.shipping_rates
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for shipping_zones
CREATE POLICY "Shipping zones are viewable by everyone" ON public.shipping_zones
FOR SELECT USING (true);

CREATE POLICY "Admins can manage shipping zones" ON public.shipping_zones
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for shipments
CREATE POLICY "Users can view shipments for their orders" ON public.shipments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = shipments.order_id 
    AND (o.user_id = auth.uid() OR o.seller_id = auth.uid())
  )
);

CREATE POLICY "Sellers can create shipments for their orders" ON public.shipments
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = shipments.order_id AND o.seller_id = auth.uid()
  )
);

CREATE POLICY "Sellers can update shipments for their orders" ON public.shipments
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = shipments.order_id AND o.seller_id = auth.uid()
  )
);

CREATE POLICY "System can manage all shipments" ON public.shipments
FOR ALL USING (true);

-- RLS Policies for customs_items
CREATE POLICY "Users can view customs items for their shipments" ON public.customs_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.shipments s
    JOIN public.orders o ON s.order_id = o.id
    WHERE s.id = customs_items.shipment_id 
    AND (o.user_id = auth.uid() OR o.seller_id = auth.uid())
  )
);

CREATE POLICY "Sellers can manage customs items" ON public.customs_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.shipments s
    JOIN public.orders o ON s.order_id = o.id
    WHERE s.id = customs_items.shipment_id AND o.seller_id = auth.uid()
  )
);

-- Insert default shipping rates
INSERT INTO public.shipping_rates (name, description, rate_type, base_cost) VALUES
('Free Shipping', 'Free shipping on all orders', 'free', 0),
('Standard Shipping', 'Standard flat rate shipping', 'flat', 5.99),
('Express Shipping', 'Express flat rate shipping', 'flat', 15.99),
('Weight-Based Shipping', 'Calculated shipping based on weight', 'calculated', 2.99),
('International Shipping', 'International shipping rates', 'calculated', 25.00);

-- Update the shipping rates for weight-based
UPDATE public.shipping_rates 
SET weight_based = true, weight_rate = 1.50 
WHERE name = 'Weight-Based Shipping';

-- Update for international
UPDATE public.shipping_rates 
SET international = true, distance_based = true, distance_rate = 0.50
WHERE name = 'International Shipping';

-- Add trigger for updated_at
CREATE TRIGGER update_shipping_rates_updated_at
  BEFORE UPDATE ON public.shipping_rates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();