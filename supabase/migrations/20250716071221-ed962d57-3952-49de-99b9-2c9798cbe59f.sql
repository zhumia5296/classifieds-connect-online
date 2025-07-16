-- Add inventory management to ads table
ALTER TABLE public.ads 
ADD COLUMN quantity_available INTEGER DEFAULT 1,
ADD COLUMN max_quantity_per_order INTEGER DEFAULT 10;

-- Create shopping cart table
CREATE TABLE public.shopping_cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, ad_id)
);

-- Enable RLS on shopping cart
ALTER TABLE public.shopping_cart ENABLE ROW LEVEL SECURITY;

-- RLS policies for shopping cart
CREATE POLICY "Users can manage their own cart items" 
ON public.shopping_cart 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create orders table for purchases
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  stripe_session_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create order items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  ad_id UUID NOT NULL REFERENCES public.ads(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on orders tables
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for orders
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Sellers can view orders for their items" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = seller_id);

CREATE POLICY "System can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update orders" 
ON public.orders 
FOR UPDATE 
USING (true);

-- RLS policies for order items
CREATE POLICY "Users can view order items for their orders" 
ON public.order_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.orders o 
  WHERE o.id = order_id 
  AND (o.user_id = auth.uid() OR o.seller_id = auth.uid())
));

CREATE POLICY "System can manage order items" 
ON public.order_items 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Add triggers for updated_at
CREATE TRIGGER update_shopping_cart_updated_at
BEFORE UPDATE ON public.shopping_cart
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();