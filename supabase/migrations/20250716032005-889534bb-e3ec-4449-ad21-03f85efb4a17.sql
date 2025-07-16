-- Create storage bucket for ad videos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ad-videos', 'ad-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Create ad_videos table similar to ad_images
CREATE TABLE public.ad_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  alt_text TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (ad_id) REFERENCES public.ads(id) ON DELETE CASCADE
);

-- Enable RLS on ad_videos table
ALTER TABLE public.ad_videos ENABLE ROW LEVEL SECURITY;

-- Create policies for ad_videos (similar to ad_images)
CREATE POLICY "Ad videos are viewable with their ads" 
ON public.ad_videos 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM ads 
    WHERE ads.id = ad_videos.ad_id 
    AND (ads.is_active = true OR ads.user_id = auth.uid())
  )
);

CREATE POLICY "Users can manage videos for their own ads" 
ON public.ad_videos 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM ads 
    WHERE ads.id = ad_videos.ad_id 
    AND ads.user_id = auth.uid()
  )
);

-- Create storage policies for ad-videos bucket
CREATE POLICY "Ad videos are publicly viewable"
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'ad-videos');

CREATE POLICY "Users can upload videos for their ads"
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'ad-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update videos for their ads"
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'ad-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete videos for their ads"
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'ad-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create indexes for better performance
CREATE INDEX idx_ad_videos_ad_id ON public.ad_videos(ad_id);
CREATE INDEX idx_ad_videos_is_primary ON public.ad_videos(is_primary) WHERE is_primary = true;