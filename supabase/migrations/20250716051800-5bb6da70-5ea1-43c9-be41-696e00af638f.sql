-- Insert sample ads for testing advanced search filters
INSERT INTO public.ads (
  user_id, category_id, title, description, price, currency, location, 
  condition, contact_email, contact_phone, latitude, longitude, is_active, 
  status, is_featured, created_at
) VALUES 
-- Electronics
(
  '00000000-0000-0000-0000-000000000001',
  '9fba4b1b-cfa8-4a9a-97af-cbdcc23e0411', -- Electronics
  'MacBook Pro 16" 2023 M2 Max',
  'Excellent condition MacBook Pro with M2 Max chip, 32GB RAM, 1TB SSD. Perfect for developers and content creators. Includes original charger and box.',
  2499.99,
  'USD',
  'San Francisco, CA',
  'Like New',
  'seller1@example.com',
  '+1-555-0101',
  37.7749,
  -122.4194,
  true,
  'active',
  true,
  NOW() - INTERVAL '2 days'
),
(
  '00000000-0000-0000-0000-000000000002',
  '8740f4f7-18a8-4b20-9747-365b0d1268e1', -- Phones & Tablets
  'iPhone 15 Pro Max 256GB',
  'Brand new iPhone 15 Pro Max in Natural Titanium. Unlocked, works with all carriers. Still has 1 year warranty.',
  1199.00,
  'USD',
  'New York, NY',
  'New',
  'seller2@example.com',
  '+1-555-0102',
  40.7128,
  -74.0060,
  true,
  'active',
  false,
  NOW() - INTERVAL '1 day'
),
(
  '00000000-0000-0000-0000-000000000003',
  'a0a05268-ea77-4332-9354-6db6d14a9180', -- TVs & Audio
  'Samsung 65" 4K QLED TV',
  'Barely used Samsung QN90A 65-inch QLED 4K TV. Amazing picture quality with quantum dot technology. Perfect for gaming and movies.',
  899.99,
  'USD',
  'Los Angeles, CA',
  'Excellent',
  'seller3@example.com',
  '+1-555-0103',
  34.0522,
  -118.2437,
  true,
  'active',
  true,
  NOW() - INTERVAL '3 days'
),
-- Cars & Vehicles
(
  '00000000-0000-0000-0000-000000000004',
  '3f16a09c-4459-4448-a94f-b8a74b467030', -- Cars & Trucks
  '2020 Tesla Model 3 Long Range',
  'Low mileage Tesla Model 3 with Autopilot, Premium Connectivity, and Supercharging capability. Well maintained, no accidents.',
  35000.00,
  'USD',
  'Austin, TX',
  'Good',
  'seller4@example.com',
  '+1-555-0104',
  30.2672,
  -97.7431,
  true,
  'active',
  false,
  NOW() - INTERVAL '5 days'
),
(
  '00000000-0000-0000-0000-000000000005',
  '1bfbdc38-f65a-401f-b0c2-74fa63932c02', -- Motorcycles
  'Harley Davidson Street 750',
  'Beautiful Harley Davidson Street 750 with low miles. Perfect starter bike or city commuter. Recently serviced.',
  6500.00,
  'USD',
  'Miami, FL',
  'Good',
  'seller5@example.com',
  '+1-555-0105',
  25.7617,
  -80.1918,
  true,
  'active',
  false,
  NOW() - INTERVAL '4 days'
),
-- Furniture & Housing
(
  '00000000-0000-0000-0000-000000000006',
  'f3c5293b-c0a4-465f-9723-aa35e0e67f6f', -- Furniture
  'Mid-Century Modern Dining Set',
  'Beautiful walnut dining table with 6 matching chairs. Authentic 1960s design in excellent condition. Perfect for modern homes.',
  1200.00,
  'USD',
  'Seattle, WA',
  'Excellent',
  'seller6@example.com',
  '+1-555-0106',
  47.6062,
  -122.3321,
  true,
  'active',
  false,
  NOW() - INTERVAL '6 days'
),
(
  '00000000-0000-0000-0000-000000000007',
  '41675ac5-37f3-447f-abb1-bd7d630dda69', -- Housing
  'Luxury Downtown Apartment',
  '2BR/2BA luxury apartment in downtown core. Floor-to-ceiling windows, modern appliances, gym and rooftop access.',
  3500.00,
  'USD',
  'Chicago, IL',
  'New',
  'seller7@example.com',
  '+1-555-0107',
  41.8781,
  -87.6298,
  true,
  'active',
  true,
  NOW() - INTERVAL '1 day'
),
-- Budget items
(
  '00000000-0000-0000-0000-000000000008',
  '84230d43-1ea9-4ff3-8e1e-3efb63473f7e', -- For Sale
  'Vintage Vinyl Records Collection',
  'Amazing collection of classic rock and jazz vinyl records from the 70s and 80s. Over 100 albums in great condition.',
  450.00,
  'USD',
  'Portland, OR',
  'Good',
  'seller8@example.com',
  '+1-555-0108',
  45.5152,
  -122.6784,
  true,
  'active',
  false,
  NOW() - INTERVAL '7 days'
),
(
  '00000000-0000-0000-0000-000000000009',
  'c6336a4d-5c0c-4b7b-a0ea-8dc154a920b8', -- Pets
  'Golden Retriever Puppies',
  'Adorable Golden Retriever puppies ready for their forever homes. Vaccinated, dewormed, and health checked.',
  800.00,
  'USD',
  'Denver, CO',
  'New',
  'seller9@example.com',
  '+1-555-0109',
  39.7392,
  -104.9903,
  true,
  'active',
  false,
  NOW() - INTERVAL '2 days'
),
-- Jobs & Services
(
  '00000000-0000-0000-0000-000000000010',
  'bdaa86f2-4481-4537-ad43-3e315a48b5e7', -- Jobs
  'Senior Software Engineer Position',
  'Remote-friendly senior software engineer position at growing startup. React, Node.js, and AWS experience required.',
  120000.00,
  'USD',
  'Remote',
  'New',
  'hr@example.com',
  '+1-555-0110',
  null,
  null,
  true,
  'active',
  true,
  NOW() - INTERVAL '3 days'
),
(
  '00000000-0000-0000-0000-000000000011',
  'dd07647f-3b10-4baa-bfca-e207aef9864f', -- Services
  'Professional Photography Services',
  'Wedding and event photography services. 10+ years experience, professional equipment, and quick turnaround.',
  500.00,
  'USD',
  'Boston, MA',
  'New',
  'photo@example.com',
  '+1-555-0111',
  42.3601,
  -71.0589,
  true,
  'active',
  false,
  NOW() - INTERVAL '8 days'
),
-- Lower priced items
(
  '00000000-0000-0000-0000-000000000012',
  'dc5e9e5f-8e9e-464e-8596-b0059313cb4b', -- Computers
  'Gaming Keyboard and Mouse Set',
  'Mechanical gaming keyboard with RGB lighting and high-DPI gaming mouse. Perfect for competitive gaming.',
  75.00,
  'USD',
  'Phoenix, AZ',
  'Like New',
  'gamer@example.com',
  '+1-555-0112',
  33.4484,
  -112.0740,
  true,
  'active',
  false,
  NOW() - INTERVAL '1 day'
);

-- Add some sample images for a few ads
INSERT INTO public.ad_images (ad_id, image_url, is_primary, alt_text) 
SELECT 
  a.id,
  'https://picsum.photos/800/600?random=' || ROW_NUMBER() OVER(),
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