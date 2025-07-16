-- Add sample images for featured ads
INSERT INTO public.ad_images (ad_id, image_url, is_primary, alt_text) 
SELECT 
  a.id,
  'https://picsum.photos/800/600?random=' || (ROW_NUMBER() OVER() + 100),
  true,
  'Primary image for ' || a.title
FROM public.ads a 
WHERE a.title IN (
  'MacBook Pro 16" 2023 M2 Max',
  'iPhone 15 Pro Max 256GB', 
  'Samsung 65" 4K QLED TV',
  '2020 Tesla Model 3 Long Range',
  'Luxury Downtown Apartment'
);