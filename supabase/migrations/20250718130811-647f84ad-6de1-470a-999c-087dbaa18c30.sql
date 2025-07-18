-- Add more subcategories to all parent categories
INSERT INTO public.categories (name, slug, parent_id, icon, sort_order) VALUES 
-- Electronics subcategories
('Gaming Consoles', 'gaming-consoles', '9fba4b1b-cfa8-4a9a-97af-cbdcc23e0411', 'gamepad-2', 4),
('Cameras & Photography', 'cameras-photography', '9fba4b1b-cfa8-4a9a-97af-cbdcc23e0411', 'camera', 5),
('Wearables & Smartwatches', 'wearables-smartwatches', '9fba4b1b-cfa8-4a9a-97af-cbdcc23e0411', 'watch', 6),
('Home Appliances', 'home-appliances', '9fba4b1b-cfa8-4a9a-97af-cbdcc23e0411', 'refrigerator', 7),
('Headphones & Audio', 'headphones-audio', '9fba4b1b-cfa8-4a9a-97af-cbdcc23e0411', 'headphones', 8),
('Accessories & Cables', 'accessories-cables', '9fba4b1b-cfa8-4a9a-97af-cbdcc23e0411', 'cable', 9),

-- Vehicles subcategories
('RVs & Campers', 'rvs-campers', '9f9d035e-d39c-45a5-b02c-c0732b45f8f8', 'truck', 4),
('Boats & Watercraft', 'boats-watercraft', '9f9d035e-d39c-45a5-b02c-c0732b45f8f8', 'ship', 5),
('ATVs & Off-Road', 'atvs-off-road', '9f9d035e-d39c-45a5-b02c-c0732b45f8f8', 'mountain', 6),
('Bicycles', 'bicycles', '9f9d035e-d39c-45a5-b02c-c0732b45f8f8', 'bike', 7),
('Scooters & Mopeds', 'scooters-mopeds', '9f9d035e-d39c-45a5-b02c-c0732b45f8f8', 'scooter', 8),
('Commercial Vehicles', 'commercial-vehicles', '9f9d035e-d39c-45a5-b02c-c0732b45f8f8', 'truck', 9),

-- Furniture subcategories
('Living Room', 'living-room', 'f3c5293b-c0a4-465f-9723-aa35e0e67f6f', 'sofa', 1),
('Bedroom', 'bedroom', 'f3c5293b-c0a4-465f-9723-aa35e0e67f6f', 'bed', 2),
('Dining Room', 'dining-room', 'f3c5293b-c0a4-465f-9723-aa35e0e67f6f', 'utensils', 3),
('Office Furniture', 'office-furniture', 'f3c5293b-c0a4-465f-9723-aa35e0e67f6f', 'briefcase', 4),
('Outdoor & Patio', 'outdoor-patio', 'f3c5293b-c0a4-465f-9723-aa35e0e67f6f', 'sun', 5),
('Storage & Organization', 'storage-organization', 'f3c5293b-c0a4-465f-9723-aa35e0e67f6f', 'archive', 6),
('Kids Furniture', 'kids-furniture', 'f3c5293b-c0a4-465f-9723-aa35e0e67f6f', 'baby', 7),
('Antiques & Vintage', 'antiques-vintage', 'f3c5293b-c0a4-465f-9723-aa35e0e67f6f', 'clock', 8),

-- Housing subcategories
('Apartments', 'apartments', '41675ac5-37f3-447f-abb1-bd7d630dda69', 'building', 1),
('Houses', 'houses', '41675ac5-37f3-447f-abb1-bd7d630dda69', 'home', 2),
('Rooms & Shared', 'rooms-shared', '41675ac5-37f3-447f-abb1-bd7d630dda69', 'users', 3),
('Vacation Rentals', 'vacation-rentals', '41675ac5-37f3-447f-abb1-bd7d630dda69', 'palmtree', 4),
('Student Housing', 'student-housing', '41675ac5-37f3-447f-abb1-bd7d630dda69', 'graduation-cap', 5),
('Commercial Space', 'commercial-space', '41675ac5-37f3-447f-abb1-bd7d630dda69', 'store', 6),

-- Jobs subcategories
('Full-time', 'full-time', 'bdaa86f2-4481-4537-ad43-3e315a48b5e7', 'clock', 1),
('Part-time', 'part-time', 'bdaa86f2-4481-4537-ad43-3e315a48b5e7', 'clock-3', 2),
('Freelance & Contract', 'freelance-contract', 'bdaa86f2-4481-4537-ad43-3e315a48b5e7', 'user-check', 3),
('Internships', 'internships', 'bdaa86f2-4481-4537-ad43-3e315a48b5e7', 'graduation-cap', 4),
('Remote Work', 'remote-work', 'bdaa86f2-4481-4537-ad43-3e315a48b5e7', 'laptop', 5),
('Tech & IT', 'tech-it', 'bdaa86f2-4481-4537-ad43-3e315a48b5e7', 'code', 6),
('Healthcare', 'healthcare', 'bdaa86f2-4481-4537-ad43-3e315a48b5e7', 'heart-pulse', 7),
('Education', 'education', 'bdaa86f2-4481-4537-ad43-3e315a48b5e7', 'book', 8),
('Sales & Marketing', 'sales-marketing', 'bdaa86f2-4481-4537-ad43-3e315a48b5e7', 'trending-up', 9),

-- Services subcategories
('Home Improvement', 'home-improvement', 'dd07647f-3b10-4baa-bfca-e207aef9864f', 'hammer', 1),
('Automotive Services', 'automotive-services', 'dd07647f-3b10-4baa-bfca-e207aef9864f', 'wrench', 2),
('Professional Services', 'professional-services', 'dd07647f-3b10-4baa-bfca-e207aef9864f', 'briefcase', 3),
('Beauty & Wellness', 'beauty-wellness', 'dd07647f-3b10-4baa-bfca-e207aef9864f', 'sparkles', 4),
('Event Planning', 'event-planning', 'dd07647f-3b10-4baa-bfca-e207aef9864f', 'calendar', 5),
('Pet Care Services', 'pet-care-services', 'dd07647f-3b10-4baa-bfca-e207aef9864f', 'dog', 6),
('Tutoring & Lessons', 'tutoring-lessons', 'dd07647f-3b10-4baa-bfca-e207aef9864f', 'book-open', 7),
('Cleaning Services', 'cleaning-services', 'dd07647f-3b10-4baa-bfca-e207aef9864f', 'sparkles', 8),

-- Real Estate subcategories
('Residential Sales', 'residential-sales', 'fa0fd71d-cb9f-45bf-a9c6-75300d897e18', 'home', 1),
('Commercial Properties', 'commercial-properties', 'fa0fd71d-cb9f-45bf-a9c6-75300d897e18', 'building', 2),
('Land & Lots', 'land-lots', 'fa0fd71d-cb9f-45bf-a9c6-75300d897e18', 'map', 3),
('Investment Properties', 'investment-properties', 'fa0fd71d-cb9f-45bf-a9c6-75300d897e18', 'trending-up', 4),
('Foreclosures', 'foreclosures', 'fa0fd71d-cb9f-45bf-a9c6-75300d897e18', 'alert-triangle', 5),
('Condos & Townhomes', 'condos-townhomes', 'fa0fd71d-cb9f-45bf-a9c6-75300d897e18', 'building-2', 6),

-- For Sale subcategories
('Clothing & Accessories', 'clothing-accessories', '84230d43-1ea9-4ff3-8e1e-3efb63473f7e', 'shirt', 1),
('Sports & Recreation', 'sports-recreation', '84230d43-1ea9-4ff3-8e1e-3efb63473f7e', 'zap', 2),
('Books & Media', 'books-media', '84230d43-1ea9-4ff3-8e1e-3efb63473f7e', 'book', 3),
('Toys & Games', 'toys-games', '84230d43-1ea9-4ff3-8e1e-3efb63473f7e', 'gamepad-2', 4),
('Musical Instruments', 'musical-instruments', '84230d43-1ea9-4ff3-8e1e-3efb63473f7e', 'music', 5),
('Art & Collectibles', 'art-collectibles', '84230d43-1ea9-4ff3-8e1e-3efb63473f7e', 'palette', 6),
('Tools & Equipment', 'tools-equipment', '84230d43-1ea9-4ff3-8e1e-3efb63473f7e', 'wrench', 7),
('Garden & Outdoor', 'garden-outdoor', '84230d43-1ea9-4ff3-8e1e-3efb63473f7e', 'flower', 8),

-- Pets subcategories
('Dogs', 'dogs', 'c6336a4d-5c0c-4b7b-a0ea-8dc154a920b8', 'dog', 1),
('Cats', 'cats', 'c6336a4d-5c0c-4b7b-a0ea-8dc154a920b8', 'cat', 2),
('Birds', 'birds', 'c6336a4d-5c0c-4b7b-a0ea-8dc154a920b8', 'bird', 3),
('Fish & Aquarium', 'fish-aquarium', 'c6336a4d-5c0c-4b7b-a0ea-8dc154a920b8', 'fish', 4),
('Small Animals', 'small-animals', 'c6336a4d-5c0c-4b7b-a0ea-8dc154a920b8', 'rabbit', 5),
('Reptiles', 'reptiles', 'c6336a4d-5c0c-4b7b-a0ea-8dc154a920b8', 'turtle', 6),
('Pet Supplies', 'pet-supplies', 'c6336a4d-5c0c-4b7b-a0ea-8dc154a920b8', 'shopping-bag', 7),
('Pet Grooming', 'pet-grooming', 'c6336a4d-5c0c-4b7b-a0ea-8dc154a920b8', 'scissors', 8),

-- Community subcategories
('Events & Activities', 'events-activities', 'f69e87d0-5022-4b17-a003-c809262b2551', 'calendar', 1),
('Lost & Found', 'lost-found', 'f69e87d0-5022-4b17-a003-c809262b2551', 'search', 2),
('Rideshare & Carpools', 'rideshare-carpools', 'f69e87d0-5022-4b17-a003-c809262b2551', 'car', 3),
('Classes & Workshops', 'classes-workshops', 'f69e87d0-5022-4b17-a003-c809262b2551', 'book-open', 4),
('Local Groups', 'local-groups', 'f69e87d0-5022-4b17-a003-c809262b2551', 'users', 5),
('Volunteer Opportunities', 'volunteer-opportunities', 'f69e87d0-5022-4b17-a003-c809262b2551', 'heart', 6),
('General Discussion', 'general-discussion', 'f69e87d0-5022-4b17-a003-c809262b2551', 'message-circle', 7);