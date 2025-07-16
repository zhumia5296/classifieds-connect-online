-- Add business profile fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'individual' CHECK (account_type IN ('individual', 'business'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_registration TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_website TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tax_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_hours JSONB;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_description TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_license_url TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON public.profiles(account_type);
CREATE INDEX IF NOT EXISTS idx_profiles_business_name ON public.profiles(business_name) WHERE business_name IS NOT NULL;

-- Update existing profiles to have individual account type
UPDATE public.profiles SET account_type = 'individual' WHERE account_type IS NULL;