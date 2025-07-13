-- Create featured ad orders table to track payments
CREATE TABLE public.featured_ad_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  duration_days INTEGER NOT NULL,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending',
  featured_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.featured_ad_orders ENABLE ROW LEVEL SECURITY;

-- Policies for featured_ad_orders
CREATE POLICY "Users can view their own featured ad orders" 
ON public.featured_ad_orders 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own featured ad orders" 
ON public.featured_ad_orders 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Edge functions can update featured ad orders" 
ON public.featured_ad_orders 
FOR UPDATE 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_featured_ad_orders_updated_at
BEFORE UPDATE ON public.featured_ad_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();