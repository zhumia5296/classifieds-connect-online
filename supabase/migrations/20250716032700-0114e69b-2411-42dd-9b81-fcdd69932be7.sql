-- Remove video-related database objects
DROP TABLE IF EXISTS public.ad_videos CASCADE;

-- Remove storage policies for ad-videos bucket
DROP POLICY IF EXISTS "Ad videos are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload videos for their ads" ON storage.objects;
DROP POLICY IF EXISTS "Users can update videos for their ads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete videos for their ads" ON storage.objects;

-- Remove storage bucket
DELETE FROM storage.buckets WHERE id = 'ad-videos';