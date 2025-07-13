-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  phone TEXT,
  location TEXT,
  bio TEXT,
  avatar_url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ads table
CREATE TABLE public.ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  condition TEXT CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
  location TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'expired', 'suspended')),
  views_count INTEGER NOT NULL DEFAULT 0,
  featured_until TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ad_images table for multiple images per ad
CREATE TABLE public.ad_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create saved_ads table for user favorites
CREATE TABLE public.saved_ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, ad_id)
);

-- Create reports table for content moderation
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'fraud', 'duplicate', 'other')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table for ad inquiries
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Categories policies (public read, admin write)
CREATE POLICY "Categories are viewable by everyone" 
ON public.categories FOR SELECT 
USING (true);

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Ads policies
CREATE POLICY "Active ads are viewable by everyone" 
ON public.ads FOR SELECT 
USING (is_active = true AND status = 'active');

CREATE POLICY "Users can view their own ads" 
ON public.ads FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ads" 
ON public.ads FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ads" 
ON public.ads FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ads" 
ON public.ads FOR DELETE 
USING (auth.uid() = user_id);

-- Ad images policies
CREATE POLICY "Ad images are viewable with their ads" 
ON public.ad_images FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.ads 
    WHERE ads.id = ad_images.ad_id 
    AND (ads.is_active = true OR ads.user_id = auth.uid())
  )
);

CREATE POLICY "Users can manage images for their own ads" 
ON public.ad_images FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.ads 
    WHERE ads.id = ad_images.ad_id 
    AND ads.user_id = auth.uid()
  )
);

-- Saved ads policies
CREATE POLICY "Users can view their own saved ads" 
ON public.saved_ads FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own saved ads" 
ON public.saved_ads FOR ALL 
USING (auth.uid() = user_id);

-- Reports policies
CREATE POLICY "Users can create reports" 
ON public.reports FOR INSERT 
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" 
ON public.reports FOR SELECT 
USING (auth.uid() = reporter_id);

-- Messages policies
CREATE POLICY "Users can view messages they sent or received" 
ON public.messages FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages" 
ON public.messages FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update messages they received" 
ON public.messages FOR UPDATE 
USING (auth.uid() = recipient_id);

-- Create indexes for better performance
CREATE INDEX idx_ads_category_id ON public.ads(category_id);
CREATE INDEX idx_ads_user_id ON public.ads(user_id);
CREATE INDEX idx_ads_location ON public.ads(location);
CREATE INDEX idx_ads_status_active ON public.ads(status, is_active);
CREATE INDEX idx_ads_featured ON public.ads(is_featured, featured_until);
CREATE INDEX idx_ads_created_at ON public.ads(created_at);
CREATE INDEX idx_ad_images_ad_id ON public.ad_images(ad_id);
CREATE INDEX idx_saved_ads_user_id ON public.saved_ads(user_id);
CREATE INDEX idx_saved_ads_ad_id ON public.saved_ads(ad_id);
CREATE INDEX idx_messages_ad_id ON public.messages(ad_id);
CREATE INDEX idx_messages_participants ON public.messages(sender_id, recipient_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ads_updated_at
  BEFORE UPDATE ON public.ads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample categories
INSERT INTO public.categories (name, slug, description, icon) VALUES
('Electronics', 'electronics', 'Phones, computers, TVs, and electronic devices', 'smartphone'),
('Vehicles', 'vehicles', 'Cars, motorcycles, boats, and automotive parts', 'car'),
('Real Estate', 'real-estate', 'Houses, apartments, and property rentals', 'home'),
('Jobs', 'jobs', 'Employment opportunities and career listings', 'briefcase'),
('For Sale', 'for-sale', 'General items for sale', 'tag'),
('Housing', 'housing', 'Rentals, roommates, and housing services', 'building'),
('Services', 'services', 'Professional and personal services', 'users'),
('Community', 'community', 'Local events, activities, and groups', 'heart'),
('Pets', 'pets', 'Pet adoption, supplies, and services', 'heart'),
('Furniture', 'furniture', 'Home and office furniture', 'sofa');

-- Insert subcategories for Electronics
INSERT INTO public.categories (name, slug, description, parent_id) 
SELECT 'Phones & Tablets', 'phones-tablets', 'Mobile phones and tablets', id 
FROM public.categories WHERE slug = 'electronics';

INSERT INTO public.categories (name, slug, description, parent_id) 
SELECT 'Computers', 'computers', 'Laptops, desktops, and accessories', id 
FROM public.categories WHERE slug = 'electronics';

INSERT INTO public.categories (name, slug, description, parent_id) 
SELECT 'TVs & Audio', 'tvs-audio', 'Television and audio equipment', id 
FROM public.categories WHERE slug = 'electronics';

-- Insert subcategories for Vehicles
INSERT INTO public.categories (name, slug, description, parent_id) 
SELECT 'Cars & Trucks', 'cars-trucks', 'Passenger vehicles and trucks', id 
FROM public.categories WHERE slug = 'vehicles';

INSERT INTO public.categories (name, slug, description, parent_id) 
SELECT 'Motorcycles', 'motorcycles', 'Motorcycles and scooters', id 
FROM public.categories WHERE slug = 'vehicles';

INSERT INTO public.categories (name, slug, description, parent_id) 
SELECT 'Auto Parts', 'auto-parts', 'Vehicle parts and accessories', id 
FROM public.categories WHERE slug = 'vehicles';