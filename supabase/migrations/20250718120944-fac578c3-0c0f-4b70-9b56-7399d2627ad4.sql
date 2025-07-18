-- Add foreign key constraint between ads and profiles tables
ALTER TABLE public.ads 
ADD CONSTRAINT ads_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;